'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, FileCheck2, FolderKanban, Search } from 'lucide-react';
import { PROJECT_CATEGORIES } from '@/lib/project-input';
import { projectApi } from '@/lib/project-api-client';
import { createClient } from '@/lib/supabase';

type Project = {
  id: string;
  title: string;
  project_source: 'company' | 'practice';
  organization_name: string;
  company_verified: boolean;
  status: string;
  category: string;
  difficulty: string;
  project_type: string;
  required_skills: string[];
  estimated_duration_days: number | null;
  deadline: string | null;
  payment_terms: string | null;
  problem_statement: string;
  scope: string;
  deliverables: string | null;
  acceptance_criteria: string | null;
  project_milestones: Array<{
    id: string;
    sequence: number;
    sequence_number?: number;
    title: string;
    description: string;
    acceptance_criteria: string;
    required_deliverables?: string[];
    deadline?: string | null;
    is_required?: boolean;
  }>;
  created_at: string;
};

type Assignment = {
  id: string;
  status: string;
  started_at: string;
  project: Project;
  milestone_progress: Array<{
    milestone_id: string;
    status: 'not_started' | 'in_progress' | 'submitted' | 'revision_requested' | 'approved' | 'completed';
    submission_id: string | null;
    feedback: string | null;
    submitted_at: string | null;
    reviewed_at: string | null;
    completed_at: string | null;
  }>;
  submissions: Array<{
    id: string;
    status: string;
    created_at: string;
    milestone_id: string | null;
    company_feedback: string | null;
    evidence: { fileName?: string; storagePath?: string } | null;
    reflection: string | null;
    reviewed_at: string | null;
  }>;
};

function useProjectData<T>(path: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    projectApi<T[]>(path)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Project data could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [path, refreshKey]);

  return { data, loading, error, refresh };
}

function ProjectSource({ project }: { project: Project }) {
  if (project.project_source === 'practice') return <span className="project-source practice-source">BuildBridge Practice Project</span>;
  return <span className="project-source company-source">{project.company_verified ? 'Verified Company Project' : 'Company Project · verification unavailable'} · {project.organization_name}</span>;
}

export function StudentProjectCatalogue({ careerGoal, onSelectProject }: {
  careerGoal: string;
  onSelectProject: (projectId: string) => void;
}) {
  const { data: projects, loading, error, refresh } = useProjectData<Project>('/api/projects');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [skill, setSkill] = useState('');
  const [difficulty, setDifficulty] = useState('All difficulties');
  const [projectType, setProjectType] = useState('All types');
  const [sort, setSort] = useState('recent');
  const [busyProject, setBusyProject] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const types = useMemo(() => [...new Set(projects.map((project) => project.project_type).filter(Boolean))].sort(), [projects]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const skills = skill.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
    const result = projects.filter((project) => {
      const searchable = [
        project.title,
        project.problem_statement,
        project.scope,
        project.deliverables,
        project.category,
        project.project_type,
        project.organization_name,
        ...project.required_skills,
      ].join(' ').toLowerCase();
      return (!query || searchable.includes(query))
        && (category === 'All categories' || project.category === category)
        && (difficulty === 'All difficulties' || project.difficulty === difficulty)
        && (projectType === 'All types' || project.project_type === projectType)
        && (!skills.length || skills.every((requested) =>
          project.required_skills.some((item) => item.toLowerCase().includes(requested))));
    });

    return result.sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      if (sort === 'duration') return (a.estimated_duration_days ?? Number.MAX_SAFE_INTEGER)
        - (b.estimated_duration_days ?? Number.MAX_SAFE_INTEGER);
      if (sort === 'deadline') return (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31');
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [projects, search, category, skill, difficulty, projectType, sort]);

  async function startProject(project: Project) {
    setBusyProject(project.id);
    setMessage('');
    onSelectProject(project.id);
    try {
      await projectApi(`/api/projects/${project.id}/assignments`, { method: 'POST', body: {} });
      setMessage(`“${project.title}” is now in My Projects.`);
      refresh();
      router.push(`/projects/${project.id}`);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Project could not be started.');
      refresh();
    } finally {
      setBusyProject('');
    }
  }

  return (
    <section className="project-marketplace">
      <div className="section-title">
        <div><h2>Project catalogue</h2><p className="muted">Published projects available to your account.</p></div>
        <span className="pill blue">{filtered.length} {filtered.length === 1 ? 'project' : 'projects'}</span>
      </div>
      <div className="project-filters" role="search">
        <label className="project-search"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, scope, organization…"/></label>
        <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option>{PROJECT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Required skill<input value={skill} onChange={(event) => setSkill(event.target.value)} placeholder="e.g. SQL, React"/></label>
        <label>Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option>All difficulties</option>{['Beginner','Intermediate','Advanced'].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Project type<select value={projectType} onChange={(event) => setProjectType(event.target.value)}><option>All types</option>{types.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Recently published</option><option value="title">Title</option><option value="duration">Shortest duration</option><option value="deadline">Nearest deadline</option></select></label>
      </div>

      {message && <div className="notice" role="status">{message}</div>}
      {loading ? <div className="project-skeletons" aria-label="Loading projects" aria-busy="true"><i/><i/><i/></div>
        : error ? <div className="project-error" role="alert"><p>{error}</p><button className="outline" onClick={refresh}>Retry</button></div>
          : filtered.length === 0 ? <div className="empty-state"><FolderKanban size={40}/><h3>{projects.length ? 'No projects match these filters' : 'No published projects are available'}</h3><p>{projects.length ? 'Adjust your search or filters to see other published projects.' : 'Verified company projects and BuildBridge Practice Projects will appear here when published.'}</p></div>
            : <div className="project-catalogue-grid">{filtered.map((project) => <article className="marketplace-project-card" key={project.id}>
              <div className="marketplace-card-heading"><ProjectSource project={project}/><span className="pill green">{project.status}</span></div>
              <h3>{project.title}</h3>
              <p className="project-organization">{project.organization_name}</p>
              <p className="project-problem">{project.problem_statement}</p>
              <div className="project-card-facts"><span>{project.category}</span><span>{project.difficulty}</span><span>{project.project_type}</span></div>
              <div className="project-skills">{project.required_skills.map((item) => <span key={item}>{item}</span>)}</div>
              <p><b>Scope:</b> {project.scope}</p>
              <p><b>Deliverables:</b> {project.deliverables || 'Not specified'}</p>
              <div className="project-card-meta"><span>Duration: {project.estimated_duration_days ? `${project.estimated_duration_days} days` : 'Not specified'}</span><span>Deadline: {project.deadline || 'Not specified'}</span></div>
              <p className="project-compensation"><b>Compensation:</b> {project.project_source === 'practice' ? 'Practice project; no compensation' : project.payment_terms || 'Not stated by publisher'}</p>
              <div className="project-card-actions"><Link className="outline" href={`/projects/${project.id}`} onClick={() => onSelectProject(project.id)}>Project details</Link><button className="primary" disabled={busyProject === project.id} onClick={() => void startProject(project)}>{busyProject === project.id ? 'Starting…' : 'Start project'}</button></div>
            </article>)}</div>}

      <section className="external-project-links">
        <div className="section-title"><div><h2>External opportunities</h2><p className="muted">Independent third-party listings; these are not BuildBridge assignments.</p></div></div>
        <div className="external-link-grid">
          <a href={`https://github.com/search?q=good-first-issue+${encodeURIComponent(category === 'All categories' ? careerGoal : category)}&type=issues`} target="_blank" rel="noopener noreferrer"><b>GitHub issues</b><span>Explore public contribution opportunities relevant to {careerGoal}.</span><small>External link · no BuildBridge assignment or approval <ExternalLink size={14}/></small></a>
          <a href="https://www.kaggle.com/competitions" target="_blank" rel="noopener noreferrer"><b>Kaggle competitions</b><span>Browse data and machine-learning challenges hosted by Kaggle.</span><small>External link · check each competition’s rules <ExternalLink size={14}/></small></a>
          <a href="https://devpost.com/hackathons" target="_blank" rel="noopener noreferrer"><b>Devpost hackathons</b><span>Explore independently hosted project and hackathon listings.</span><small>External link · terms are set by the host <ExternalLink size={14}/></small></a>
        </div>
      </section>
    </section>
  );
}

function MilestoneEvidence({ assignment, milestone, onSubmitted }: {
  assignment: Assignment;
  milestone: Project['project_milestones'][number];
  onSubmitted: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [reflection, setReflection] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const progress = assignment.milestone_progress.find((item) => item.milestone_id === milestone.id);
  const history = assignment.submissions.filter((item) => item.milestone_id === milestone.id);
  const canSubmit = !progress || progress.status === 'not_started' || progress.status === 'in_progress' || progress.status === 'revision_requested';

  async function submitEvidence() {
    if (!file) return setError('Choose an evidence file first.');
    if (file.size > 10 * 1024 * 1024) return setError('Evidence files must be 10 MB or smaller.');
    const supabase = createClient();
    if (!supabase) return setError('Supabase is not configured.');
    setBusy(true);
    setError('');
    let storagePath = '';
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Your session has expired. Sign in again.');
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      storagePath = `${user.id}/${assignment.project.id}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from('project-evidence')
        .upload(storagePath, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
      if (uploadError) throw uploadError;

      await projectApi('/api/backend', {
        method: 'POST',
        body: {
          action: 'submit_evidence',
          projectId: assignment.project.id,
          assignmentId: assignment.id,
          milestoneId: milestone.id,
          evidence: { storagePath, fileName: file.name, contentType: file.type, size: file.size },
          reflection,
        },
      });
      setFile(null);
      setReflection('');
      onSubmitted();
    } catch (cause) {
      let detail = cause instanceof Error ? cause.message : 'Evidence could not be submitted.';
      if (storagePath) {
        const { error: cleanupError } = await supabase.storage.from('project-evidence').remove([storagePath]);
        if (cleanupError) detail += ` The unused upload could not be removed: ${cleanupError.message}`;
      }
      setError(detail);
    } finally {
      setBusy(false);
    }
  }

  return <div className="milestone-evidence">
    <p>{milestone.description}</p><small><b>Acceptance criteria:</b> {milestone.acceptance_criteria}</small>
    {milestone.required_deliverables?.length ? <p><b>Required deliverables:</b> {milestone.required_deliverables.join(', ')}</p> : null}
    {milestone.deadline && <p><b>Milestone deadline:</b> {milestone.deadline}</p>}
    {!milestone.is_required && <p className="muted">Optional milestone</p>}
    {progress && <p className={`milestone-state milestone-state-${progress.status}`}>
      <FileCheck2 size={16}/>{progress.status.replaceAll('_', ' ')}
      {progress.completed_at && ` · ${new Date(progress.completed_at).toLocaleDateString()}`}
    </p>}
    {history.length > 0 && <div className="submission-history">
      <b>Evidence history ({history.length} {history.length === 1 ? 'attempt' : 'attempts'})</b>
      {history.map((submission) => <div className="submission-history-item" key={submission.id}>
        <span>{submission.evidence?.fileName || 'Evidence file'} · {submission.status.replaceAll('_', ' ')} · {new Date(submission.created_at).toLocaleDateString()}</span>
        {submission.company_feedback && <p>Reviewer feedback: {submission.company_feedback}</p>}
      </div>)}
    </div>}
    {canSubmit ? <div className="milestone-submit">
        <label>Evidence file (10 MB max)<input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)}/></label>
        <label>Reflection<textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="Describe what you completed and how it meets the criteria."/></label>
        {error && <p className="project-error" role="alert">{error}</p>}
        <button className="small-primary" disabled={busy || !file} onClick={() => void submitEvidence()}>{busy ? 'Submitting…' : 'Submit milestone evidence'}</button>
      </div> : null}
  </div>;
}

export function StudentMyProjects() {
  const { data: assignments, loading, error, refresh } = useProjectData<Assignment>('/api/projects?view=my');

  return <section className="project-marketplace">
    <div className="section-title"><div><h2>My Projects</h2><p className="muted">Your persistent assignments, milestone progress, and evidence status.</p></div><span className="pill blue">{assignments.length} assigned</span></div>
    {loading ? <div className="project-skeletons" aria-label="Loading your projects" aria-busy="true"><i/><i/></div>
      : error ? <div className="project-error" role="alert"><p>{error}</p><button className="outline" onClick={refresh}>Retry</button></div>
        : assignments.length === 0 ? <div className="empty-state"><FolderKanban size={40}/><h3>You have not started a project yet</h3><p>Choose a published company or BuildBridge practice project from the catalogue to begin.</p></div>
          : <div className="my-project-list">{assignments.map((assignment) => {
            const milestones = assignment.project.project_milestones || [];
            const requiredMilestones = milestones.filter((milestone) => milestone.is_required !== false);
            const completed = requiredMilestones.filter((milestone) =>
              assignment.milestone_progress.some((item) => item.milestone_id === milestone.id && (item.status === 'approved' || item.status === 'completed'))).length;
            const progress = requiredMilestones.length ? Math.round(completed / requiredMilestones.length * 100) : 0;
            const latestSubmission = assignment.submissions[0];
            return <article className="my-project-card" key={assignment.id}>
              <div className="my-project-heading"><div><ProjectSource project={assignment.project}/><h3>{assignment.project.title}</h3></div><span className="pill blue">{assignment.status.replaceAll('_', ' ')}</span></div>
              <p>{assignment.project.scope}</p>
              <div className="project-card-meta"><span>Started {new Date(assignment.started_at).toLocaleDateString()}</span><span>Deadline: {assignment.project.deadline || 'Not specified'}</span></div>
              <div className="milestone-progress"><div><b>Required milestones</b><span>{completed}/{requiredMilestones.length} complete</span></div><progress value={progress} max="100"/></div>
              {latestSubmission && <div className="submission-status"><b>Latest evidence:</b> {latestSubmission.status.replaceAll('_', ' ')} · {new Date(latestSubmission.created_at).toLocaleDateString()}{latestSubmission.company_feedback && <p>Company feedback: {latestSubmission.company_feedback}</p>}</div>}
              <div className="assignment-milestones">{milestones.map((milestone) => <details key={milestone.id}>
                <summary>Milestone {milestone.sequence_number || milestone.sequence}: {milestone.title}{milestone.is_required === false ? ' · Optional' : ''}</summary>
                <MilestoneEvidence assignment={assignment} milestone={milestone} onSubmitted={refresh}/>
              </details>)}</div>
              <Link className="outline" href={`/projects/${assignment.project.id}`}>View full project brief</Link>
              {assignment.project.project_source === 'practice' && <p className="practice-disclaimer">BuildBridge Practice Project · progress and evidence are learning records, not industry approval or a company-verified credential.</p>}
            </article>;
          })}</div>}
  </section>;
}
