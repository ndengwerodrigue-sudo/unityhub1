import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MessageCircle, PenSquare, Plus } from 'lucide-react'
import api from '../api/axios'
import { downloadPostAssets } from '../utils/downloadPost'
import { addCommentToTree, updateCommentLikeInTree } from '../utils/comments'
import { mapPostFromApi } from '../utils/post'
import PageHeading from '../components/layout/PageHeading'
import PostCard from '../components/feed/PostCard'
import PostCommentsModal from '../components/feed/PostCommentsModal'
import FeedSidebar from '../components/feed/FeedSidebar'
import { Card } from '../components/ui/Card'
import { DashboardSkeleton } from '../components/ui/Skeleton'

const Feed = ({ user }) => {
  const location = useLocation()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeMenuPostId, setActiveMenuPostId] = useState(null)
  const [commentingPost, setCommentingPost] = useState(null)
  const [postComments, setPostComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)
  const [likingCommentId, setLikingCommentId] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  const requireAuth = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please log in to use this feature')
      return false
    }
    return true
  }

  const copyPostLink = async (postId) => {
    const url = `${window.location.origin}/feed?post=${encodeURIComponent(postId)}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    } catch {
      toast.error('Could not copy link')
    }
  }

  const copyPostText = async (post) => {
    const text = `${post.author?.name || 'Unknown'}: ${post.content}`
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Post text copied')
    } catch {
      toast.error('Could not copy text')
    }
  }

  const sharePost = async (post) => {
    const url = `${window.location.origin}/feed?post=${encodeURIComponent(post.id)}`
    const shareData = {
      title: `${post.author?.name || 'Unity Hub'} — Community post`,
      text: post.content?.slice(0, 240) || 'Check out this post on Unity Hub',
      url,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch (error) {
        if (error?.name === 'AbortError') return
      }
    }

    await copyPostLink(post.id)
  }

  const downloadPost = async (post) => {
    try {
      const result = await downloadPostAssets(post)
      const parts = ['Post text downloaded']
      if (result.imageCount > 0) parts.push(`${result.imageCount} image(s)`)
      if (result.videoCount > 0) parts.push(`${result.videoCount} video(s)`)
      toast.success(parts.join(' · '))
    } catch {
      toast.error('Download failed')
    }
  }

  const handleDeletePost = async (postId) => {
    if (!requireAuth()) return
    try {
      await api.delete(`/posts/${postId}`)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      setActiveMenuPostId(null)
      toast.success('Post deleted')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete post')
    }
  }

  const openComments = async (post) => {
    setActiveMenuPostId(null)
    setCommentingPost(post)
    setCommentText('')
    setReplyTo(null)
    setPostComments([])
    setCommentsLoading(true)

    try {
      const response = await api.get(`/posts/${post.id}/comments`)
      setPostComments(response.data.comments || [])
    } catch {
      toast.error('Failed to load comments')
    } finally {
      setCommentsLoading(false)
    }
  }

  const closeComments = () => {
    setCommentingPost(null)
    setCommentText('')
    setReplyTo(null)
    setPostComments([])
  }

  const handleReplyTo = (comment) => {
    setReplyTo({
      id: comment.id,
      authorName: comment.author?.name || 'Member',
    })
  }

  const handleLikeComment = async (comment) => {
    if (!commentingPost) return
    if (!requireAuth()) return

    setLikingCommentId(comment.id)
    try {
      const response = await api.post(
        `/posts/${commentingPost.id}/comments/${comment.id}/like`,
        {}
      )
      const { likes, isLiked } = response.data
      setPostComments((prev) =>
        updateCommentLikeInTree(prev, comment.id, likes, isLiked)
      )
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update comment like')
    } finally {
      setLikingCommentId(null)
    }
  }

  const submitComment = async () => {
    if (!commentingPost) return
    const content = commentText.trim()
    if (!content) {
      toast.error(replyTo ? 'Write a reply first' : 'Write a comment first')
      return
    }
    if (!requireAuth()) return

    setIsCommentSubmitting(true)
    try {
      const payload = { content }
      if (replyTo?.id) payload.parentId = replyTo.id

      const response = await api.post(`/posts/${commentingPost.id}/comments`, payload)
      const { comments: nextCount, comment: newComment } = response.data
      setPosts((prev) =>
        prev.map((p) => (p.id === commentingPost.id ? { ...p, comments: nextCount } : p))
      )
      if (newComment) {
        setPostComments((prev) => addCommentToTree(prev, newComment))
      }
      setCommentText('')
      setReplyTo(null)
      toast.success(replyTo ? 'Reply posted' : 'Comment posted')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment')
    } finally {
      setIsCommentSubmitting(false)
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/posts', { params: { limit: 50 } })
      setPosts((response.data.posts || []).map(mapPostFromApi))
    } catch {
      toast.error('Failed to load feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    if (location.state?.newPost) {
      setPosts((prev) => {
        if (prev.some((p) => p.id === location.state.newPost.id)) return prev
        return [location.state.newPost, ...prev]
      })
      window.history.replaceState({}, document.title)
    }
    if (location.state?.updatedPost) {
      setPosts((prev) =>
        prev.map((p) => (p.id === location.state.updatedPost.id ? location.state.updatedPost : p))
      )
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const handleLike = async (postId) => {
    if (!requireAuth()) return
    setActionLoadingId(postId)
    try {
      const response = await api.post(`/posts/${postId}/like`, {})
      const { likes, isLiked } = response.data
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, isLiked, likes } : post))
      )
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update like')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleFavorite = async (postId) => {
    if (!requireAuth()) return
    setActionLoadingId(postId)
    try {
      const response = await api.post(`/posts/${postId}/favorite`, {})
      const { favorites, isFavorited } = response.data
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, isFavorited, favorites } : post))
      )
      toast.success(isFavorited ? 'Saved to favorites' : 'Removed from favorites')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update favorite')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRepost = async (post) => {
    if (!requireAuth()) return
    if (post.isReposted) {
      toast('You already reposted this')
      return
    }
    setActionLoadingId(post.id)
    try {
      const response = await api.post(`/posts/${post.id}/repost`, {})
      const { reposts, isReposted, post: repostedPost } = response.data
      const mapped = mapPostFromApi({
        ...repostedPost,
        author: repostedPost.author || {
          name: user.name,
          role: user.role,
          location: user.location,
          avatar: user.avatar,
        },
      })
      setPosts((prev) => [
        mapped,
        ...prev.map((p) => (p.id === post.id ? { ...p, isReposted, reposts } : p)),
      ])
      toast.success('Reposted to your feed!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to repost')
    } finally {
      setActionLoadingId(null)
    }
  }

  if (loading) return <DashboardSkeleton />

  return (
    <div className="dashboard-page">
      <PageHeading
        pathname="/feed"
        eyebrow="Social"
        title="Community Feed"
        description="Browse, like, and engage with community posts."
      >
        <Link to="/feed/create" className="btn btn-primary gap-2 shrink-0">
          <PenSquare className="w-4 h-4" />
          Create post
        </Link>
      </PageHeading>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 lg:gap-8 items-start">
        <div className="min-w-0 space-y-5 lg:space-y-6">
          <Link
            to="/feed/create"
            className="block rounded-2xl border border-dashed border-primary/30 bg-gradient-to-r from-primary/5 via-transparent to-cyan-500/5 p-5 sm:p-6 hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/15 border border-primary/25 group-hover:scale-105 transition-transform">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">Open Post Studio</p>
                <p className="text-sm text-muted mt-0.5">
                  Templates, hashtags, drag-and-drop photos, live preview &amp; draft saving
                </p>
              </div>
              <PenSquare className="w-5 h-5 text-primary shrink-0 opacity-60 group-hover:opacity-100" />
            </div>
          </Link>

          {posts.length === 0 ? (
            <Card className="p-10 text-center">
              <MessageCircle className="w-12 h-12 text-subtle mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
              <p className="text-sm text-muted mb-4">Be the first to share something with the community!</p>
              <Link to="/feed/create" className="btn btn-primary gap-2 inline-flex">
                <PenSquare className="w-4 h-4" />
                Create first post
              </Link>
            </Card>
          ) : (
            <div className="space-y-5 lg:space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id || user?._id}
                  isMenuOpen={activeMenuPostId === post.id}
                  onToggleMenu={() =>
                    setActiveMenuPostId((cur) => (cur === post.id ? null : post.id))
                  }
                  onCloseMenu={() => setActiveMenuPostId(null)}
                  onLike={() => handleLike(post.id)}
                  onComment={() => openComments(post)}
                  onRepost={() => handleRepost(post)}
                  onFavorite={() => handleFavorite(post.id)}
                  onShare={() => sharePost(post)}
                  onDownload={() => downloadPost(post)}
                  onCopyText={() => copyPostText(post)}
                  onDelete={() => handleDeletePost(post.id)}
                  actionLoading={actionLoadingId === post.id}
                />
              ))}
            </div>
          )}
        </div>

        <FeedSidebar user={user} totalLoaded={posts.length} />
      </div>

      {commentingPost && (
        <PostCommentsModal
          post={commentingPost}
          comments={postComments}
          loading={commentsLoading}
          commentText={commentText}
          replyTo={replyTo}
          onCommentTextChange={setCommentText}
          onClose={closeComments}
          onSubmit={submitComment}
          onReplyTo={handleReplyTo}
          onCancelReply={() => setReplyTo(null)}
          onLikeComment={handleLikeComment}
          likingCommentId={likingCommentId}
          isSubmitting={isCommentSubmitting}
          isLoggedIn={!!localStorage.getItem('token')}
        />
      )}
    </div>
  )
}

export default Feed
