import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

function getAuthedClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

async function authenticate(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return { error: 'Sign in to use the AI Mentor.', status: 401 as const };
  const supabase = getAuthedClient(token);
  if (!supabase) return { error: 'Supabase is not configured on this server.', status: 503 as const };
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { error: 'Your session is invalid or expired. Sign in again.', status: 401 as const };
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role,career_goal,full_name,preferred_language,learning_personalization_enabled,bio,education_level,institution,field_of_study,profile_skills,location,degree,department,academic_year,graduation_year,cgpa,coursework')
    .eq('id', user.id).maybeSingle();
  if (profileError) return { error: `Could not load your profile: ${profileError.message}`, status: 400 as const };
  if (!profile) return { error: 'Your BuildBridge profile is missing.', status: 409 as const };
  if (profile.role !== 'student') return { error: 'The AI Mentor is available to student accounts only.', status: 403 as const };
  return { supabase, user, profile };
}

async function buildLearningContext(supabase: ReturnType<typeof getAuthedClient>, userId: string, personalizationEnabled: boolean) {
  if (!supabase || !personalizationEnabled) return {};

  const [skillsResult, activityResult, assignmentsResult, submissionsResult, roadmapResult] = await Promise.all([
    supabase.from('skill_evidence').select('skill,status,source_type,created_at').eq('student_user_id', userId).order('created_at', { ascending: false }).limit(24),
    supabase.from('learning_activity').select('title,topic,action,created_at').eq('student_user_id', userId).order('created_at', { ascending: false }).limit(12),
    supabase.from('project_assignments').select('id,project_id,status,started_at,updated_at').eq('student_user_id', userId).order('updated_at', { ascending: false }).limit(10),
    supabase.from('submissions').select('project_id,milestone_id,status,company_decision,company_feedback,reflection,created_at').eq('student_user_id', userId).order('created_at', { ascending: false }).limit(8),
    supabase.from('student_roadmaps').select('career_goal,steps,updated_at').eq('student_user_id', userId).order('updated_at', { ascending: false }).limit(4),
  ]);

  const projectIds = [...new Set((assignmentsResult.data || []).map((item: any) => item.project_id).filter(Boolean))];
  const [projectsResult, milestonesResult] = projectIds.length ? await Promise.all([
    supabase.from('projects').select('id,title,scope,deliverables,acceptance_criteria,deadline,payment_terms').in('id', projectIds).limit(10),
    supabase.from('project_milestones').select('id,project_id,sequence_number,title,description,acceptance_criteria,required_deliverables,is_required').in('project_id', projectIds).order('sequence_number').limit(60),
  ]) : [{ data: [], error: null }, { data: [], error: null }];

  const projects = (projectsResult.data || []).map((project: any) => ({
    ...project,
    milestones: (milestonesResult.data || []).filter((milestone: any) => milestone.project_id === project.id),
  }));

  return {
    demonstratedSkills: skillsResult.data || [],
    recentLearningActivity: activityResult.data || [],
    activeAssignments: (assignmentsResult.data || []).map((assignment: any) => ({
      status: assignment.status,
      startedAt: assignment.started_at,
      project: projects.find((project: any) => project.id === assignment.project_id) || { id: assignment.project_id },
    })),
    recentSubmissionAttempts: submissionsResult.data || [],
    savedRoadmaps: roadmapResult.data || [],
  };
}

export async function GET(req: Request) {
  try {
    const auth = await authenticate(req);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const url = new URL(req.url);
    const conversationId = url.searchParams.get('conversationId');
    let conversationQuery = auth.supabase.from('mentor_conversations')
      .select('id,page_context,project_id,updated_at')
      .eq('student_user_id', auth.user.id);
    if (conversationId) conversationQuery = conversationQuery.eq('id', conversationId);
    const { data: conversation, error: conversationError } = await conversationQuery
      .order('updated_at', { ascending: false }).limit(1).maybeSingle();
    if (conversationError) return NextResponse.json({ error: `Could not load the AI Mentor conversation: ${conversationError.message}` }, { status: 400 });
    if (!conversation) return NextResponse.json({ conversation: null, messages: [] });
    const { data: messages, error: messagesError } = await auth.supabase.from('mentor_messages')
      .select('id,role,content,created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(100);
    if (messagesError) return NextResponse.json({ error: `Could not load AI Mentor messages: ${messagesError.message}` }, { status: 400 });
    return NextResponse.json({ conversation, messages: messages || [] }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'AI Mentor history request failed.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await authenticate(req);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const body = await req.json().catch(() => ({}));
    const conversationId = String(body.conversationId || '').trim();
    if (!conversationId) return NextResponse.json({ error: 'Select a conversation to clear.' }, { status: 400 });
    const { data: conversation, error: lookupError } = await auth.supabase.from('mentor_conversations')
      .select('id').eq('id', conversationId).eq('student_user_id', auth.user.id).maybeSingle();
    if (lookupError) return NextResponse.json({ error: `Could not verify this conversation: ${lookupError.message}` }, { status: 400 });
    if (!conversation) return NextResponse.json({ error: 'This conversation is not available to your account.' }, { status: 404 });
    const { error } = await auth.supabase.from('mentor_conversations').delete().eq('id', conversationId).eq('student_user_id', auth.user.id);
    if (error) return NextResponse.json({ error: `The conversation could not be cleared: ${error.message}` }, { status: 400 });
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'AI Mentor conversation could not be cleared.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authenticate(req);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'The AI Mentor is not configured yet. Add GEMINI_API_KEY to the server environment and restart or redeploy.' }, { status: 503 });
    }

    const body = await req.json();
    if (body.action !== 'mentor') return NextResponse.json({ error: 'Unsupported AI action.' }, { status: 400 });
    const prompt = String(body.prompt || '').trim();
    if (!prompt || prompt.length > 4000) return NextResponse.json({ error: 'Your question must be between 1 and 4,000 characters.' }, { status: 400 });
    const pageContext = String(body.pageContext || 'Dashboard').slice(0, 60);
    let projectContext = 'No project is selected.';
    let projectId: string | null = null;
    if (body.projectId) {
      projectId = String(body.projectId).trim();
      const { data: project, error: projectError } = await auth.supabase.from('projects')
        .select('id,title,scope,deliverables,acceptance_criteria,deadline,payment_terms,status')
        .eq('id', projectId).maybeSingle();
      if (projectError) return NextResponse.json({ error: `Could not load the selected project: ${projectError.message}` }, { status: 400 });
      if (!project) return NextResponse.json({ error: 'That project is not available to your account.' }, { status: 404 });
      if (project.status !== 'published') {
        const { data: assignment, error: assignmentError } = await auth.supabase.from('project_assignments')
          .select('id').eq('project_id', projectId).eq('student_user_id', auth.user.id).maybeSingle();
        if (assignmentError) return NextResponse.json({ error: `Could not verify your project assignment: ${assignmentError.message}` }, { status: 400 });
        if (!assignment) return NextResponse.json({ error: 'That project is not assigned to your account.' }, { status: 404 });
      }
      const { data: milestones } = await auth.supabase.from('project_milestones')
        .select('sequence_number,title,description,acceptance_criteria,required_deliverables,is_required')
        .eq('project_id', projectId).order('sequence_number').limit(30);
      projectContext = JSON.stringify({ ...project, milestones: milestones || [] });
    }

    let conversationId = body.conversationId ? String(body.conversationId).trim() : '';
    if (conversationId) {
      const { data: existing, error: existingError } = await auth.supabase.from('mentor_conversations')
        .select('id').eq('id', conversationId).eq('student_user_id', auth.user.id).maybeSingle();
      if (existingError) return NextResponse.json({ error: `Could not access this conversation: ${existingError.message}` }, { status: 400 });
      if (!existing) return NextResponse.json({ error: 'This conversation is not available to your account.' }, { status: 404 });
    } else {
      const { data: conversation, error: createError } = await auth.supabase.from('mentor_conversations')
        .insert({ student_user_id: auth.user.id, page_context: pageContext, project_id: projectId })
        .select('id').single();
      if (createError || !conversation) return NextResponse.json({ error: `Could not create an AI Mentor conversation: ${createError?.message || 'No conversation was returned.'}` }, { status: 400 });
      conversationId = conversation.id;
    }

    const [historyResult, learningContext] = await Promise.all([
      auth.supabase.from('mentor_messages').select('role,content').eq('conversation_id', conversationId)
        .order('created_at', { ascending: false }).limit(10),
      buildLearningContext(auth.supabase, auth.user.id, auth.profile.learning_personalization_enabled !== false),
    ]);
    if (historyResult.error) return NextResponse.json({ error: `Could not load conversation context: ${historyResult.error.message}` }, { status: 400 });
    const history = (historyResult.data || []).reverse()
      .map((message: any) => `${message.role === 'assistant' ? 'Mentor' : 'Student'}: ${message.content}`)
      .join('\n');

    const profileContext = {
      bio: auth.profile.bio,
      educationLevel: auth.profile.education_level,
      institution: auth.profile.institution,
      degree: auth.profile.degree,
      department: auth.profile.department,
      fieldOfStudy: auth.profile.field_of_study,
      academicYear: auth.profile.academic_year,
      graduationYear: auth.profile.graduation_year,
      cgpa: auth.profile.cgpa,
      location: auth.profile.location,
      coursework: auth.profile.coursework || [],
      skills: auth.profile.profile_skills || [],
    };

    const personalizationNote = auth.profile.learning_personalization_enabled === false
      ? 'The student has disabled learning-activity personalization. Do not use learning history, evidence history or roadmap activity to personalize this answer. Use only the question, career goal, profile details and explicitly selected project context.'
      : `Student learning and project context (private to this student): ${JSON.stringify(learningContext)}`;
    const responseLanguage = auth.profile.preferred_language || 'en';
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      contents: `You are BuildBridge's patient, supportive technical mentor. Student: ${auth.profile.full_name || 'learner'}. Career goal: ${auth.profile.career_goal || 'not specified'}. Preferred response language code: ${responseLanguage}. Profile and education context: ${JSON.stringify(profileContext)}. Current workspace page: ${pageContext}. Explicitly selected project context: ${projectContext}. ${personalizationNote} Use only the project scope, deliverables and acceptance criteria provided here; do not invent company requirements. Where a project is selected, help the student work toward its current milestone. Use a Socratic approach: first understand the attempt, break the work into small steps, give one actionable hint at a time, explain concepts constructively, and ask the student to validate their next step. Adapt examples to their field and coursework. Do not immediately provide a complete solution unless the student has already tried and clearly requests it. Never claim to approve work, issue credentials, or have access to confidential company instructions. Conversation so far:\n${history}\nStudent: ${prompt}`,
    });
    const text = response.text?.trim();
    if (!text) return NextResponse.json({ error: 'The AI Mentor returned an empty response. Please try again.' }, { status: 502 });

    const now = new Date().toISOString();
    const { error: messageError } = await auth.supabase.from('mentor_messages').insert([
      { conversation_id: conversationId, student_user_id: auth.user.id, role: 'user', content: prompt },
      { conversation_id: conversationId, student_user_id: auth.user.id, role: 'assistant', content: text },
    ]);
    if (messageError) return NextResponse.json({ error: `The response was generated, but could not be saved to your history: ${messageError.message}` }, { status: 500 });
    const { error: updateError } = await auth.supabase.from('mentor_conversations')
      .update({ page_context: pageContext, project_id: projectId, updated_at: now })
      .eq('id', conversationId).eq('student_user_id', auth.user.id);
    if (updateError) return NextResponse.json({ error: `The response was saved, but conversation metadata could not be updated: ${updateError.message}` }, { status: 500 });
    return NextResponse.json({ text, conversationId }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'AI Mentor request failed.' }, { status: 500 });
  }
}
