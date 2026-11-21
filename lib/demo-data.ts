export type DemoRole = 'student' | 'company_member' | 'admin';

export function getDemoProfile(role: DemoRole) {
  const profiles = {
    student: {
      id: 'demo-student',
      email: 'student.demo@buildbridge.local',
      full_name: 'Aarav Sharma',
      role: 'student' as const,
      career_goal: 'Data Analyst',
      phone_number: '+91 98765 43210',
      avatar_path: null,
    },
    company_member: {
      id: 'demo-company',
      email: 'company.demo@buildbridge.local',
      full_name: 'Priya Mehta',
      role: 'company_member' as const,
      career_goal: null,
      phone_number: '+91 98765 43211',
      avatar_path: null,
    },
    admin: {
      id: 'demo-admin',
      email: 'admin.demo@buildbridge.local',
      full_name: 'BuildBridge Administrator',
      role: 'admin' as const,
      career_goal: null,
      phone_number: null,
      avatar_path: null,
    },
  };
  return profiles[role];
}

export function getDemoWorkspace(role: DemoRole) {
  const profile = getDemoProfile(role);
  const projects = [
    {
      id: 'demo-project-1',
      title: 'Customer Churn Analysis',
      scope: 'Analyze customer behavior and build an evidence-backed churn dashboard.',
      status: 'published',
      publisher_type: 'verified_company',
      company_name: 'Northstar Analytics',
      deadline: '2026-12-15',
      project_milestones: [
        { id: 'demo-milestone-1', title: 'Data cleaning and exploratory analysis' },
        { id: 'demo-milestone-2', title: 'Churn model and dashboard' },
      ],
    },
    {
      id: 'demo-project-2',
      title: 'Accessible React Portfolio',
      scope: 'Build and deploy a responsive, accessible project portfolio.',
      status: 'published',
      publisher_type: 'platform',
      company_name: null,
      deadline: null,
      project_milestones: [{ id: 'demo-milestone-3', title: 'Accessible portfolio delivery' }],
    },
  ];
  const opportunities = [
    {
      id: 'demo-opportunity-1',
      title: 'Data Analytics Intern',
      status: 'published',
      scope: 'Support dashboard reporting and exploratory analysis.',
      required_skills: ['SQL', 'Data Analysis', 'Python'],
      career_goals: ['Data Analyst'],
      eligibility: 'Undergraduate or recent graduate candidates.',
      organization_name: 'Northstar Analytics',
      location: 'Bengaluru',
      stipend: 'Paid internship',
    },
  ];
  const submissions = [
    {
      id: 'demo-submission-1',
      project_id: 'demo-project-1',
      milestone_id: 'demo-milestone-1',
      student_user_id: 'demo-student',
      status: 'submitted',
      company_decision: null,
      created_at: '2026-11-18T09:30:00.000Z',
    },
  ];
  const skills = [
    { skill: 'SQL', status: 'demonstrated' },
    { skill: 'Python', status: 'practiced' },
    { skill: 'Data Analysis', status: 'company_verified' },
    { skill: 'Pandas', status: 'studied' },
  ];
  const users = [
    { id: 'demo-student', full_name: 'Aarav Sharma', email: 'student.demo@buildbridge.local', role: 'student' },
    { id: 'demo-company', full_name: 'Priya Mehta', email: 'company.demo@buildbridge.local', role: 'company_member' },
  ];
  const companies = [
    {
      id: 'demo-company-record',
      name: 'Northstar Analytics',
      owner_user_id: 'demo-company',
      verification_status: 'verified',
      verified: true,
      created_at: '2026-10-12T10:00:00.000Z',
    },
  ];
  return {
    profile,
    company: role === 'company_member'
      ? { id: 'demo-company-record', name: 'Northstar Analytics', verified: true, verification_status: 'verified' }
      : null,
    projects,
    opportunities,
    submissions,
    assignments: [{ id: 'demo-assignment-1', project_id: 'demo-project-1', status: 'active', started_at: '2026-11-10T10:00:00.000Z' }],
    assignmentMilestones: [{ id: 'demo-assignment-milestone-1', title: 'Data cleaning and exploratory analysis', status: 'completed' }],
    applications: [{ id: 'demo-application-1', opportunity_id: 'demo-opportunity-1', status: 'submitted' }],
    certificates: [
      { id: 'demo-certificate-1', certificate_code: 'BB-DEMO-2026', certificate_type: 'project_evidence', title: 'SQL Data Analysis Project', project_id: 'demo-project-1' },
    ],
    skills,
    learningActivity: [
      { action: 'completed', topic: 'SQL', video_id: 'demo-video-1' },
      { action: 'completed', topic: 'Pandas', video_id: 'demo-video-2' },
    ],
    users,
    companies,
    auditLogs: [
      { id: 'demo-audit-1', action: 'Demo company verified', entity_type: 'company', created_at: '2026-11-20T10:00:00.000Z' },
      { id: 'demo-audit-2', action: 'Demo project published', entity_type: 'project', created_at: '2026-11-19T14:30:00.000Z' },
    ],
  };
}
