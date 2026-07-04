import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, CheckCircle2, User, FileText, HelpCircle, Eye, Send,
  Loader2, Mail, Link2, Phone, MessageCircle,
} from 'lucide-react';
import api from '../api/axios';
import { normalizeOpportunity } from '../utils/opportunity';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';

const STEPS = ['Profile', 'Documents', 'Questions', 'Preview', 'Submit'];

export default function OpportunityApply({ user, setUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  const [form, setForm] = useState({
    applicantName: user?.name || '',
    applicantEmail: user?.email || '',
    phone: user?.phone || '',
    whatsappOptIn: !!user?.whatsappOptIn,
    message: '',
    portfolioUrl: '',
    resumeUrl: '',
    coverLetterUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    websiteUrl: '',
    answers: {},
  });

  useEffect(() => {
    api.get(`/opportunities/${id}`)
      .then((res) => {
        const normalized = normalizeOpportunity(res.data.opportunity, user);
        if (normalized.isOwner) {
          toast.error('You cannot apply to your own opportunity');
          navigate(`/opportunities/${id}`);
          return;
        }
        if (normalized.hasApplied) {
          toast('You already applied to this opportunity');
          navigate(`/opportunities/applications/${normalized.userApplication?.id || ''}`);
          return;
        }
        setOpp(normalized);
      })
      .catch(() => { toast.error('Not found'); navigate('/opportunities'); })
      .finally(() => setLoading(false));
  }, [id, navigate, user]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        applicantName: user.name || f.applicantName,
        applicantEmail: user.email || f.applicantEmail,
        phone: user.phone || f.phone,
        whatsappOptIn: user.whatsappOptIn ?? f.whatsappOptIn,
      }));
    }
  }, [user]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setAnswer = (qId, val) => setForm((f) => ({ ...f, answers: { ...f.answers, [qId]: val } }));

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post(`/opportunities/${id}/apply`, form);
      setSubmitted(res.data.application);
      setConversationId(res.data.conversationId || null);
      if (setUser && (form.phone || form.whatsappOptIn)) {
        try {
          const meRes = await api.get('/auth/me');
          const updatedUser = meRes.data.user;
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch {
          // profile sync optional
        }
      }
      setStep(4);
      toast.success('Application submitted!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!opp) return null;

  const questions = opp.applicationQuestions?.length
    ? opp.applicationQuestions
    : [{ id: 'why', label: 'Why do you want this opportunity?', type: 'long' }];

  return (
    <div className="dashboard-page max-w-2xl mx-auto">
      <Link to={`/opportunities/${id}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to opportunity
      </Link>

      <h1 className="text-xl font-bold text-foreground mb-1">Apply: {opp.title}</h1>
      <p className="text-sm text-muted mb-6">{opp.company}</p>

      <div className="flex gap-1 mb-6 overflow-x-auto">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex-1 min-w-[64px] text-center py-1.5 rounded-lg text-[10px] sm:text-xs font-medium ${
              i === step ? 'bg-primary text-white' : i < step ? 'bg-primary/20 text-primary' : 'bg-surface text-subtle'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <Card className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
            {step === 0 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <User className="w-4 h-4 text-primary" /> Review your profile
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border">
                  <Avatar src={user?.avatar} name={form.applicantName} size="lg" />
                  <div>
                    <p className="font-semibold text-foreground">{form.applicantName}</p>
                    <p className="text-sm text-muted">{user?.role?.replace('_', ' ')}</p>
                    {user?.location && <p className="text-xs text-subtle">{user.location}</p>}
                  </div>
                </div>
                <input className="input-field" placeholder="Full name *" value={form.applicantName} onChange={(e) => set('applicantName', e.target.value)} />
                <input className="input-field" type="email" placeholder="Email *" value={form.applicantEmail} onChange={(e) => set('applicantEmail', e.target.value)} />
                <div>
                  <input
                    className="input-field"
                    placeholder="Phone (for WhatsApp contact)"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                  />
                  <p className="text-xs text-subtle mt-1.5">
                    Saved to your profile and used when recruiters contact you via WhatsApp.
                  </p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer select-none rounded-xl border border-border/60 bg-surface/30 p-4">
                  <input
                    type="checkbox"
                    checked={!!form.whatsappOptIn}
                    disabled={!form.phone?.trim()}
                    onChange={(e) => set('whatsappOptIn', e.target.checked)}
                    className="mt-1 rounded border-border text-primary focus:ring-primary/30 disabled:opacity-40"
                  />
                  <span>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      Allow WhatsApp contact for this opportunity
                    </span>
                    <span className="block text-xs text-muted mt-0.5">
                      Recruiters can open WhatsApp with a pre-filled message about your application.
                    </span>
                  </span>
                </label>
                <input className="input-field" placeholder="LinkedIn URL" value={form.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} />
                <input className="input-field" placeholder="GitHub URL" value={form.githubUrl} onChange={(e) => set('githubUrl', e.target.value)} />
                <input className="input-field" placeholder="Portfolio / website" value={form.portfolioUrl} onChange={(e) => set('portfolioUrl', e.target.value)} />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><FileText className="w-4 h-4 text-primary" /> Documents</div>
                <p className="text-xs text-muted">Paste links to your resume, CV, or cover letter (file upload coming soon).</p>
                <input className="input-field" placeholder="Resume URL" value={form.resumeUrl} onChange={(e) => set('resumeUrl', e.target.value)} />
                <input className="input-field" placeholder="Cover letter URL" value={form.coverLetterUrl} onChange={(e) => set('coverLetterUrl', e.target.value)} />
                <textarea className="input-field min-h-[140px]" placeholder="Cover message (min 20 characters) *" value={form.message} onChange={(e) => set('message', e.target.value)} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><HelpCircle className="w-4 h-4 text-primary" /> Application questions</div>
                {questions.map((q) => (
                  <div key={q.id}>
                    <label className="text-sm font-medium text-foreground">{q.label}</label>
                    {q.type === 'long' ? (
                      <textarea className="input-field mt-1.5" rows={4} value={form.answers[q.id] || ''} onChange={(e) => setAnswer(q.id, e.target.value)} />
                    ) : (
                      <input className="input-field mt-1.5" value={form.answers[q.id] || ''} onChange={(e) => setAnswer(q.id, e.target.value)} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2 font-semibold"><Eye className="w-4 h-4 text-primary" /> Preview</div>
                <p><span className="text-muted">Name:</span> {form.applicantName}</p>
                <p><span className="text-muted">Email:</span> {form.applicantEmail}</p>
                {form.phone && <p><span className="text-muted">Phone:</span> {form.phone}</p>}
                {form.whatsappOptIn && form.phone && (
                  <p className="text-emerald-400 text-xs">WhatsApp contact enabled</p>
                )}
                <p className="whitespace-pre-wrap"><span className="text-muted">Message:</span> {form.message}</p>
                {Object.entries(form.answers).map(([k, v]) => (
                  <p key={k}><span className="text-muted">{k}:</span> {v}</p>
                ))}
              </div>
            )}

            {step === 4 && submitted && (
              <div className="text-center py-6">
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                </motion.div>
                <h2 className="text-xl font-bold text-foreground">Application submitted!</h2>
                <p className="text-muted mt-2 text-sm">Ref: {submitted.applicationNumber}</p>
                <p className="text-xs text-subtle mt-1">Estimated review: 5–10 business days</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                  <Link to="/opportunities/applications"><Button>Track application</Button></Link>
                  {conversationId && (
                    <Link to={`/opportunities/messages?c=${conversationId}`}>
                      <Button variant="secondary" className="gap-1.5">
                        <Mail className="w-4 h-4" /> Message recruiter
                      </Button>
                    </Link>
                  )}
                  <Link to="/opportunities"><Button variant="secondary">Browse more</Button></Link>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {step < 4 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
            {step < 3 ? (
              <Button onClick={() => setStep((s) => s + 1)} className="gap-1">Next <ArrowRight className="w-4 h-4" /></Button>
            ) : (
              <Button onClick={submit} disabled={submitting || !opp.isOpen} className="gap-1">
                <Send className="w-4 h-4" /> {submitting ? 'Submitting…' : 'Submit application'}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
