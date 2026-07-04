import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeft, MapPin, Clock, BadgeCheck, Bookmark, Share2, Building2,
  Globe, Mail, Users, Eye, CheckCircle2, Settings, Edit, Trash2, Pause, Play, Inbox, MessageSquare,
} from 'lucide-react';
import api from '../api/axios';
import { normalizeOpportunity } from '../utils/opportunity';
import Button from '../components/ui/Button';
import { DashboardSkeleton } from '../components/ui/Skeleton';

function Section({ title, children }) {
  if (!children || (typeof children === 'string' && !children.trim())) return null;
  return (
    <section className="rounded-xl border border-border/60 bg-surface/25 backdrop-blur-sm p-6">
      <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-emerald-500/80" />
        {title}
      </h2>
      <div className="text-sm text-muted whitespace-pre-wrap leading-relaxed">{children}</div>
    </section>
  );
}

export default function OpportunityDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/opportunities/${id}`)
      .then((res) => setOpp(normalizeOpportunity(res.data.opportunity, user)))
      .catch(() => { toast.error('Not found'); navigate('/opportunities'); })
      .finally(() => setLoading(false));
  }, [id, navigate, user]);

  const togglePause = async () => {
    try {
      const res = await api.patch(`/opportunities/${id}/status`, { isActive: !opp.isActive });
      setOpp(normalizeOpportunity(res.data.opportunity, user));
      toast.success(opp.isActive ? 'Opportunity paused' : 'Reactivated');
    } catch {
      toast.error('Action failed');
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this opportunity?')) return;
    try {
      await api.delete(`/opportunities/${id}`);
      toast.success('Deleted');
      navigate('/opportunities/mine');
    } catch {
      toast.error('Delete failed');
    }
  };

  const toggleSave = async () => {
    if (!localStorage.getItem('token')) return toast.error('Log in to save');
    const res = await api.post(`/opportunities/${id}/save`);
    setOpp((o) => ({ ...o, isSaved: res.data.isSaved }));
    toast.success(res.data.isSaved ? 'Saved' : 'Removed');
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: opp.title, url }); return; } catch { /* */ }
    }
    await navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  if (loading) return <DashboardSkeleton />;
  if (!opp) return null;

  const deadline = opp.deadline ? new Date(opp.deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline - Date.now()) / 86400000) : null;

  return (
    <div className="dashboard-page max-w-5xl">
      <Link to="/opportunities" className="inline-flex items-center gap-2 text-sm text-muted hover:text-emerald-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to opportunities
      </Link>

      {/* Hero */}
      <div className="relative rounded-2xl border border-border/60 overflow-hidden mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-background to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(16,185,129,0.1),transparent)]" />
        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-2xl font-bold text-emerald-400 shrink-0">
              {opp.company?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                  {opp.typeLabel}
                </span>
                {opp.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs text-cyan-400">
                    <BadgeCheck className="w-4 h-4" /> Verified
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">{opp.title}</h1>
              <p className="text-lg text-muted mt-1">{opp.company}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4 text-subtle" />{opp.location}</span>
                <span>{opp.workModeLabel}</span>
                {opp.salaryLabel && <span className="text-emerald-400 font-medium">{opp.salaryLabel}</span>}
                {deadline && (
                  <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-subtle" />{format(deadline, 'MMM d, yyyy')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-4">
          <Section title="Overview">{opp.description}</Section>
          <Section title="Responsibilities">{opp.responsibilities}</Section>
          <Section title="Requirements">{opp.requirements}</Section>
          {opp.skills?.length > 0 && (
            <section className="rounded-xl border border-border/60 bg-surface/25 p-6">
              <h2 className="text-base font-semibold text-foreground mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {opp.skills.map((s) => (
                  <span key={s} className="text-xs bg-background/50 border border-border/50 text-muted px-2.5 py-1 rounded-md">{s}</span>
                ))}
              </div>
            </section>
          )}
          <Section title="Benefits">{opp.benefits}</Section>
          <Section title="Application process">{opp.applicationProcess}</Section>
          <Section title="About the company">{opp.companyDescription}</Section>
          {opp.faq?.length > 0 && (
            <section className="rounded-xl border border-border/60 bg-surface/25 p-6">
              <h2 className="text-base font-semibold text-foreground mb-4">FAQ</h2>
              <div className="space-y-4">
                {opp.faq.map((item, i) => (
                  <div key={i} className="border-b border-border/40 pb-4 last:border-0 last:pb-0">
                    <p className="font-medium text-sm text-foreground">{item.q}</p>
                    <p className="text-sm text-muted mt-1.5 leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="xl:col-span-4 space-y-4 xl:sticky xl:top-24 self-start">
          <div className="rounded-xl border border-border/60 bg-surface/30 backdrop-blur-sm p-5 space-y-4">
            {daysLeft != null && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-2xl font-bold text-amber-400 tabular-nums">{Math.max(0, daysLeft)}</p>
                <p className="text-xs text-muted mt-0.5">days until deadline</p>
              </div>
            )}
            {opp.isOwner ? (
              <>
                <Link to={`/opportunities/applications/received?opportunityId=${id}`} className="block">
                  <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-0 gap-2">
                    <Inbox className="w-4 h-4" />
                    View applicants ({opp.applicationCount})
                  </Button>
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link to={`/opportunities/${id}/edit`}>
                    <Button variant="secondary" className="w-full gap-1.5"><Edit className="w-4 h-4" /> Edit</Button>
                  </Link>
                  <Button variant="secondary" className="gap-1.5" onClick={togglePause}>
                    {opp.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {opp.isActive ? 'Pause' : 'Resume'}
                  </Button>
                </div>
                <Button variant="secondary" className="w-full gap-1.5 text-rose-400" onClick={remove}>
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </>
            ) : opp.hasApplied ? (
              <>
                <Link to={`/opportunities/applications/${opp.userApplication?.id || ''}`} className="block">
                  <Button variant="secondary" className="w-full gap-2" disabled={!opp.userApplication?.id}>
                    <CheckCircle2 className="w-4 h-4" /> Application submitted
                  </Button>
                </Link>
                {opp.userApplication?.conversationId && (
                  <Link to={`/opportunities/messages?c=${opp.userApplication.conversationId}`} className="block">
                    <Button variant="secondary" className="w-full gap-2">
                      <MessageSquare className="w-4 h-4" /> Message recruiter
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <Link to={`/opportunities/${id}/apply`} className="block">
                <Button
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-0"
                  disabled={!opp.isOpen}
                >
                  {opp.isOpen ? 'Apply now' : 'Applications closed'}
                </Button>
              </Link>
            )}
            {!opp.isOwner && (
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1 gap-1.5" onClick={toggleSave}>
                  <Bookmark className={`w-4 h-4 ${opp.isSaved ? 'fill-current text-emerald-400' : ''}`} />
                  {opp.isSaved ? 'Saved' : 'Save'}
                </Button>
                <Button variant="secondary" className="flex-1 gap-1.5" onClick={share}>
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              </div>
            )}
            <div className="text-xs text-subtle space-y-2 pt-2 border-t border-border/50">
              <p className="flex items-center gap-2"><Users className="w-3.5 h-3.5" />{opp.applicationCount} applicants</p>
              <p className="flex items-center gap-2"><Eye className="w-3.5 h-3.5" />{opp.viewCount} views</p>
              {opp.createdAt && <p>Posted {formatDistanceToNow(new Date(opp.createdAt), { addSuffix: true })}</p>}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-surface/30 p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-foreground">
              <Building2 className="w-4 h-4 text-emerald-400" /> Recruiter
            </h3>
            <p className="font-medium text-foreground">{opp.posterName}</p>
            {opp.industry && <p className="text-xs text-muted mt-1">{opp.industry}</p>}
            {opp.posterEmail && (
              <a href={`mailto:${opp.posterEmail}`} className="inline-flex items-center gap-1.5 text-sm text-emerald-400 mt-3 hover:underline">
                <Mail className="w-4 h-4" /> Contact
              </a>
            )}
            {opp.contactInfo?.website && (
              <a
                href={opp.contactInfo.website.startsWith('http') ? opp.contactInfo.website : `https://${opp.contactInfo.website}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted mt-2 hover:text-emerald-400 transition-colors"
              >
                <Globe className="w-4 h-4" /> Website
              </a>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
