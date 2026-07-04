import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Briefcase, Filter, MessageSquare } from 'lucide-react';
import api from '../api/axios';
import { APPLICATION_STATUSES } from '../constants/opportunities';
import PageHeading from '../components/layout/PageHeading';
import { Card } from '../components/ui/Card';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/cn';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'interview', label: 'Interviews' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' },
];

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    api.get('/opportunities/applications/me')
      .then((res) => setApplications(res.data.applications || []))
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (tab === 'all') return applications;
    if (tab === 'pending') {
      return applications.filter((a) => a.status === 'pending' || a.status === 'submitted');
    }
    return applications.filter((a) => a.status === tab);
  }, [applications, tab]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="dashboard-page max-w-4xl">
      <PageHeading
        pathname="/opportunities/applications"
        eyebrow="Careers"
        title="My applications"
        description="Track every opportunity you've applied to."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                tab === t.id ? 'bg-primary/15 border-primary/30 text-primary' : 'border-border text-muted hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Link to="/opportunities/messages" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border/60 text-muted hover:text-emerald-400 hover:border-emerald-500/30 transition-colors">
          <MessageSquare className="w-4 h-4" /> Messages
        </Link>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Briefcase className="w-12 h-12 text-subtle mx-auto mb-3 opacity-50" />
          <p className="text-foreground font-medium">No applications yet</p>
          <Link to="/opportunities" className="text-sm text-primary hover:underline mt-2 inline-block">
            Browse opportunities
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const meta = APPLICATION_STATUSES[app.status] || APPLICATION_STATUSES.pending;
            return (
              <Card key={app.id} className="p-5 hover:border-primary/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link to={`/opportunities/applications/${app.id}`} className="font-semibold text-foreground hover:text-emerald-400">
                      {app.opportunityTitle}
                    </Link>
                    <p className="text-sm text-muted">{app.company}</p>
                    <p className="text-xs text-subtle mt-2">
                      Applied {format(new Date(app.createdAt), 'MMM d, yyyy')}
                      {app.applicationNumber && ` · Ref ${app.applicationNumber}`}
                    </p>
                    {app.conversationId && (
                      <Link to={`/opportunities/messages?c=${app.conversationId}`} className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline mt-2">
                        <MessageSquare className="w-3 h-3" /> Open conversation
                      </Link>
                    )}
                  </div>
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border self-start', meta.color)}>
                    {meta.label}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
