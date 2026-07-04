import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Inbox, Filter, Mail, Phone, Github, Linkedin, ExternalLink, FileText, Loader2, MessageSquare,
} from 'lucide-react';
import api from '../api/axios';
import { APPLICATION_STATUSES } from '../constants/opportunities';
import PageHeading from '../components/layout/PageHeading';
import Button from '../components/ui/Button';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/cn';

const STATUS_FILTERS = ['', 'pending', 'reviewed', 'shortlisted', 'interview', 'accepted', 'rejected'];

function StatusBadge({ status }) {
  const meta = APPLICATION_STATUSES[status] || APPLICATION_STATUSES.pending;
  return (
    <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border', meta.color)}>
      {meta.label}
    </span>
  );
}

export default function ReceivedApplications() {
  const [searchParams] = useSearchParams();
  const opportunityId = searchParams.get('opportunityId') || '';
  const initialStatus = searchParams.get('status') || '';
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (initialStatus) setStatusFilter(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (opportunityId) params.opportunityId = opportunityId;
    api.get('/opportunities/applications/received', { params })
      .then((res) => setApplications(res.data.applications || []))
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  }, [statusFilter, opportunityId]);

  const grouped = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? applications.filter((a) =>
          [a.applicantName, a.applicantEmail, a.opportunityTitle, a.company, a.phone]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(term))
        )
      : applications;
    const map = {};
    filtered.forEach((a) => {
      const key = a.opportunityId;
      if (!map[key]) map[key] = { title: a.opportunityTitle, company: a.company, items: [] };
      map[key].items.push(a);
    });
    return Object.values(map);
  }, [applications, search]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="dashboard-page max-w-5xl">
      <PageHeading
        pathname="/opportunities/applications/received"
        eyebrow="Recruiter"
        title="Received applications"
        description="Review every application across your opportunities."
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search applicants, email, opportunity…"
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-background/50 border border-border/70 text-sm text-foreground"
        />
        <Filter className="w-4 h-4 text-emerald-400 shrink-0" />
        {STATUS_FILTERS.map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm border transition-colors',
              statusFilter === s
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'border-border/60 text-muted hover:text-foreground'
            )}
          >
            {s ? (APPLICATION_STATUSES[s]?.label || s) : 'All'}
          </button>
        ))}
        <Link to="/opportunities/mine" className="ml-auto text-sm text-muted hover:text-emerald-400">
          My opportunities →
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border/60">
          <Inbox className="w-12 h-12 text-subtle mx-auto mb-3 opacity-40" />
          <p className="font-medium text-foreground">No applications yet</p>
          <p className="text-sm text-muted mt-1">Applications will appear here when candidates apply.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {!opportunityId && grouped.map((group) => (
            <section key={group.title}>
              <h2 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wider">
                {group.title} · {group.company}
              </h2>
              <div className="space-y-3">{group.items.map((app) => <ApplicationCard key={app.id} app={app} />)}</div>
            </section>
          ))}
          {opportunityId && applications.map((app) => <ApplicationCard key={app.id} app={app} />)}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({ app }) {
  const avatar = app.applicant?.avatar;
  return (
    <article className="rounded-xl border border-border/60 bg-surface/25 p-5">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 overflow-hidden">
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-emerald-400">{app.applicantName?.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{app.applicantName}</h3>
            <StatusBadge status={app.status} />
          </div>
          <p className="text-sm text-muted">{app.opportunityTitle}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-subtle">
            <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{app.applicantEmail}</span>
            {app.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{app.phone}</span>}
            {app.applicant?.location && <span>{app.applicant.location}</span>}
            <span>Applied {format(new Date(app.createdAt), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {app.resumeUrl && (
              <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 inline-flex items-center gap-1 hover:underline">
                <FileText className="w-3 h-3" /> Resume
              </a>
            )}
            {app.portfolioUrl && (
              <a href={app.portfolioUrl} target="_blank" rel="noreferrer" className="text-xs text-muted inline-flex items-center gap-1 hover:text-emerald-400">
                <ExternalLink className="w-3 h-3" /> Portfolio
              </a>
            )}
            {app.githubUrl && (
              <a href={app.githubUrl} target="_blank" rel="noreferrer" className="text-xs text-muted inline-flex items-center gap-1 hover:text-emerald-400">
                <Github className="w-3 h-3" /> GitHub
              </a>
            )}
            {app.linkedinUrl && (
              <a href={app.linkedinUrl} target="_blank" rel="noreferrer" className="text-xs text-muted inline-flex items-center gap-1 hover:text-emerald-400">
                <Linkedin className="w-3 h-3" /> LinkedIn
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Link to={`/opportunities/applications/received/${app.id}`}>
            <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 w-full">Review</Button>
          </Link>
          {app.conversationId ? (
            <Link to={`/opportunities/messages?c=${app.conversationId}`}>
              <Button size="sm" variant="secondary" className="gap-1 w-full"><MessageSquare className="w-3.5 h-3.5" /> Chat</Button>
            </Link>
          ) : (
            <Link to={`/opportunities/applications/received/${app.id}`}>
              <Button size="sm" variant="secondary" className="gap-1 w-full"><MessageSquare className="w-3.5 h-3.5" /> Message</Button>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
