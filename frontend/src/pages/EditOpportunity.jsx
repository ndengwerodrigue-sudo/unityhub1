import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import api from '../api/axios';
import {
  OPPORTUNITY_TYPES, WORK_MODES, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS,
} from '../constants/opportunities';
import { normalizeOpportunity } from '../utils/opportunity';
import Button from '../components/ui/Button';
import { DashboardSkeleton } from '../components/ui/Skeleton';

const fieldClass =
  'w-full h-11 px-3.5 rounded-lg bg-background/50 border border-border/70 text-foreground text-sm ' +
  'placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/30 transition [color-scheme:dark]';

const textareaClass =
  'w-full min-h-[120px] px-3.5 py-3 rounded-lg bg-background/50 border border-border/70 text-foreground text-sm ' +
  'placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/30 transition resize-y [color-scheme:dark]';

const labelClass = 'block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5';

export default function EditOpportunity({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    api.get(`/opportunities/${id}`)
      .then((res) => {
        const opp = normalizeOpportunity(res.data.opportunity, user);
        if (!opp.isOwner) {
          toast.error('Not authorized');
          navigate(`/opportunities/${id}`);
          return;
        }
        setForm({
          title: opp.title,
          type: opp.type,
          location: opp.location,
          company: opp.company,
          deadline: opp.deadline ? new Date(opp.deadline).toISOString().slice(0, 16) : '',
          workMode: opp.workMode || 'onsite',
          employmentType: opp.employmentType || 'full-time',
          experienceLevel: opp.experienceLevel || 'entry',
          salaryMin: opp.salaryMin ?? '',
          salaryMax: opp.salaryMax ?? '',
          stipend: opp.stipend || '',
          skills: (opp.skills || []).join(', '),
          industry: opp.industry || '',
          description: opp.description,
          responsibilities: opp.responsibilities || '',
          requirements: opp.requirements || '',
          benefits: opp.benefits || '',
          companyDescription: opp.companyDescription || '',
          applicationProcess: opp.applicationProcess || '',
          maxApplicants: opp.maxApplicants ?? '',
          contactInfo: opp.contactInfo || { email: '', phone: '', website: '' },
        });
      })
      .catch(() => { toast.error('Not found'); navigate('/opportunities/mine'); })
      .finally(() => setLoading(false));
  }, [id, navigate, user]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/opportunities/${id}`, {
        ...form,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        maxApplicants: form.maxApplicants ? Number(form.maxApplicants) : null,
      });
      toast.success('Opportunity updated');
      navigate(`/opportunities/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <DashboardSkeleton />;

  return (
    <div className="dashboard-page max-w-3xl">
      <Link to={`/opportunities/${id}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-emerald-400 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to listing
      </Link>

      <h1 className="text-2xl font-semibold text-foreground mb-6">Edit opportunity</h1>

      <form onSubmit={submit} className="space-y-5">
        <Field label="Title"><input className={fieldClass} value={form.title} onChange={(e) => set('title', e.target.value)} required /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Type">
            <select className={fieldClass} value={form.type} onChange={(e) => set('type', e.target.value)}>
              {OPPORTUNITY_TYPES.map((t) => <option key={t.value} value={t.value} className="bg-surface">{t.label}</option>)}
            </select>
          </Field>
          <Field label="Company"><input className={fieldClass} value={form.company} onChange={(e) => set('company', e.target.value)} required /></Field>
        </div>
        <Field label="Location"><input className={fieldClass} value={form.location} onChange={(e) => set('location', e.target.value)} required /></Field>
        <Field label="Deadline"><input type="datetime-local" className={fieldClass} value={form.deadline} onChange={(e) => set('deadline', e.target.value)} required /></Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Work mode">
            <select className={fieldClass} value={form.workMode} onChange={(e) => set('workMode', e.target.value)}>
              {WORK_MODES.filter((m) => m.value).map((m) => <option key={m.value} value={m.value} className="bg-surface">{m.label}</option>)}
            </select>
          </Field>
          <Field label="Employment">
            <select className={fieldClass} value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)}>
              {EMPLOYMENT_TYPES.filter((t) => t.value).map((t) => <option key={t.value} value={t.value} className="bg-surface">{t.label}</option>)}
            </select>
          </Field>
          <Field label="Experience">
            <select className={fieldClass} value={form.experienceLevel} onChange={(e) => set('experienceLevel', e.target.value)}>
              {EXPERIENCE_LEVELS.filter((l) => l.value).map((l) => <option key={l.value} value={l.value} className="bg-surface">{l.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Description"><textarea className={textareaClass} value={form.description} onChange={(e) => set('description', e.target.value)} required /></Field>
        <Field label="Requirements"><textarea className={textareaClass} value={form.requirements} onChange={(e) => set('requirements', e.target.value)} /></Field>
        <Field label="Skills (comma-separated)"><input className={fieldClass} value={form.skills} onChange={(e) => set('skills', e.target.value)} /></Field>

        <Button type="submit" disabled={saving} className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save changes
        </Button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}
