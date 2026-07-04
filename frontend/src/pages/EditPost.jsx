import { useEffect, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import PageHeading from '../components/layout/PageHeading'
import PostStudio from '../components/feed/PostStudio'
import { Card } from '../components/ui/Card'
import { mapPostFromApi, isSameUserId } from '../utils/post'

export default function EditPost({ user }) {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await api.get(`/posts/${id}`)
        const mapped = mapPostFromApi(res.data.post)
        if (!isSameUserId(mapped.authorId, user?.id || user?._id)) {
          if (!cancelled) setForbidden(true)
          return
        }
        if (!cancelled) setPost(mapped)
      } catch {
        if (!cancelled) {
          toast.error('Could not load post')
          setPost(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (user?.id && id) load()
  }, [id, user?.id])

  if (loading) {
    return (
      <div className="dashboard-page flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (forbidden) {
    return <Navigate to="/feed" replace />
  }

  if (!post) {
    return (
      <div className="dashboard-page">
        <Card className="p-8 text-center">
          <p className="text-muted mb-4">Post not found or could not be loaded.</p>
          <Link to="/feed" className="btn btn-secondary gap-2 inline-flex">
            <ArrowLeft className="w-4 h-4" />
            Back to feed
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <PageHeading
          pathname="/feed/edit"
          eyebrow="Creator studio"
          title="Edit Post"
          description="Update your caption, photos, videos, and music."
          className="mb-0"
        />
        <Link to="/feed" className="btn btn-secondary gap-2 shrink-0">
          <ArrowLeft className="w-4 h-4" />
          Back to feed
        </Link>
      </div>

      <Card className="mb-6 p-4 flex items-center gap-3 border-primary/20 bg-primary/5">
        <Pencil className="w-5 h-5 text-primary shrink-0" />
        <p className="text-sm text-muted">
          Editing your post. Changes are saved to the database when you click <strong className="text-foreground">Save changes</strong>.
        </p>
      </Card>

      <PostStudio user={user} editPost={post} />
    </div>
  )
}
