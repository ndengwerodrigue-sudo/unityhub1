import { useQuery, useMutation, useQueryClient } from 'react-query'
import { formatDistanceToNow } from 'date-fns'
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import api from '../api/axios'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { cn } from '../lib/cn'
import PageHeading from '../components/layout/PageHeading'
import { getNotificationIcon } from '../utils/notifications'

export default function Notifications() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery('notifications', async () => {
    const response = await api.get('/notifications')
    return response.data
  })

  const markAsReadMutation = useMutation((id) => api.patch(`/notifications/${id}/read`), {
    onSuccess: () => queryClient.invalidateQueries('notifications'),
  })
  const markAllReadMutation = useMutation(() => api.patch('/notifications/read-all'), {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications')
      toast.success('All notifications marked as read')
    },
  })
  const deleteMutation = useMutation((id) => api.delete(`/notifications/${id}`), {
    onSuccess: () => queryClient.invalidateQueries('notifications'),
  })

  if (isLoading) return <DashboardSkeleton />

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0
  const grouped = notifications.reduce((acc, n) => {
    const d = new Date(n.createdAt).toDateString()
    if (!acc[d]) acc[d] = []
    acc[d].push(n)
    return acc
  }, {})

  return (
    <div className="dashboard-page max-w-3xl">
      <PageHeading
        pathname="/notifications"
        eyebrow="Inbox"
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
      >
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markAllReadMutation.mutate()}>
            <Check className="w-4 h-4" /> Mark all as read
          </Button>
        )}
      </PageHeading>
      {notifications.length === 0 ? (
        <Card className="mt-6">
          <EmptyState icon={Bell} title="No notifications" description="Updates will appear here." />
        </Card>
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <p className="text-xs font-medium text-subtle uppercase mb-3">{dateLabel === new Date().toDateString() ? 'Today' : dateLabel}</p>
              <Card className="divide-y divide-border overflow-hidden p-0">
                {items.map((notification) => (
                  <div key={notification.id} className={cn('flex gap-4 p-5 group', !notification.isRead && 'bg-primary/[0.04]')}>
                    {getNotificationIcon(notification.type, 'lg')}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{notification.title}</p>
                      <p className="text-sm text-muted mt-1">{notification.message}</p>
                      {notification.link && (
                        <Link to={notification.link} onClick={() => markAsReadMutation.mutate(notification.id)} className="text-xs text-primary font-medium mt-2 inline-block hover:underline">
                          View details
                        </Link>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      {!notification.isRead && (
                        <button type="button" onClick={() => markAsReadMutation.mutate(notification.id)} className="p-2 rounded-lg border border-border text-success" aria-label="Mark read">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button type="button" onClick={() => deleteMutation.mutate(notification.id)} className="p-2 rounded-lg border border-border text-danger" aria-label="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
