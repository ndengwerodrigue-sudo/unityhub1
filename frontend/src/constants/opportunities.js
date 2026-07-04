export const OPPORTUNITY_TYPES = [
  { value: 'job', label: 'Jobs', icon: 'briefcase' },
  { value: 'internship', label: 'Internships', icon: 'graduation' },
  { value: 'scholarship', label: 'Scholarships', icon: 'award' },
  { value: 'fellowship', label: 'Fellowships', icon: 'users' },
  { value: 'grant', label: 'Grants', icon: 'banknote' },
  { value: 'competition', label: 'Competitions', icon: 'trophy' },
  { value: 'hackathon', label: 'Hackathons', icon: 'code' },
  { value: 'freelance', label: 'Freelance', icon: 'laptop' },
  { value: 'conference', label: 'Conferences', icon: 'mic' },
  { value: 'training', label: 'Training', icon: 'book' },
  { value: 'volunteering', label: 'Volunteering', icon: 'heart' },
  { value: 'mentorship', label: 'Mentorship', icon: 'sparkles' },
  { value: 'funding', label: 'Startup Funding', icon: 'rocket' },
  { value: 'workshop', label: 'Workshops', icon: 'wrench' },
];

export const WORK_MODES = [
  { value: '', label: 'All modes' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
];

export const EMPLOYMENT_TYPES = [
  { value: '', label: 'All types' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'volunteer', label: 'Volunteer' },
];

export const EXPERIENCE_LEVELS = [
  { value: '', label: 'All levels' },
  { value: 'student', label: 'Student' },
  { value: 'entry', label: 'Entry level' },
  { value: 'mid', label: 'Mid level' },
  { value: 'senior', label: 'Senior' },
  { value: 'executive', label: 'Executive' },
];

export const TRENDING_SEARCHES = [
  'Software internship',
  'Remote developer',
  'Scholarship Cameroon',
  'Hackathon 2026',
  'NGO volunteering',
];

export const APPLICATION_STATUSES = {
  pending: { label: 'Pending', color: 'text-amber-400 bg-amber-400/10 border-amber-400/25' },
  reviewed: { label: 'Reviewed', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/25' },
  shortlisted: { label: 'Shortlisted', color: 'text-sky-400 bg-sky-400/10 border-sky-400/25' },
  interview: { label: 'Interview scheduled', color: 'text-violet-400 bg-violet-400/10 border-violet-400/25' },
  accepted: { label: 'Accepted', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25' },
  rejected: { label: 'Rejected', color: 'text-rose-400 bg-rose-400/10 border-rose-400/25' },
  withdrawn: { label: 'Withdrawn', color: 'text-subtle bg-surface/50 border-border/50' },
  submitted: { label: 'Submitted', color: 'text-primary bg-primary/10 border-primary/25' },
};

export const OWNER_APP_ACTIONS = [
  { status: 'reviewed', label: 'Mark reviewed' },
  { status: 'shortlisted', label: 'Shortlist' },
  { status: 'interview', label: 'Schedule interview' },
  { status: 'accepted', label: 'Accept' },
  { status: 'rejected', label: 'Reject' },
];

export function getTypeLabel(type) {
  return OPPORTUNITY_TYPES.find((t) => t.value === type)?.label || type;
}

export function formatSalary(opp) {
  if (opp.stipend) return opp.stipend;
  if (opp.salaryMin != null && opp.salaryMax != null) {
    return `${Number(opp.salaryMin).toLocaleString()} – ${Number(opp.salaryMax).toLocaleString()} ${opp.salaryCurrency || 'XAF'}`;
  }
  if (opp.salaryMin != null) return `From ${Number(opp.salaryMin).toLocaleString()} ${opp.salaryCurrency || 'XAF'}`;
  return null;
}

export function formatWorkMode(mode) {
  const map = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' };
  return map[mode] || mode;
}
