import { useState, useRef, useEffect } from 'react'
import {
  Bell,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { cn } from '../lib/cn'
import { getNotificationIcon } from '../utils/notifications'

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(
    'notifications',
    async () => {
      try {
        const response = await api.get('/notifications')
        return response.data
      } catch (err) {
        if (err.response?.status >= 500) return { notifications: [], unreadCount: 0 }
        throw err
      }
    },
    { refetchInterval: 30000, retry: 1 }
  )

  const markAsReadMutation = useMutation((id) => api.patch(`/notifications/${id}/read`), {
    onSuccess: () => queryClient.invalidateQueries('notifications'),
  })

  const markAllReadMutation = useMutation(() => api.patch('/notifications/read-all'), {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications')
      toast.success('All caught up')
    },
  })

  const deleteMutation = useMutation((id) => api.delete(`/notifications/${id}`), {
    onSuccess: () => queryClient.invalidateQueries('notifications'),
  })

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-xl border transition-all',
          isOpen
            ? 'bg-card border-border-strong text-foreground'
            : 'border-border text-muted hover:text-foreground hover:bg-card'
        )}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.5rem))] sm:w-96 max-w-[calc(100vw-1.5rem)] bg-surface border border-border rounded-xl shadow-premium-lg z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
              {isLoading ? (
                <p className="p-8 text-center text-sm text-muted">Loading...</p>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <Bell className="w-10 h-10 text-subtle mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-muted">No notifications yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {notifications.slice(0, 8).map((n) => (
                    <li
                      key={n.id}
                      className={cn('relative p-4 hover:bg-card transition-colors group', !n.isRead && 'bg-primary/[0.04]')}
                    >
                      <div className="flex gap-3 pr-6">
                        {getNotificationIcon(n.type)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                          <p className="text-xs text-muted line-clamp-2 mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-subtle mt-1">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </p>
                          {n.link && (
                            <Link
                              to={n.link}
                              onClick={() => {
                                markAsReadMutation.mutate(n.id)
                                setIsOpen(false)
                              }}
                              className="text-xs text-primary font-medium mt-1 inline-flex items-center hover:underline"
                            >
                              View <ExternalLink className="w-3 h-3 ml-0.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100">
                        {!n.isRead && (
                          <button
                            type="button"
                            onClick={() => markAsReadMutation.mutate(n.id)}
                            className="p-1.5 rounded-lg border border-border hover:bg-background text-success"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(n.id)}
                          className="p-1.5 rounded-lg border border-border hover:bg-background text-danger"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-3 border-t border-border text-center">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Open notification center
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
