import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
  Heart,
  MessageCircle,
  Share2,
  Download,
  Repeat2,
  Bookmark,
  Copy,
  Flag,
  Trash2,
  Link2,
  MoreHorizontal,
  MapPin,
  Pencil,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card } from '../ui/Card'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import PostContent from './PostContent'
import { cn } from '../../lib/cn'
import { isSameUserId } from '../../utils/post'

function ActionButton({ onClick, active, activeClass, icon: Icon, label, count, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
        active ? activeClass : 'text-muted hover:text-foreground hover:bg-card',
        disabled && 'opacity-50 pointer-events-none'
      )}
      title={label}
    >
      <Icon className={cn('w-4 h-4', active && 'fill-current')} />
      <span className="hidden sm:inline">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-xs tabular-nums opacity-80">{count}</span>
      )}
    </button>
  )
}

export default function PostCard({
  post,
  currentUserId,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onLike,
  onComment,
  onRepost,
  onFavorite,
  onShare,
  onDownload,
  onCopyText,
  onDelete,
  actionLoading,
}) {
  const menuRef = useRef(null)

  useEffect(() => {
    if (!isMenuOpen) return undefined
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onCloseMenu()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isMenuOpen, onCloseMenu])

  const isOwner = isSameUserId(post.authorId, currentUserId)
  const createdLabel = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : ''

  return (
    <Card className="overflow-visible hover:border-border-strong transition-colors">
      <article className="p-4 sm:p-5 lg:p-6 overflow-visible">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4 relative z-20">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={post.author?.avatar} name={post.author?.name} size="md" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">{post.author?.name}</h3>
                {post.repostOfId && (
                  <Badge variant="info" className="text-[10px]">Repost</Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                {post.author?.role && (
                  <span className="capitalize">{post.author.role.replace('_', ' ')}</span>
                )}
                {post.author?.location && (
                  <>
                    <span className="text-subtle">·</span>
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {post.author.location}
                    </span>
                  </>
                )}
                {createdLabel && (
                  <>
                    <span className="text-subtle">·</span>
                    <time dateTime={post.createdAt}>{createdLabel}</time>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={onToggleMenu}
              className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-card border border-transparent hover:border-border"
              aria-label="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {isMenuOpen && (
              <div className="post-menu-dropdown absolute right-0 top-full mt-1 w-52 max-h-[min(70vh,320px)] overflow-y-auto overscroll-contain bg-surface border border-border rounded-xl shadow-premium-lg z-50">
                {isOwner && (
                  <>
                    <Link
                      to={`/feed/edit/${post.id}`}
                      onClick={onCloseMenu}
                      className="menu-item"
                    >
                      <Pencil className="w-4 h-4" /> Edit post
                    </Link>
                    <button
                      type="button"
                      onClick={() => { onDelete(); onCloseMenu() }}
                      className="menu-item text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                    <div className="my-1 border-t border-border" role="separator" />
                  </>
                )}
                <button type="button" onClick={() => { onDownload(); onCloseMenu() }} className="menu-item">
                  <Download className="w-4 h-4" /> Download
                </button>
                <button type="button" onClick={() => { onCopyText(); onCloseMenu() }} className="menu-item">
                  <Copy className="w-4 h-4" /> Copy text
                </button>
                <button type="button" onClick={() => { onShare(); onCloseMenu() }} className="menu-item">
                  <Link2 className="w-4 h-4" /> Copy link
                </button>
                <button
                  type="button"
                  onClick={() => { toast.success('Report received. Thank you.'); onCloseMenu() }}
                  className="menu-item"
                >
                  <Flag className="w-4 h-4" /> Report
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-foreground text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
          {post.content}
        </div>

        <PostContent post={post} />

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-1 mt-4 pt-4 border-t border-border">
          <ActionButton
            onClick={onLike}
            active={post.isLiked}
            activeClass="text-rose-400 bg-rose-500/10"
            icon={Heart}
            label="Like"
            count={post.likes}
            disabled={actionLoading}
          />
          <ActionButton
            onClick={onComment}
            icon={MessageCircle}
            label="Comment"
            count={post.comments}
          />
          <ActionButton
            onClick={onRepost}
            active={post.isReposted}
            activeClass="text-emerald-400 bg-emerald-500/10"
            icon={Repeat2}
            label="Repost"
            count={post.reposts}
            disabled={actionLoading}
          />
          <ActionButton
            onClick={onFavorite}
            active={post.isFavorited}
            activeClass="text-primary bg-primary/10"
            icon={Bookmark}
            label="Save"
            count={post.favorites}
            disabled={actionLoading}
          />
          <ActionButton onClick={onShare} icon={Share2} label="Share" />
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:text-secondary hover:bg-secondary/10 transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </article>
    </Card>
  )
}
