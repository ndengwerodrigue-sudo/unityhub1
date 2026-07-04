import { formatDistanceToNow } from 'date-fns'
import { Heart, Loader2, MessageCircle, Reply } from 'lucide-react'
import { Card } from '../ui/Card'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import { cn } from '../../lib/cn'

function CommentItem({
  comment,
  depth = 0,
  isLoggedIn,
  likingId,
  onReply,
  onLike,
}) {
  return (
    <div className={cn(depth > 0 && 'ml-4 sm:ml-6 pl-3 border-l border-border/50')}>
      <div className="flex gap-3 p-3 rounded-xl bg-surface/60 border border-border/60">
        <Avatar src={comment.author?.avatar} name={comment.author?.name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-foreground">
              {comment.author?.name || 'Member'}
            </span>
            {comment.createdAt && (
              <time dateTime={comment.createdAt} className="text-[11px] text-subtle">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </time>
            )}
          </div>
          <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => onLike(comment)}
              disabled={!isLoggedIn || likingId === comment.id}
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium transition-colors',
                comment.isLiked ? 'text-rose-400' : 'text-muted hover:text-foreground',
                !isLoggedIn && 'opacity-50 cursor-not-allowed'
              )}
            >
              {likingId === comment.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Heart className={cn('w-3.5 h-3.5', comment.isLiked && 'fill-current')} />
              )}
              {comment.likes > 0 && <span>{comment.likes}</span>}
              <span className="sr-only">Like comment</span>
            </button>
            {isLoggedIn && (
              <button
                type="button"
                onClick={() => onReply(comment)}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-primary transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {comment.replies?.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              isLoggedIn={isLoggedIn}
              likingId={likingId}
              onReply={onReply}
              onLike={onLike}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PostCommentsModal({
  post,
  comments,
  loading,
  commentText,
  replyTo,
  onCommentTextChange,
  onClose,
  onSubmit,
  onReplyTo,
  onCancelReply,
  onLikeComment,
  likingCommentId,
  isSubmitting,
  isLoggedIn,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
      />
      <Card className="relative w-full max-w-lg max-h-[min(90vh,640px)] flex flex-col z-10 overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-border shrink-0">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-foreground">Comments</h3>
            <p className="text-sm text-muted mt-0.5 truncate">
              On {post.author?.name || 'this post'}&apos;s update
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground p-1 text-xl leading-none shrink-0"
            aria-label="Close comments"
          >
            ×
          </button>
        </div>

        <p className="text-xs text-subtle mx-5 sm:mx-6 mt-4 mb-2 line-clamp-2 border-l-2 border-primary/40 pl-3 shrink-0">
          {post.content}
        </p>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-6 py-2 space-y-3 scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading comments…</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <MessageCircle className="w-10 h-10 text-subtle opacity-40 mb-3" />
              <p className="text-sm text-muted">No comments yet. Be the first to comment.</p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isLoggedIn={isLoggedIn}
                likingId={likingCommentId}
                onReply={onReplyTo}
                onLike={onLikeComment}
              />
            ))
          )}
        </div>

        <div className="shrink-0 border-t border-border p-5 sm:p-6 space-y-3 bg-surface/30">
          {isLoggedIn ? (
            <>
              {replyTo && (
                <div className="flex items-center justify-between gap-2 text-xs text-muted bg-surface/80 border border-border rounded-lg px-3 py-2">
                  <span>
                    Replying to <span className="text-foreground font-medium">{replyTo.authorName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={onCancelReply}
                    className="text-primary hover:underline shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <textarea
                value={commentText}
                onChange={(e) => onCommentTextChange(e.target.value)}
                rows={3}
                className="input-field resize-none"
                placeholder={replyTo ? 'Write a reply…' : 'Write a comment…'}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={onSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Posting…
                    </>
                  ) : replyTo ? (
                    'Post reply'
                  ) : (
                    'Post comment'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted text-center py-2">
              Log in to comment, reply, and like. Comments are visible to everyone.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
