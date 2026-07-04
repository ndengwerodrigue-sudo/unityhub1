import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PenSquare, ArrowLeft, Clock, Pencil, Video, Music } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import api from '../api/axios'
import PageHeading from '../components/layout/PageHeading'
import PostStudio from '../components/feed/PostStudio'
import { Card } from '../components/ui/Card'
import { mapPostFromApi, isSameUserId } from '../utils/post'

export default function CreatePost({ user }) {
  const [recentPosts, setRecentPosts] = useState([])
  const [loadingRecent, setLoadingRecent] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/posts', { params: { limit: 30 } })
        const mine = (res.data.posts || [])
          .map(mapPostFromApi)
          .filter((p) => isSameUserId(p.authorId, user?.id || user?._id))
          .slice(0, 5)
        setRecentPosts(mine)
      } catch {
        setRecentPosts([])
      } finally {
        setLoadingRecent(false)
      }
    }
    if (user?.id) load()
  }, [user?.id])

  return (
    <div className="dashboard-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <PageHeading
          pathname="/feed/create"
          eyebrow="Creator studio"
          title="Create Post"
          description="Compose, preview, and publish to the community feed."
          className="mb-0"
        />
        <div className="flex gap-2 shrink-0">
          <Link to="/feed" className="btn btn-secondary gap-2 shrink-0">
            <ArrowLeft className="w-4 h-4" />
            Back to feed
          </Link>
        </div>
      </div>

      <PostStudio user={user} />

      {!loadingRecent && recentPosts.length > 0 && (
        <Card className="mt-8 p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <PenSquare className="w-4 h-4 text-primary" />
            Your recent posts
          </h3>
          <ul className="space-y-3">
            {recentPosts.map((post) => (
              <li key={post.id} className="flex items-center gap-2">
                <Link
                  to="/feed"
                  className="flex-1 block p-3 rounded-xl border border-border hover:bg-card-hover transition-colors"
                >
                  <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
                  <p className="text-xs text-subtle mt-1 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.createdAt
                        ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
                        : 'Recently'}
                    </span>
                    {post.images?.length > 0 && <span>{post.images.length} photo(s)</span>}
                    {post.videos?.length > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <Video className="w-3 h-3" /> {post.videos.length} video(s)
                      </span>
                    )}
                    {post.audioTrack?.src && (
                      <span className="inline-flex items-center gap-0.5">
                        <Music className="w-3 h-3" /> music
                      </span>
                    )}
                  </p>
                </Link>
                <Link
                  to={`/feed/edit/${post.id}`}
                  className="p-2.5 rounded-xl border border-border text-muted hover:text-primary hover:border-primary/40 transition-colors shrink-0"
                  title="Edit post"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
