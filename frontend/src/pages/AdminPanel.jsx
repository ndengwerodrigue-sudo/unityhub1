import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Briefcase, Users, Calendar, Loader2 } from 'lucide-react';
import api from '../api/axios';
import PageHeading from '../components/layout/PageHeading';
import { DashboardSkeleton } from '../components/ui/Skeleton';

export default function AdminPanel({ user }) {
  const [overview, setOverview] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    Promise.all([
      api.get('/admin/overview'),
      api.get('/admin/opportunities', { params: { limit: 10 } }),
      api.get('/admin/applications', { params: { limit: 10 } }),
      api.get('/admin/events', { params: { limit: 10 } }),
    ])
      .then(([ov, opps, apps, evs]) => {
        setOverview(ov.data.stats);
        setOpportunities(opps.data.opportunities || []);
        setApplications(apps.data.applications || []);
        setEvents(evs.data.events || []);
      })
      .catch(() => toast.error('Admin data unavailable'))
      .finally(() => setLoading(false));
  }, [user]);

  if (user?.role !== 'admin') {
    return (
      <div className="dashboard-page max-w-lg text-center py-20">
        <Shield className="w-12 h-12 text-subtle mx-auto mb-3 opacity-40" />
        <p className="text-foreground font-medium">Admin access required</p>
      </div>
    );
  }

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="dashboard-page max-w-5xl">
      <PageHeading pathname="/admin" eyebrow="Administration" title="Platform overview" description="All opportunities, applications, and events." />

      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Opportunities', value: overview.opportunities, icon: Briefcase },
            { label: 'Applications', value: overview.applications, icon: Users },
            { label: 'Events', value: overview.events, icon: Calendar },
            { label: 'Users', value: overview.users, icon: Shield },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-border/60 bg-surface/25 p-4">
              <Icon className="w-4 h-4 text-emerald-400 mb-2" />
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      )}

      <AdminSection title="Recent opportunities" items={opportunities} render={(o) => (
        <Link to={`/opportunities/${o.id}`} className="block text-sm hover:text-emerald-400">
          {o.title} · {o.company}
        </Link>
      )} />
      <AdminSection title="Recent applications" items={applications} render={(a) => (
        <span className="text-sm text-muted">{a.applicantName} → {a.opportunityTitle}</span>
      )} />
      <AdminSection title="Recent events" items={events} render={(e) => (
        <span className="text-sm text-muted">{e.title} · {e.organizer}</span>
      )} />
    </div>
  );
}

function AdminSection({ title, items, render }) {
  return (
    <section className="rounded-xl border border-border/60 bg-surface/25 p-5 mb-4">
      <h2 className="text-sm font-semibold text-foreground mb-3">{title}</h2>
      <div className="space-y-2">{items.map((item) => <div key={item.id}>{render(item)}</div>)}</div>
    </section>
  );
}
