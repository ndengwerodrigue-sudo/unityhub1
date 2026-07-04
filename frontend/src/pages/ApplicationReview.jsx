import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Mail, Phone, Github, Linkedin, ExternalLink, FileText,
  Download, Loader2, MessageSquare, History,
} from 'lucide-react';
import api from '../api/axios';
import { APPLICATION_STATUSES, OWNER_APP_ACTIONS } from '../constants/opportunities';
import Button from '../components/ui/Button';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/cn';
import { getUserId } from '../utils/ownership';
import SendMessageModal from '../components/opportunities/SendMessageModal';

function StatusBadge({ status }) {
  const meta = APPLICATION_STATUSES[status] || APPLICATION_STATUSES.pending;
  return (
    <span className={cn('text-xs font-semibold uppercase px-2.5 py-1 rounded-md border', meta.color)}>
      {meta.label}
    </span>
  );
}

export default function ApplicationReview({ user, mode = 'owner' }) {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [previousApplications, setPreviousApplications] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversationTimeline, setConversationTimeline] = useState([]);

  const userId = getUserId(user);
  const isOwnerView = mode === 'owner';

  useEffect(() => {
    api.get(`/opportunities/applications/${appId}`)
      .then(async (res) => {
        setApplication(res.data.application);
        setConversationId(res.data.application.conversationId || null);
        setPreviousApplications(res.data.previousApplications || []);
        setNotes(res.data.application.ownerNotes || '');
        if (res.data.application.conversationId) {
          try {
            const tlRes = await api.get(`/conversations/${res.data.application.conversationId}/timeline`);
            setConversationTimeline(tlRes.data.timeline || []);
          } catch { /* timeline optional */ }
        }
      })
      .catch(() => { toast.error('Not found'); navigate(isOwnerView ? '/opportunities/applications/received' : '/opportunities/applications'); })
      .finally(() => setLoading(false));
  }, [appId, navigate, isOwnerView]);

  const updateStatus = async (status) => {
    setSaving(true);
    try {
      const res = await api.patch(`/opportunities/applications/${appId}/status`, { status });
      setApplication(res.data.application);
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    try {
      const res = await api.patch(`/opportunities/applications/${appId}/notes`, { notes });
      setApplication(res.data.application);
      toast.success('Notes saved');
    } catch {
      toast.error('Failed to save notes');
    }
  };

  const withdraw = async () => {
    if (!window.confirm('Withdraw this application?')) return;
    try {
      await api.post(`/opportunities/applications/${appId}/withdraw`);
      toast.success('Application withdrawn');
      navigate('/opportunities/applications');
    } catch {
      toast.error('Cannot withdraw');
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (!application) return null;

  const canManage = isOwnerView || String(application.opportunityOwnerId) === String(userId);
  const isApplicant = String(application.applicantId) === String(userId);

  return (
    <div className="dashboard-page max-w-4xl">
      <Link
        to={isOwnerView ? '/opportunities/applications/received' : '/opportunities/applications'}
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-emerald-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="rounded-2xl border border-border/60 bg-surface/25 p-6 sm:p-8 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <StatusBadge status={application.status} />
            <h1 className="text-2xl font-semibold text-foreground mt-2">{application.applicantName}</h1>
            <p className="text-muted mt-1">
              Applied for <Link to={`/opportunities/${application.opportunityId}`} className="text-emerald-400 hover:underline">{application.opportunityTitle}</Link>
            </p>
            <p className="text-xs text-subtle mt-2">
              {application.applicationNumber} · {format(new Date(application.createdAt), 'PPP p')}
            </p>
          </div>
          {application.applicant?.avatar && (
            <img src={application.applicant.avatar} alt="" className="w-16 h-16 rounded-xl object-cover border border-border/60" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Section title="Contact">
            <InfoRow icon={Mail} label="Email" value={application.applicantEmail} href={`mailto:${application.applicantEmail}`} />
            {application.phone && <InfoRow icon={Phone} label="Phone" value={application.phone} />}
            {application.applicant?.location && <p className="text-sm text-muted">{application.applicant.location}</p>}
            {application.applicant?.bio && <p className="text-sm text-muted whitespace-pre-wrap mt-2">{application.applicant.bio}</p>}
          </Section>

          <Section title="Cover letter">
            <p className="text-sm text-muted whitespace-pre-wrap leading-relaxed">{application.message}</p>
          </Section>

          {Object.keys(application.answers || {}).length > 0 && (
            <Section title="Custom answers">
              <div className="space-y-3">
                {Object.entries(application.answers).map(([q, a]) => (
                  <div key={q}>
                    <p className="text-xs font-semibold text-subtle uppercase">{q}</p>
                    <p className="text-sm text-muted mt-1">{String(a)}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {previousApplications.length > 0 && canManage && (
            <Section title="Previous applications">
              <div className="space-y-2">
                {previousApplications.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm border-b border-border/40 pb-2">
                    <span className="text-muted">{p.opportunityTitle}</span>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {conversationTimeline.length > 0 && (
            <Section title="Activity timeline">
              <div className="space-y-3">
                {conversationTimeline.map((event, i) => (
                  <div key={event.id || i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500/60 mt-1.5 shrink-0" />
                      {i < conversationTimeline.length - 1 && <div className="w-px flex-1 bg-border/40 min-h-[16px]" />}
                    </div>
                    <div className="pb-2">
                      <p className="text-sm text-foreground">{event.description}</p>
                      <p className="text-xs text-subtle">{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-surface/30 p-5 space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Documents & links</h3>
            {application.resumeUrl && (
              <DocLink href={application.resumeUrl} icon={FileText} label="Download resume" />
            )}
            {application.coverLetterUrl && (
              <DocLink href={application.coverLetterUrl} icon={FileText} label="Cover letter file" />
            )}
            {application.portfolioUrl && <DocLink href={application.portfolioUrl} icon={ExternalLink} label="Portfolio" />}
            {application.githubUrl && <DocLink href={application.githubUrl} icon={Github} label="GitHub" />}
            {application.linkedinUrl && <DocLink href={application.linkedinUrl} icon={Linkedin} label="LinkedIn" />}
            {application.websiteUrl && <DocLink href={application.websiteUrl} icon={ExternalLink} label="Website" />}
          </div>

          {canManage && isOwnerView && (
            <div className="rounded-xl border border-border/60 bg-surface/30 p-5 space-y-3">
              <h3 className="font-semibold text-sm text-foreground">Manage application</h3>
              <div className="grid grid-cols-1 gap-2">
                {OWNER_APP_ACTIONS.map(({ status, label }) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={application.status === status ? 'primary' : 'secondary'}
                    disabled={saving || application.status === status}
                    onClick={() => updateStatus(status)}
                    className={application.status !== status ? '' : 'bg-emerald-600 border-0'}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="secondary" size="sm" className="flex-1 gap-1.5" onClick={() => setMessageModalOpen(true)}>
                  <MessageSquare className="w-4 h-4" /> Message applicant
                </Button>
                {conversationId && (
                  <Link to={`/opportunities/messages?c=${conversationId}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full gap-1.5">
                      <History className="w-4 h-4" /> Open chat
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {canManage && isOwnerView && (
            <div className="rounded-xl border border-border/60 bg-surface/30 p-5 space-y-2">
              <h3 className="font-semibold text-sm text-foreground">Private notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border/70 text-sm text-foreground resize-y [color-scheme:dark]"
                placeholder="Notes visible only to you…"
              />
              <Button size="sm" variant="secondary" onClick={saveNotes}>Save notes</Button>
            </div>
          )}

          {isApplicant && !isOwnerView && (
            <div className="rounded-xl border border-border/60 bg-surface/30 p-5 space-y-2">
              <Button variant="secondary" size="sm" className="w-full gap-1.5" onClick={() => setMessageModalOpen(true)}>
                <MessageSquare className="w-4 h-4" /> Message recruiter
              </Button>
              {conversationId && (
                <Link to={`/opportunities/messages?c=${conversationId}`} className="block">
                  <Button variant="secondary" size="sm" className="w-full gap-1.5">
                    <History className="w-4 h-4" /> Open chat
                  </Button>
                </Link>
              )}
              {application.status === 'pending' && (
                <Button variant="secondary" size="sm" className="w-full text-rose-400 mt-2" onClick={withdraw}>
                  Withdraw application
                </Button>
              )}
            </div>
          )}
        </aside>
      </div>

      {application && (
        <SendMessageModal
          isOpen={messageModalOpen}
          onClose={() => setMessageModalOpen(false)}
          conversationId={conversationId}
          opportunityId={application.opportunityId}
          receiverId={isOwnerView ? application.applicantId : application.opportunityOwnerId}
          receiverName={isOwnerView ? application.applicantName : 'Recruiter'}
          receiverPhone={
            isOwnerView
              ? (application.applicantContact?.phone || application.phone)
              : application.ownerContact?.phone
          }
          whatsappOptIn={
            isOwnerView
              ? !!application.applicantContact?.whatsappOptIn
              : !!application.ownerContact?.whatsappOptIn
          }
          applicationId={application.id}
          onSent={(convId) => {
            setConversationId(convId);
            setApplication((a) => ({ ...a, conversationId: convId }));
          }}
        />
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-border/60 bg-surface/25 p-5">
      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="w-1 h-3.5 rounded-full bg-emerald-500/80" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoRow({ icon: Icon, label, value, href }) {
  const content = href ? (
    <a href={href} className="text-sm text-emerald-400 hover:underline">{value}</a>
  ) : (
    <span className="text-sm text-muted">{value}</span>
  );
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-subtle shrink-0" />
      {content}
    </div>
  );
}

function DocLink({ href, icon: Icon, label }) {
  return (
    <a
      href={href.startsWith('http') ? href : href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 text-sm text-emerald-400 hover:underline"
    >
      <Icon className="w-4 h-4" /> {label}
    </a>
  );
}
