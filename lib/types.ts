export type Role = 'student' | 'company_member' | 'admin';
export type SkillStatus = 'studied' | 'practiced' | 'demonstrated' | 'company_verified';
export type Opportunity = { id:string; title:string; company:string; type:string; compensation:string; mode:string; duration:string; skills:string[]; description:string; sample?:boolean };
