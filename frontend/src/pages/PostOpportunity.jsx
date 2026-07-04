import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Loader2,
  FileText, ClipboardList, Eye, Rocket, Plus, Trash2,
} from 'lucide-react';
import api from '../api/axios';
import {
  OPPORTUNITY_TYPES, WORK_MODES, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, getTypeLabel,
} from '../constants/opportunities';
import { formatWorkMode, formatSalary } from '../constants/opportunities';
import Button from '../components/ui/Button';
import { cn } from '../lib/cn';

const STEPS = [
  { id: 'basics', label: 'Basics', icon: FileText },
  { id: 'description', label: 'Details', icon: ClipboardList },
  { id: 'application', label: 'Apply setup', icon: ClipboardList },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'publish', label: 'Publish', icon: Rocket },
];

const DOCUMENT_OPTIONS = [
  { id: 'resume', label: 'Résumé / CV' },
  { id: 'cover_letter', label: 'Cover letter' },
  { id: 'portfolio', label: 'Portfolio link' },
  { id: 'transcript', label: 'Academic transcript' },
  { id: 'certificate', label: 'Certificate' },
];

const fieldClass =
  'w-full h-11 px-3.5 rounded-lg bg-background/50 border border-border/70 text-foreground text-sm ' +
  'placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/30 transition [color-scheme:dark]';

const textareaClass =
  'w-full min-h-[100px] px-3.5 py-3 rounded-lg bg-background/50 border border-border/70 text-foreground text-sm ' +
  'placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/30 transition resize-y [color-scheme:dark]';

const labelClass = 'block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5';

const empty = () => ({
  title: '',
  type: 'job',
  location: '',
  company: '',
  deadline: '',
  workMode: 'onsite',
  employmentType: 'full-time',
  experienceLevel: 'entry',
  salaryMin: '',
  salaryMax: '',
  stipend: '',
  skills: '',
  industry: '',
  description: '',
  responsibilities: '',
  requirements: '',
  benefits: '',
  companyDescription: '',
  applicationProcess: '',
  maxApplicants: '',
  requiredDocuments: ['resume', 'cover_letter'],
  applicationQuestions: [],
  contactInfo: { email: '', phone: '', website: '' },
});

function Field({ label, required, hint, error, children }) {
  return (
    <div>
      <label className={labelClass}>
        {label}{required && <span className="text-emerald-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-subtle mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
    </div>
  );
}

function validateStep(step, form) {
  const errors = {};
  if (step === 0) {
    if (!form.title?.trim()) errors.title = 'Title is required';
    if (!form.company?.trim()) errors.company = 'Company is required';
    if (!form.location?.trim()) errors.location = 'Location is required';
    if (!form.deadline) errors.deadline = 'Deadline is required';
    else if (new Date(form.deadline) <= new Date()) errors.deadline = 'Deadline must be in the future';
  }
  if (step === 1) {
    if (!form.description?.trim()) errors.description = 'Description is required';
    else if (form.description.trim().length < 40) errors.description = 'Write at least 40 characters';
  }
  return errors;
}

export default function PostOpportunity({ user }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [published, setPublished] = useState(null);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setContact = (key, val) =>
    setForm((f) => ({ ...f, contactInfo: { ...f.contactInfo, [key]: val } }));

  const toggleDocument = (id) => {
    setForm((f) => ({
      ...f,
      requiredDocuments: f.requiredDocuments.includes(id)
        ? f.requiredDocuments.filter((d) => d !== id)
        : [...f.requiredDocuments, id],
    }));
  };

  const addQuestion = () => {
    setForm((f) => ({
      ...f,
      applicationQuestions: [...f.applicationQuestions, { id: Date.now(), question: '', required: true }],
    }));
  };

  const updateQuestion = (id, question) => {
    setForm((f) => ({
      ...f,
      applicationQuestions: f.applicationQuestions.map((q) =>
        q.id === id ? { ...q, question } : q
      ),
    }));
  };

  const removeQuestion = (id) => {
    setForm((f) => ({
      ...f,
      applicationQuestions: f.applicationQuestions.filter((q) => q.id !== id),
    }));
  };

  const goNext = () => {
    const stepErrors = validateStep(step, form);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      toast.error('Please fix the highlighted fields');
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const publish = async () => {
    const allErrors = { ...validateStep(0, form), ...validateStep(1, form) };
    if (Object.keys(allErrors).length) {
      setErrors(allErrors);
      toast.error('Complete required fields before publishing');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        maxApplicants: form.maxApplicants ? Number(form.maxApplicants) : null,
        applicationQuestions: form.applicationQuestions
          .filter((q) => q.question?.trim())
          .map(({ question, required }) => ({ question: question.trim(), required: !!required })),
        contactInfo: {
          email: form.contactInfo.email || user?.email,
          phone: form.contactInfo.phone,
          website: form.contactInfo.website,
        },
      };
      const res = await api.post('/opportunities', payload);
      setPublished(res.data.opportunity);
      toast.success('Opportunity published!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to publish');
    } finally {
      setSubmitting(false);
    }
  };

  const salaryLabel = formatSalary({
    salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
    salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
    stipend: form.stipend || null,
    salaryCurrency: 'XAF',
  });

  if (published) {
    return (
      <div className="dashboard-page max-w-lg mx-auto py-16 px-4">
        <div className="relative rounded-2xl border border-border/60 overflow-hidden text-center p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-background to-primary/5" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Your opportunity is live</h1>
            <p className="text-muted mt-2 text-sm">{published.title}</p>
            <p className="text-subtle text-xs mt-1">Visible immediately in the community feed</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Button
                onClick={() => navigate(`/opportunities/${published.id}`)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0"
              >
                View listing
              </Button>
              <Button variant="secondary" onClick={() => navigate('/opportunities')}>
                Back to feed
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page max-w-3xl mx-auto [color-scheme:dark]">
      <Link
        to="/opportunities"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-emerald-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to opportunities
      </Link>

      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-border/50 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-background to-primary/5" />
        <div className="absolute top-0 right-0 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-emerald-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Post to Unity Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            Share an{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              opportunity
            </span>
          </h1>
          <p className="text-sm text-muted mt-2 max-w-xl leading-relaxed">
            Jobs, internships, scholarships, hackathons, and more — published directly to the community database.
          </p>
        </div>
      </section>

      {/* Step indicator */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {STEPS.map(({ label, icon: Icon }, i) => (
          <button
            key={label}
            type="button"
            onClick={() => i < step && setStep(i)}
            disabled={i > step}
            className={cn(
              'flex-1 min-w-[88px] flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-[11px] font-medium border transition-all',
              i === step && 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
              i < step && 'bg-surface/40 border-border/60 text-muted hover:text-emerald-400 cursor-pointer',
              i > step && 'bg-surface/20 border-border/40 text-subtle cursor-not-allowed opacity-60'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-border/60 bg-surface/25 backdrop-blur-sm p-6 sm:p-8">
        {step === 0 && (
          <div className="space-y-4">
            <Field label="Opportunity title" required error={errors.title}>
              <input
                className={fieldClass}
                placeholder="e.g. Frontend Developer Intern"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Type" required>
                <select className={fieldClass} value={form.type} onChange={(e) => set('type', e.target.value)}>
                  {OPPORTUNITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-surface">{t.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Industry">
                <input
                  className={fieldClass}
                  placeholder="e.g. Technology, NGO"
                  value={form.industry}
                  onChange={(e) => set('industry', e.target.value)}
                />
              </Field>
            </div>

            <Field label="Company / organization" required error={errors.company}>
              <input
                className={fieldClass}
                placeholder="Organization name"
                value={form.company}
                onChange={(e) => set('company', e.target.value)}
              />
            </Field>

            <Field label="Location" required error={errors.location}>
              <input
                className={fieldClass}
                placeholder="City, country or Remote"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Work mode">
                <select className={fieldClass} value={form.workMode} onChange={(e) => set('workMode', e.target.value)}>
                  {WORK_MODES.filter((w) => w.value).map((w) => (
                    <option key={w.value} value={w.value} className="bg-surface">{w.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Employment type">
                <select className={fieldClass} value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)}>
                  {EMPLOYMENT_TYPES.filter((t) => t.value).map((t) => (
                    <option key={t.value} value={t.value} className="bg-surface">{t.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Experience level">
              <select className={fieldClass} value={form.experienceLevel} onChange={(e) => set('experienceLevel', e.target.value)}>
                {EXPERIENCE_LEVELS.filter((l) => l.value).map((l) => (
                  <option key={l.value} value={l.value} className="bg-surface">{l.label}</option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Salary min (XAF)" hint="Optional">
                <input className={fieldClass} type="number" min="0" value={form.salaryMin} onChange={(e) => set('salaryMin', e.target.value)} />
              </Field>
              <Field label="Salary max (XAF)" hint="Optional">
                <input className={fieldClass} type="number" min="0" value={form.salaryMax} onChange={(e) => set('salaryMax', e.target.value)} />
              </Field>
            </div>

            <Field label="Stipend / grant amount" hint="Optional, for scholarships & grants">
              <input className={fieldClass} placeholder="e.g. 500,000 XAF" value={form.stipend} onChange={(e) => set('stipend', e.target.value)} />
            </Field>

            <Field label="Application deadline" required error={errors.deadline}>
              <input className={fieldClass} type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
            </Field>

            <Field label="Contact email" hint="Defaults to your account email">
              <input
                className={fieldClass}
                type="email"
                value={form.contactInfo.email || user?.email || ''}
                onChange={(e) => setContact('email', e.target.value)}
              />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Field label="Full description" required error={errors.description} hint="What is this opportunity about?">
              <textarea
                className={textareaClass}
                rows={5}
                placeholder="Describe the role, program, or opportunity in detail…"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </Field>
            <Field label="Responsibilities">
              <textarea className={textareaClass} rows={4} value={form.responsibilities} onChange={(e) => set('responsibilities', e.target.value)} />
            </Field>
            <Field label="Requirements">
              <textarea className={textareaClass} rows={4} value={form.requirements} onChange={(e) => set('requirements', e.target.value)} />
            </Field>
            <Field label="Benefits">
              <textarea className={textareaClass} rows={3} value={form.benefits} onChange={(e) => set('benefits', e.target.value)} />
            </Field>
            <Field label="About the company">
              <textarea className={textareaClass} rows={3} value={form.companyDescription} onChange={(e) => set('companyDescription', e.target.value)} />
            </Field>
            <Field label="Skills" hint="Comma-separated, e.g. React, Python, Leadership">
              <input className={fieldClass} value={form.skills} onChange={(e) => set('skills', e.target.value)} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Field label="Max applicants" hint="Leave empty for unlimited">
              <input className={fieldClass} type="number" min="1" value={form.maxApplicants} onChange={(e) => set('maxApplicants', e.target.value)} />
            </Field>

            <Field label="Application process">
              <textarea className={textareaClass} rows={4} placeholder="How will applicants be evaluated?" value={form.applicationProcess} onChange={(e) => set('applicationProcess', e.target.value)} />
            </Field>

            <div>
              <p className={labelClass}>Required documents</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {DOCUMENT_OPTIONS.map(({ id, label }) => (
                  <label
                    key={id}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors text-sm',
                      form.requiredDocuments.includes(id)
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-border/60 bg-background/30 text-muted hover:border-border'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={form.requiredDocuments.includes(id)}
                      onChange={() => toggleDocument(id)}
                      className="rounded border-border bg-background text-emerald-500 focus:ring-emerald-500/30"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className={labelClass}>Custom application questions</p>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add question
                </button>
              </div>
              {form.applicationQuestions.length === 0 ? (
                <p className="text-xs text-subtle rounded-lg border border-dashed border-border/60 p-4 text-center">
                  No custom questions — applicants will submit a cover message by default.
                </p>
              ) : (
                <div className="space-y-2">
                  {form.applicationQuestions.map((q) => (
                    <div key={q.id} className="flex gap-2">
                      <input
                        className={fieldClass}
                        placeholder="Your question…"
                        value={q.question}
                        onChange={(e) => updateQuestion(q.id, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="shrink-0 p-2.5 rounded-lg border border-border/60 text-muted hover:text-danger hover:border-danger/30 transition-colors"
                        aria-label="Remove question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Contact phone">
                <input className={fieldClass} value={form.contactInfo.phone} onChange={(e) => setContact('phone', e.target.value)} />
              </Field>
              <Field label="Website">
                <input className={fieldClass} placeholder="https://" value={form.contactInfo.website} onChange={(e) => setContact('website', e.target.value)} />
              </Field>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border/50 bg-background/30 p-5">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  {getTypeLabel(form.type)}
                </span>
                {form.industry && (
                  <span className="text-[10px] text-muted bg-surface border border-border/50 px-2 py-0.5 rounded-md">{form.industry}</span>
                )}
              </div>
              <h2 className="text-xl font-semibold text-foreground">{form.title || 'Untitled'}</h2>
              <p className="text-muted text-sm mt-1">{form.company} · {form.location}</p>
              <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted">
                <span>{formatWorkMode(form.workMode)}</span>
                {form.employmentType && <span className="capitalize">{form.employmentType.replace('-', ' ')}</span>}
                {salaryLabel && <span className="text-emerald-400">{salaryLabel}</span>}
                {form.deadline && <span>Deadline: {new Date(form.deadline).toLocaleDateString()}</span>}
              </div>
            </div>

            {form.description && (
              <PreviewBlock title="Description">{form.description}</PreviewBlock>
            )}
            {form.responsibilities && <PreviewBlock title="Responsibilities">{form.responsibilities}</PreviewBlock>}
            {form.requirements && <PreviewBlock title="Requirements">{form.requirements}</PreviewBlock>}
            {form.skills && (
              <div>
                <p className={labelClass}>Skills</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {form.skills.split(',').map((s) => s.trim()).filter(Boolean).map((skill) => (
                    <span key={skill} className="text-[10px] bg-background/50 border border-border/50 text-muted px-2 py-0.5 rounded-md">{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {form.applicationQuestions.filter((q) => q.question?.trim()).length > 0 && (
              <PreviewBlock title="Application questions">
                {form.applicationQuestions.filter((q) => q.question?.trim()).map((q, i) => (
                  <p key={q.id} className="text-sm text-muted">{i + 1}. {q.question}</p>
                ))}
              </PreviewBlock>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-5">
              <Rocket className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Ready to publish?</h2>
            <p className="text-sm text-muted mt-2 max-w-sm mx-auto leading-relaxed">
              <strong className="text-foreground font-medium">{form.title}</strong> will go live immediately and appear in the community feed.
            </p>
            <Button
              onClick={publish}
              disabled={submitting}
              className="mt-8 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-0 min-w-[200px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Publishing…
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" /> Publish opportunity
                </>
              )}
            </Button>
          </div>
        )}

        {/* Navigation */}
        {step < 4 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
            <Button variant="secondary" disabled={step === 0} onClick={goBack}>
              Back
            </Button>
            <Button onClick={goNext} className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 border-0">
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
        {step === 4 && (
          <div className="flex justify-start mt-6 pt-6 border-t border-border/50">
            <Button variant="secondary" onClick={goBack}>Back to preview</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewBlock({ title, children }) {
  return (
    <div>
      <p className={labelClass}>{title}</p>
      <div className="text-sm text-muted whitespace-pre-wrap leading-relaxed mt-1 rounded-lg bg-background/30 border border-border/40 p-4">
        {children}
      </div>
    </div>
  );
}
