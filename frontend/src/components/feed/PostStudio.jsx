import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Image,
  Send,
  X,
  Sparkles,
  Hash,
  FileText,
  Trash2,
  ChevronUp,
  ChevronDown,
  Upload,
  Loader2,
  Save,
  Video,
} from 'lucide-react'
import api from '../../api/axios'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import PostMediaPlayer from './PostMediaPlayer'
import MusicEditor from './MusicEditor'
import {
  MAX_POST_LENGTH,
  MAX_POST_IMAGES,
  MAX_POST_VIDEOS,
  MAX_VIDEO_MB,
  POST_TEMPLATES,
  SUGGESTED_HASHTAGS,
  loadDraft,
  saveDraft,
  clearDraft,
  readImageFiles,
  readVideoFiles,
  isImageFile,
  isVideoFile,
  mapPostFromApi,
  serializeAudioTrack,
  formatTime,
  resolveMediaUrl,
} from '../../utils/post'

export default function PostStudio({ user, editPost = null }) {
  const navigate = useNavigate()
  const isEditing = Boolean(editPost?.id)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [videos, setVideos] = useState([])
  const [audioTrack, setAudioTrack] = useState(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState(null)

  useEffect(() => {
    if (editPost) {
      setContent(editPost.content || '')
      setImages((editPost.images || []).map((src, i) => ({ src, name: `image-${i}` })))
      setVideos((editPost.videos || []).map((src, i) => ({ src, name: `video-${i}`, duration: 0 })))
      if (editPost.audioTrack?.src) setAudioTrack(editPost.audioTrack)
      return
    }

    const draft = loadDraft()
    if (draft?.content || draft?.images?.length) {
      setContent(draft.content)
      setImages(draft.images.map((src, i) => ({ src, name: `draft-img-${i}` })))
      setDraftSavedAt(draft.savedAt)
      toast('Draft restored', { icon: '📝' })
    }
  }, [editPost])

  const persistDraft = useCallback(() => {
    if (isEditing) return
    if (!content.trim() && images.length === 0 && videos.length === 0 && !audioTrack?.src) {
      clearDraft()
      setDraftSavedAt(null)
      return
    }
    saveDraft({
      content,
      images: images.map((img) => img.src),
    })
    setDraftSavedAt(new Date().toISOString())
  }, [content, images, videos.length, audioTrack?.src, isEditing])

  useEffect(() => {
    const timer = setTimeout(persistDraft, 800)
    return () => clearTimeout(timer)
  }, [persistDraft])

  const addImages = async (files) => {
    const remaining = MAX_POST_IMAGES - images.length
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_POST_IMAGES} images per post`)
      return
    }
    const fileList = Array.from(files || [])
    const batch = (await readImageFiles(files)).slice(0, remaining)
    if (fileList.length > batch.length) {
      toast.error(`Only ${remaining} more image(s) allowed`)
    }
    setImages((prev) => [...prev, ...batch])
  }

  const addVideos = async (files) => {
    const remaining = MAX_POST_VIDEOS - videos.length
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_POST_VIDEOS} videos per post`)
      return
    }
    setIsUploadingMedia(true)
    try {
      const batch = (await readVideoFiles(files)).slice(0, remaining)
      setVideos((prev) => [...prev, ...batch])
      toast.success(`${batch.length} video(s) uploaded`)
    } catch (err) {
      toast.error(err.message || 'Failed to upload video')
    } finally {
      setIsUploadingMedia(false)
    }
  }

  const addMediaFiles = async (files) => {
    const list = Array.from(files || [])
    if (!list.length) return

    const imageFiles = list.filter(isImageFile)
    const videoFiles = list.filter(isVideoFile)
    const unknown = list.filter((f) => !isImageFile(f) && !isVideoFile(f))

    if (unknown.length) {
      toast.error(`${unknown.length} file(s) skipped — use images or videos only`)
    }
    if (imageFiles.length) await addImages(imageFiles)
    if (videoFiles.length) await addVideos(videoFiles)
  }

  const onDrop = async (e) => {
    e.preventDefault()
    setIsDragging(false)
    await addMediaFiles(e.dataTransfer.files)
  }

  const insertHashtag = (tag) => {
    const el = textareaRef.current
    const insertion = content.endsWith(' ') || !content ? tag : ` ${tag}`
    setContent((c) => c + insertion)
    el?.focus()
  }

  const applyTemplate = (text) => {
    setContent((c) => (c.trim() ? `${c}\n\n${text}` : text))
    textareaRef.current?.focus()
  }

  const moveImage = (idx, dir) => {
    const next = idx + dir
    if (next < 0 || next >= images.length) return
    setImages((prev) => {
      const copy = [...prev]
      ;[copy[idx], copy[next]] = [copy[next], copy[idx]]
      return copy
    })
  }

  const publish = async () => {
    const trimmed = content.trim()
    if (!trimmed && images.length === 0 && videos.length === 0 && !audioTrack?.src) {
      toast.error('Add text, photos, video, or music before publishing')
      return
    }
    if (!trimmed) {
      toast.error('Write a caption for your post')
      return
    }
    if (isUploadingMedia) {
      toast.error('Please wait — video is still uploading')
      return
    }
    if (videos.some((v) => !v.src)) {
      toast.error('A video failed to upload. Remove it and try again.')
      return
    }
    if (trimmed.length > MAX_POST_LENGTH) {
      toast.error(`Post must be under ${MAX_POST_LENGTH} characters`)
      return
    }

    setIsPublishing(true)
    try {
      const payload = {
        content: trimmed,
        images: images.map((img) => img.src),
        videos: videos.map((v) => v.src),
        audioTrack: serializeAudioTrack(audioTrack),
      }

      const response = isEditing
        ? await api.put(`/posts/${editPost.id}`, payload)
        : await api.post('/posts', payload)

      if (!isEditing) clearDraft()
      toast.success(isEditing ? 'Post updated!' : 'Post published!')
      navigate('/feed', {
        state: {
          [isEditing ? 'updatedPost' : 'newPost']: mapPostFromApi(response.data.post),
        },
      })
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error
      if (error.code === 'ECONNABORTED') {
        toast.error('Upload timed out — try a smaller video or check your connection')
      } else {
        toast.error(message || `Failed to ${isEditing ? 'update' : 'publish'} post`)
      }
    } finally {
      setIsPublishing(false)
    }
  }

  const previewPost = {
    id: 'preview',
    authorId: user?.id,
    author: {
      name: user?.name,
      role: user?.role,
      location: user?.location,
      avatar: user?.avatar,
    },
    content: content.trim() || 'Your post will appear here…',
    images: images.map((img) => img.src),
    videos: videos.map((v) => v.src),
    audioTrack: audioTrack?.src ? audioTrack : null,
    likes: 0,
    comments: 0,
    favorites: 0,
    reposts: 0,
    createdAt: new Date().toISOString(),
    isLiked: false,
    isFavorited: false,
    isReposted: false,
  }

  const charCount = content.length
  const charWarning = charCount > MAX_POST_LENGTH * 0.9

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 items-start">
      {/* Editor */}
      <div className="space-y-5 min-w-0">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle accent="cyan" className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-cyan-400" />
              Compose
            </CardTitle>
            <CardDescription>Write your message for the community feed</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface/60 border border-border">
              <Avatar src={user?.avatar} name={user?.name} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted capitalize">{user?.role?.replace('_', ' ')} · {user?.location}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-subtle uppercase tracking-wide mb-2">Quick templates</p>
              <div className="flex flex-wrap gap-2">
                {POST_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t.text)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-border text-muted hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              maxLength={MAX_POST_LENGTH}
              placeholder="Share news, ideas, opportunities, or questions with the community…"
              className="input-field resize-y min-h-[180px] text-base leading-relaxed"
            />

            <div className="flex items-center justify-between text-xs">
              <span className={charWarning ? 'text-warning font-medium' : 'text-subtle'}>
                {charCount} / {MAX_POST_LENGTH}
              </span>
              {draftSavedAt && (
                <span className="text-subtle flex items-center gap-1">
                  <Save className="w-3 h-3" />
                  Draft saved
                </span>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-subtle uppercase tracking-wide mb-2 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" /> Suggested tags
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_HASHTAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertHashtag(tag)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium text-cyan-400/90 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/15 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle accent="indigo" className="flex items-center gap-2 text-base">
              <Image className="w-4 h-4 text-indigo-400" />
              Photos &amp; videos
            </CardTitle>
            <CardDescription>
              Up to {MAX_POST_IMAGES} images and {MAX_POST_VIDEOS} videos — drag, drop, or browse
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`relative rounded-2xl border-2 border-dashed transition-colors p-8 text-center ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40 hover:bg-card/50'
              }`}
            >
              <Upload className="w-8 h-8 text-muted mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium">Drop images or videos here</p>
              <p className="text-xs text-muted mt-1 mb-4">
                Images: PNG, JPG, WEBP · Videos: MP4, MOV, WEBM (max {MAX_VIDEO_MB}MB each)
              </p>
              {isUploadingMedia && (
                <p className="text-xs text-primary mb-3 flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading video to server…
                </p>
              )}
              <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4" />
                Browse files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.mp4,.mov,.webm,.avi,.mkv,.m4v"
                multiple
                className="hidden"
                onChange={(e) => {
                  addMediaFiles(e.target.files)
                  e.target.value = ''
                }}
              />
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <div key={`${img.name}-${idx}`} className="relative group rounded-2xl overflow-hidden bg-transparent">
                    <img
                      src={img.src}
                      alt={img.name}
                      className="feed-image-img w-full h-32 sm:h-36 object-contain rounded-2xl bg-transparent ring-1 ring-white/10"
                    />
                    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => moveImage(idx, -1)} disabled={idx === 0} className="p-1 rounded-md bg-black/50 text-white disabled:opacity-30" aria-label="Move up">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => moveImage(idx, 1)} disabled={idx === images.length - 1} className="p-1 rounded-md bg-black/50 text-white disabled:opacity-30" aria-label="Move down">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))} className="p-1 rounded-md bg-black/50 text-white" aria-label="Remove">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {videos.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-subtle uppercase tracking-wide flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" /> Videos ({videos.length}/{MAX_POST_VIDEOS})
                </p>
                {videos.map((vid, idx) => (
                  <div key={`${vid.name}-${idx}`} className="relative group rounded-2xl overflow-hidden bg-transparent">
                    <video
                      src={resolveMediaUrl(vid.src)}
                      className="w-full max-h-48 rounded-2xl bg-transparent object-contain ring-1 ring-white/10"
                      controls
                      preload="metadata"
                      onLoadedMetadata={(e) => {
                        const dur = e.target.duration
                        setVideos((prev) =>
                          prev.map((v, i) => (i === idx ? { ...v, duration: dur } : v))
                        )
                      }}
                    />
                    <div className="flex items-center justify-between mt-1.5 px-1">
                      <span className="text-xs text-muted truncate">{vid.name}</span>
                      {vid.duration > 0 && (
                        <span className="text-xs text-subtle tabular-nums">{formatTime(vid.duration)}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setVideos((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1 rounded text-muted hover:text-danger"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <MusicEditor
          audioTrack={audioTrack}
          onChange={setAudioTrack}
          onRemove={() => setAudioTrack(null)}
          videos={videos}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={publish}
            disabled={isPublishing || isUploadingMedia || !content.trim()}
            className="flex-1 gap-2"
          >
            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isPublishing
              ? (isEditing ? 'Saving…' : 'Publishing…')
              : (isEditing ? 'Save changes' : 'Publish to feed')}
          </Button>
          {!isEditing && (
            <Button
              variant="secondary"
              onClick={() => {
                if (window.confirm('Discard this draft?')) {
                  setContent('')
                  setImages([])
                  setVideos([])
                  setAudioTrack(null)
                  clearDraft()
                  setDraftSavedAt(null)
                  toast.success('Draft cleared')
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          )}
          {isEditing && (
            <Button variant="secondary" onClick={() => navigate('/feed')}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Live preview */}
      <div className="xl:sticky xl:top-20 space-y-5 min-w-0">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle accent="emerald" className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Live preview
            </CardTitle>
            <CardDescription>How your post will look in the feed</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-2xl border border-border bg-card/50 p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <Avatar src={user?.avatar} name={user?.name} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted">Just now · Preview</p>
                </div>
              </div>
              <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words ${!content.trim() ? 'text-muted italic' : 'text-foreground'}`}>
                {previewPost.content}
              </p>
              <PostMediaPlayer
                videos={previewPost.videos}
                images={previewPost.images}
                audioTrack={previewPost.audioTrack}
                postId="preview"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="p-5">
          <h4 className="text-sm font-semibold text-foreground mb-2">Publishing tips</h4>
          <ul className="text-xs text-muted space-y-2 leading-relaxed">
            <li>Posts are saved to the database and appear instantly in the community feed.</li>
            <li>Your draft auto-saves locally while you compose.</li>
            <li>Use hashtags to help others discover your post.</li>
            <li>Add videos and music — preview plays them exactly as in the feed.</li>
            <li>Crop music, set volume, and choose when it starts on your video timeline.</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
