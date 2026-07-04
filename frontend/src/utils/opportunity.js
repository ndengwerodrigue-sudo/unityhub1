import { getTypeLabel, formatSalary, formatWorkMode } from '../constants/opportunities';
import { isResourceOwner, getUserId } from './ownership';

export const normalizeOpportunity = (opp, user = null) => {
  const contact = opp?.contactInfo || opp?.contact || {};
  const deadline = opp?.deadline;
  const isDeadlineValid = deadline ? new Date(deadline) > new Date() : false;
  const maxOk =
    opp?.maxApplicants == null ||
    (opp?.applicationCount ?? opp?.application_count ?? 0) < opp.maxApplicants;
  const isOpen =
    (opp?.isActive ?? true) &&
    (opp?.status ?? 'published') === 'published' &&
    isDeadlineValid &&
    maxOk;
  const posterEmail = opp?.posterEmail || opp?.creator?.email || contact.email || '';
  const posterName = opp?.posterName || opp?.creator?.name || 'Opportunity poster';

  const workMode = opp?.workMode || opp?.work_mode || 'onsite';
  const isOwner = opp?.isOwner ?? isResourceOwner(opp, user);
  const hasApplied = !!opp?.hasApplied;
  const userApplication = opp?.userApplication || null;

  return {
    ...opp,
    posterEmail,
    posterName,
    isOwner,
    hasApplied,
    userApplication,
    contactInfo: {
      email: contact.email || '',
      phone: contact.phone || '',
      website: contact.website || '',
    },
    workMode,
    employmentType: opp?.employmentType || opp?.employment_type,
    experienceLevel: opp?.experienceLevel || opp?.experience_level,
    salaryMin: opp?.salaryMin ?? opp?.salary_min,
    salaryMax: opp?.salaryMax ?? opp?.salary_max,
    salaryCurrency: opp?.salaryCurrency || opp?.salary_currency || 'XAF',
    stipend: opp?.stipend,
    skills: opp?.skills || [],
    tags: opp?.tags || [],
    responsibilities: opp?.responsibilities || '',
    requirements: opp?.requirements || '',
    benefits: opp?.benefits || '',
    companyDescription: opp?.companyDescription || opp?.company_description || '',
    industry: opp?.industry || '',
    companyLogo: opp?.companyLogo || opp?.company_logo,
    isVerified: !!opp?.isVerified || !!opp?.is_verified,
    isFeatured: !!opp?.isFeatured || !!opp?.is_featured,
    viewCount: opp?.viewCount ?? opp?.view_count ?? 0,
    applicationCount: opp?.applicationCount ?? opp?.application_count ?? 0,
    applicationQuestions: opp?.applicationQuestions || opp?.application_questions || [],
    requiredDocuments: opp?.requiredDocuments || opp?.required_documents || [],
    maxApplicants: opp?.maxApplicants ?? opp?.max_applicants,
    applicationProcess: opp?.applicationProcess || opp?.application_process || '',
    faq: opp?.faq || [],
    isSaved: !!opp?.isSaved || !!opp?.is_saved,
    isOpen,
    typeLabel: getTypeLabel(opp?.type),
    salaryLabel: formatSalary(opp),
    workModeLabel: formatWorkMode(workMode),
  };
};
