import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Briefcase, Building, Calendar } from 'lucide-react'
import Badge from '../ui/Badge'

const typeIcons = { post: MessageSquare, opportunity: Briefcase, business: Building, event: Calendar }

export default function ActivityTimeline({ activities }) {
  if (!activities?.length) return null

  return (
    <ul className="space-y-0" role="list">
      {activities.map((item, i) => {
        const Icon = typeIcons[item.type] || MessageSquare
        return (
          <li key={item.id ?? i} className="relative flex gap-4 pb-6 last:pb-0">
            {i < activities.length - 1 && <span className="absolute left-[19px] top-10 bottom-0 w-px bg-border" aria-hidden />}
            <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant={item.type}>{item.type}</Badge>
                <span className="text-xs text-subtle">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
