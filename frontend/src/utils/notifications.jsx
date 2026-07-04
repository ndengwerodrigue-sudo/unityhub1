import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Reply,
  Info,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  ExternalLink,
} from 'lucide-react'

export function getNotificationIcon(type, size = 'sm') {
  const cls = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'

  switch (type) {
    case 'success':
      return <CheckCircle className={`${cls} text-success`} />
    case 'warning':
      return <AlertCircle className={`${cls} text-warning`} />
    case 'error':
      return <X className={`${cls} text-danger`} />
    case 'event':
      return <Clock className={`${cls} text-secondary`} />
    case 'like':
      return <Heart className={`${cls} text-rose-400`} />
    case 'comment':
      return <MessageCircle className={`${cls} text-cyan-400`} />
    case 'reply':
      return <Reply className={`${cls} text-violet-400`} />
    case 'comment_like':
      return <Heart className={`${cls} text-pink-400`} />
    case 'repost':
      return <Repeat2 className={`${cls} text-emerald-400`} />
    case 'save':
      return <Bookmark className={`${cls} text-amber-400`} />
    case 'opportunity':
      return <ExternalLink className={`${cls} text-primary`} />
    default:
      return <Info className={`${cls} text-primary`} />
  }
}
