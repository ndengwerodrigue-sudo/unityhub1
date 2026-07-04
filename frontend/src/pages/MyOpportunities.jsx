import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Briefcase, Users, Eye, Bookmark, Loader2, Edit, Trash2, Pause, Play,
  Copy, BarChart3, Inbox, MessageSquare,
} from 'lucide-react';
import api from '../api/axios';
import { normalizeOpportunity } from '../utils/opportunity';
import PageHeading from '../components/layout/PageHeading';
import Button from '../components/ui/Button';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/cn';

const TABS = [
  { id: '', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'closed', label: 'Closed' },
  { id: 'draft', label: 'Drafts' },
];

export default function MyOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);

  const load = async (status = tab) => {
    setLoading(true);
    try {
      const [listRes, statsRes, msgRes] = await Promise.all([
        api.get('/opportunities/mine', { params: status ? { status } : {} }),
        api.get('/opportunities/mine/stats'),
        api.get('/messages/unread-count').catch(() => ({ data: { count: 0 } })),
      ]);
      setOpportunities((listRes.data.opportunities || []).map((o) => normalizeOpportunity(o)));
      setStats(statsRes.data.stats);
      setUnreadMessages(msgRes.data.count);
    } catch {
      toast.error('Failed to load your opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tab]);

  const togglePause = async (opp) => {
    try {
      const res = await api.patch(`/opportunities/${opp.id}/status`, { isActive: !opp.isActive });
      setOpportunities((prev) => prev.map((o) => (o.id === opp.id ? normalizeOpportunity(res.data.opportunity) : o)));
      toast.success(opp.isActive ? 'Opportunity paused' : 'Opportunity reactivated');
    } catch {
      toast.error('Action failed');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this opportunity permanently?')) return;
    try {
      await api.delete(`/opportunities/${id}`);
      setOpportunities((prev) => prev.filter((o) => o.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const duplicate = async (id) => {
    try {
      const res = await api.post(`/opportunities/${id}/duplicate`);
      toast.success('Draft copy created');
      setOpportunities((prev) => [normalizeOpportunity(res.data.opportunity), ...prev]);
    } catch {
      toast.error('Duplicate failed');
    }
  };

  if (loading && !opportunities.length) return <DashboardSkeleton />;

  return (
    <div className="dashboard-page max-w-5xl">
      <PageHeading
        pathname="/opportunities/mine"
        eyebrow="Recruiter"
        title="My opportunities"
        description="Manage listings, track applicants, and view performance."
      />

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Active', value: stats.activeCount, icon: Briefcase },
            { label: 'Applications', value: stats.totalApplications, icon: Users },
            { label: 'Pending review', value: stats.pendingApplications, icon: Inbox, link: '/opportunities/applications/received?status=pending', highlight: stats.pendingApplications > 0 },
            { label: 'Total views', value: stats.totalViews, icon: Eye },
            { label: 'Messages', value: unreadMessages, icon: MessageSquare, link: '/opportunities/messages', highlight: unreadMessages > 0 },
          ].map(({ label, value, icon: Icon, link, highlight }) => {
            const card = (
              <div key={label} className={cn('rounded-xl border border-border/60 bg-surface/25 p-4', highlight && 'border-emerald-500/30 bg-emerald-500/10')}>
                <Icon className={cn('w-4 h-4 mb-2', highlight ? 'text-emerald-400' : 'text-emerald-400')} />
                <p className={cn('text-2xl font-bold tabular-nums', highlight ? 'text-emerald-400' : 'text-foreground')}>{value}</p>
                <p className={cn('text-xs mt-0.5', highlight ? 'text-emerald-400' : 'text-muted')}>{label}</p>
              </div>
            );
            return link ? <Link key={label} to={link}>{card}</Link> : card;
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                tab === t.id
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'border-border/60 text-muted hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Link to="/opportunities/messages">
            <Button variant="secondary" size="sm" className="gap-1.5 relative">
              <MessageSquare className="w-4 h-4" /> Messages
              {unreadMessages > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-emerald-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-background">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Button>
          </Link>
          <Link to="/opportunities/applications/received">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Inbox className="w-4 h-4" /> Received applications
            </Button>
          </Link>
          <Link to="/opportunities/post">
            <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0">Post new</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border/60">
          <Briefcase className="w-12 h-12 text-subtle mx-auto mb-3 opacity-40" />
          <p className="font-medium text-foreground">No opportunities yet</p>
          <Link to="/opportunities/post" className="inline-block mt-4">
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0">Post your first</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => {
            const deadline = opp.deadline ? new Date(opp.deadline) : null;
            const isClosed = !opp.isOpen;
            return (
              <article key={opp.id} className="rounded-2xl border border-border/60 bg-surface/25 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        {opp.typeLabel}
                      </span>
                      <span className={cn(
                        'text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border',
                        isClosed ? 'text-rose-400 bg-rose-400/10 border-rose-400/25' : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25'
                      )}>
                        {isClosed ? 'Closed' : 'Active'}
                      </span>
                    </div>
                    <Link to={`/opportunities/${opp.id}`} className="text-lg font-semibold text-foreground hover:text-emerald-400 transition-colors">
                      {opp.title}
                    </Link>
                    <p className="text-sm text-muted mt-0.5">{opp.company} · {opp.location}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-subtle">
                      <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{opp.applicationCount} applicants</span>
                      <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{opp.viewCount} views</span>
                      <span className="inline-flex items-center gap-1"><Bookmark className="w-3.5 h-3.5" />{opp.bookmarkCount ?? 0} saved</span>
                      {deadline && <span>Deadline {format(deadline, 'MMM d, yyyy')}</span>}
                      {opp.createdAt && <span>Posted {formatDistanceToNow(new Date(opp.createdAt), { addSuffix: true })}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link to={`/opportunities/applications/received?opportunityId=${opp.id}`}>
                      <Button size="sm" variant="secondary" className="gap-1"><Inbox className="w-3.5 h-3.5" />Applicants</Button>
                    </Link>
                    <Link to={`/opportunities/${opp.id}/edit`}>
                      <Button size="sm" variant="secondary" className="gap-1"><Edit className="w-3.5 h-3.5" />Edit</Button>
                    </Link>
                    <Button size="sm" variant="secondary" className="gap-1" onClick={() => togglePause(opp)}>
                      {opp.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {opp.isActive ? 'Pause' : 'Resume'}
                    </Button>
                    <Button size="sm" variant="secondary" className="gap-1" onClick={() => duplicate(opp.id)}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="secondary" className="gap-1 text-rose-400 hover:text-rose-300" onClick={() => remove(opp.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
