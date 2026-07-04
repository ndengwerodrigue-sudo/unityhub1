import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Briefcase,
  Building,
  Calendar,
  TrendingUp,
  Plus,
  MapPin,
  Users,
  Sparkles,
  ArrowRight,
  Clock,
  Zap,
  Target,
  Flame,
  Activity,
} from 'lucide-react'
import { useQuery } from 'react-query'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'react-hot-toast'
import api from '../api/axios'
import StatCard from '../components/ui/StatCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import EngagementChart from '../components/dashboard/EngagementChart'
import ActivityTimeline from '../components/dashboard/ActivityTimeline'
import DashboardHero from '../components/dashboard/DashboardHero'

const statIcons = { post: MessageSquare, opportunity: Briefcase, business: Building, event: Calendar }
const statLinks = { post: '/feed', opportunity: '/opportunities', business: '/businesses', event: '/events' }

const quickActions = [
  { icon: MessageSquare, title: 'Create post', description: 'Share with the community', link: '/feed/create', color: 'primary' },
  { icon: Briefcase, title: 'Post opportunity', description: 'Jobs, internships, grants', link: '/opportunities', color: 'success' },
  { icon: Building, title: 'List business', description: 'Add to the directory', link: '/businesses', color: 'secondary' },
  { icon: Calendar, title: 'Create event', description: 'Organize a gathering', link: '/events', color: 'warning' },
]

const iconBg = {
  primary: 'bg-primary/10 border-primary/20 text-primary',
  success: 'bg-success/10 border-success/20 text-success',
  secondary: 'bg-secondary/10 border-secondary/20 text-secondary',
  warning: 'bg-warning/10 border-warning/20 text-warning',
}

const statusBadge = {
  active: { variant: 'success', label: 'Active' },
  inactive: { variant: 'warning', label: 'Inactive' },
  expired: { variant: 'default', label: 'Expired' },
  past: { variant: 'default', label: 'Past' },
}

function exportActivityCsv(rows) {
  const header = 'Title,Type,Status,Created\n'
  const body = rows
    .map((row) => {
      const title = `"${String(row.title || '').replace(/"/g, '""')}"`
      return [title, row.type, row.status, row.created_at].join(',')
    })
    .join('\n')
  const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `unity-hub-activity-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const Dashboard = ({ user }) => {
  const navigate = useNavigate()

  const { data: dashboardData, isLoading, error } = useQuery('dashboard', async () => {
    const response = await api.get('/users/dashboard')
    return response.data
  }, { staleTime: 30000, refetchOnWindowFocus: true })

  if (isLoading) return <DashboardSkeleton />

  if (error) {
    return (
      <div className="dashboard-page flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6 text-danger" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Unable to load dashboard</h2>
          <p className="text-sm text-muted mb-6">
            {error?.response?.status === 401
              ? 'Your session expired. Please sign in again.'
              : 'Check your connection and try again.'}
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => window.location.reload()}>Retry</Button>
            <Button variant="ghost" onClick={() => { localStorage.clear(); window.location.href = '/login' }}>
              Sign out
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const {
    stats,
    recentActivity,
    communityStats,
    upcomingEvents,
    engagement,
    recommendations,
    profileCompletion: apiProfileCompletion,
  } = dashboardData

  const activityColumns = [
    {
      key: 'title',
      label: 'Activity',
      sortable: true,
      accessor: (row) => row.title,
      render: (row) => (
        <Link to={row.link || '/dashboard'} className="font-medium text-foreground hover:text-primary transition-colors">
          {row.title}
        </Link>
      ),
    },
    { key: 'type', label: 'Type', sortable: true, render: (row) => <Badge variant={row.type}>{row.type}</Badge> },
    {
      key: 'created_at',
      label: 'When',
      sortable: true,
      accessor: (row) => new Date(row.created_at).getTime(),
      render: (row) => (
        <span className="text-muted">{formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const meta = statusBadge[row.status] || statusBadge.active
        return <Badge variant={meta.variant}>{meta.label}</Badge>
      },
    },
  ]

  const profileCompletion = apiProfileCompletion ?? Math.min(
    100,
    [user?.name, user?.bio, user?.location, user?.avatar].filter(Boolean).length * 25
  )

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="dashboard-page">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl border border-border/40 bg-transparent"
      >
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-radial opacity-40" />
        </div>

        <div className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 lg:gap-8">
            <DashboardHero firstName={firstName} />

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 lg:pt-1">
              <Button onClick={() => navigate('/feed/create')} className="w-full sm:w-auto justify-center">
                <Plus className="w-4 h-4" />
                New post
              </Button>
              <Button variant="secondary" onClick={() => navigate('/opportunities')} className="w-full sm:w-auto justify-center">
                Explore opportunities
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border/80">
            <div className="flex items-center justify-between text-sm mb-2.5">
              <span className="text-foreground/80 font-medium">Profile completion</span>
              <span className="font-semibold text-foreground tabular-nums">{profileCompletion}%</span>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden border border-border">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profileCompletion}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              />
            </div>
            {profileCompletion < 100 && (
              <Link to="/profile" className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-2.5 hover:underline">
                Complete your profile
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </motion.section>

      {/* Stats */}
      <section aria-label="Statistics">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = statIcons[stat.type] || MessageSquare
            return (
              <StatCard
                key={stat.type}
                type={stat.type}
                label={stat.label}
                value={stat.value}
                icon={Icon}
                trend={stat.trend || communityStats?.growthRate || '—'}
                delay={index * 0.04}
                onClick={() => navigate(statLinks[stat.type] || '/dashboard')}
              />
            )
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 min-w-0">
        <div className="xl:col-span-8 space-y-6 min-w-0">
          <Card>
            <CardHeader>
                <CardTitle accent="indigo">Quick actions</CardTitle>
              <CardDescription>Jump into your most common workflows</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid sm:grid-cols-2 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Link
                      key={action.title}
                      to={action.link}
                      className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-surface/60 hover:bg-card-hover hover:border-border-strong transition-all"
                    >
                      <div className={`p-2.5 rounded-xl border flex-shrink-0 ${iconBg[action.color]}`}>
                        <Icon className="w-5 h-5" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                          {action.title}
                        </p>
                        <p className="text-xs text-subtle mt-0.5 leading-snug">{action.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-subtle opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="border-b border-border pb-4 mb-0">
                <CardTitle accent="cyan">Recent activity</CardTitle>
              <CardDescription>Your latest posts, listings, and events</CardDescription>
            </CardHeader>
            <DataTable
              columns={activityColumns}
              data={recentActivity || []}
              emptyTitle="No activity yet"
              emptyDescription="Create content to see your history here."
              onExport={() => {
                if (!recentActivity?.length) {
                  toast.error('No activity to export')
                  return
                }
                exportActivityCsv(recentActivity)
                toast.success('Activity exported')
              }}
            />
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20">
                  <Sparkles className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <CardTitle accent="emerald">Recommended for you</CardTitle>
                  <CardDescription>Opportunities matched to your profile</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {recommendations?.length > 0 ? (
                recommendations.map((opp) => (
                  <Link
                    key={opp.id}
                    to={`/opportunities`}
                    state={{ highlightId: opp.id }}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border hover:bg-card-hover transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate group-hover:text-primary">{opp.title}</p>
                      <p className="text-xs text-subtle mt-0.5">{opp.company || opp.location || 'Unity Hub'}</p>
                    </div>
                    <Target className="w-4 h-4 text-subtle flex-shrink-0" />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-subtle py-6 text-center">Browse opportunities for recommendations.</p>
              )}
              <Button variant="ghost" className="w-full mt-2" onClick={() => navigate('/opportunities')}>
                View all opportunities
              </Button>
            </CardContent>
          </Card>
        </div>

        <aside className="xl:col-span-4 space-y-6 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle accent="indigo" className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Engagement
              </CardTitle>
              <CardDescription>Weekly activity overview</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <EngagementChart data={engagement || []} />
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3.5 rounded-xl bg-surface border border-border">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">Members</p>
                  <p className="text-xl font-semibold text-foreground mt-1 tabular-nums">
                    {communityStats?.activeUsers?.toLocaleString() ?? '—'}
                  </p>
                  {communityStats?.growthRate && (
                    <p className="text-[10px] text-emerald-400 mt-1 font-medium">{communityStats.growthRate} this month</p>
                  )}
                </div>
                <div className="p-3.5 rounded-xl bg-surface border border-border">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">Posts today</p>
                  <p className="text-xl font-semibold text-foreground mt-1 tabular-nums">
                    {communityStats?.postsToday ?? '—'}
                  </p>
                  {communityStats?.newUsersThisWeek != null && (
                    <p className="text-[10px] text-subtle mt-1">{communityStats.newUsersThisWeek} new members this week</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle accent="amber" className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                Community pulse
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface border border-border mb-4">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Active builders</p>
                  <p className="text-xs text-subtle mt-0.5">
                    {communityStats?.activeUsers?.toLocaleString()} members · {communityStats?.upcomingEventsCount ?? 0} upcoming events
                  </p>
                </div>
              </div>
              <ActivityTimeline activities={(recentActivity || []).slice(0, 4)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full gap-2">
                <CardTitle accent="rose">Upcoming events</CardTitle>
                <Link to="/events" className="text-xs font-semibold text-primary hover:underline whitespace-nowrap">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {upcomingEvents?.length > 0 ? (
                upcomingEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    to="/events"
                    className="block p-3.5 rounded-xl border border-border bg-surface/50 hover:bg-card-hover transition-colors"
                  >
                    <p className="font-medium text-sm text-foreground">{ev.title}</p>
                    <p className="flex items-center gap-1.5 text-xs text-subtle mt-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {(ev.date || ev.start_date)
                        ? format(new Date(ev.date || ev.start_date), 'MMM d, yyyy')
                        : 'Date TBA'}
                    </p>
                    {ev.location && (
                      <p className="text-xs text-subtle mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {ev.location}
                      </p>
                    )}
                    {ev.currentAttendees != null && (
                      <p className="text-[10px] text-subtle mt-1.5 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {ev.currentAttendees}
                        {ev.maxAttendees ? ` / ${ev.maxAttendees}` : ''} attending
                      </p>
                    )}
                  </Link>
                ))
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="No upcoming events"
                  description="Discover events in your community."
                  actionLabel="Browse events"
                  onAction={() => navigate('/events')}
                />
              )}
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-5">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/15 border border-primary/20 h-fit">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Keyboard shortcuts</p>
                <p className="text-xs text-muted mt-1.5 leading-relaxed">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-surface border border-border text-[10px] font-mono">⌘K</kbd>
                  {' '}search ·{' '}
                  <kbd className="px-1.5 py-0.5 rounded-md bg-surface border border-border text-[10px] font-mono">⌘⇧P</kbd>
                  {' '}commands
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Dashboard
