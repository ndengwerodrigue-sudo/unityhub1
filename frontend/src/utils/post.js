import api from '../api/axios'

export const API_ORIGIN = api.defaults.baseURL.replace(/\/api\/?$/, '')

/** Turn stored paths or data URLs into a playable src */
export function resolveMediaUrl(src) {
  if (!src) return ''
  if (
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('data:') ||
    src.startsWith('blob:')
  ) {
    return src
  }
  if (src.startsWith('/')) return `${API_ORIGIN}${src}`
  return `${API_ORIGIN}/${src}`
}

export async function uploadPostMedia(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/posts/media/upload', formData, {
    timeout: 300000,
    maxContentLength: 100 * 1024 * 1024,
    maxBodyLength: 100 * 1024 * 1024,
  })
  return response.data
}

export const MAX_POST_LENGTH = 2000
export const MAX_POST_IMAGES = 8
export const MAX_POST_VIDEOS = 2
export const MAX_VIDEO_MB = 25
export const MAX_AUDIO_MB = 12

export const DEFAULT_AUDIO_TRACK = {
  src: '',
  name: '',
  duration: 0,
  trimStart: 0,
  trimEnd: 0,
  volume: 0.7,
  placementStart: 0,
}

export const POST_TEMPLATES = [
  {
    id: 'update',
    label: 'Community update',
    text: "Excited to share an update with the Unity Hub community! Here's what's new:\n\n",
  },
  {
    id: 'opportunity',
    label: 'Share opportunity',
    text: 'Found a great opportunity for our community:\n\n',
  },
  {
    id: 'event',
    label: 'Event shoutout',
    text: "Don't miss this upcoming event in our ecosystem:\n\n",
  },
  {
    id: 'question',
    label: 'Ask the community',
    text: 'Hey everyone — I would love your thoughts on:\n\n',
  },
]

export const SUGGESTED_HASHTAGS = [
  '#UnityHub',
  '#Cameroon',
  '#Community',
  '#Opportunity',
  '#Innovation',
  '#Networking',
]

export function mapPostFromApi(post) {
  return {
    id: post.id,
    authorId: post.authorId ?? post.author_id ?? null,
    author: post.author || {
      name: 'Unknown',
      role: '',
      location: '',
      avatar: '',
    },
    content: post.content,
    images: post.images || [],
    videos: post.videos || [],
    audioTrack: post.audioTrack || null,
    likes: post.likes || 0,
    comments: post.comments || 0,
    favorites: post.favorites || 0,
    reposts: post.reposts || 0,
    createdAt: post.createdAt,
    isLiked: !!post.isLiked,
    isFavorited: !!post.isFavorited,
    isReposted: !!post.isReposted,
    repostOfId: post.repostOfId || null,
  }
}

export function serializeAudioTrack(track) {
  if (!track?.src) return null
  return {
    src: track.src,
    name: track.name,
    duration: track.duration,
    trimStart: track.trimStart,
    trimEnd: track.trimEnd,
    volume: track.volume,
    placementStart: track.placementStart,
  }
}

export const DRAFT_STORAGE_KEY = 'unity-hub-post-draft'

export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      content: parsed.content || '',
      images: Array.isArray(parsed.images) ? parsed.images : [],
      savedAt: parsed.savedAt,
    }
  } catch {
    return null
  }
}

export function saveDraft({ content, images }) {
  try {
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        content,
        images,
        savedAt: new Date().toISOString(),
      })
    )
  } catch {
    // Large images can exceed localStorage quota — content still lives in React state
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY)
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function getMediaDuration(src, kind = 'video') {
  return new Promise((resolve) => {
    const el = document.createElement(kind)
    el.preload = 'metadata'
    el.onloadedmetadata = () => {
      resolve(Number.isFinite(el.duration) ? el.duration : 0)
      el.src = ''
    }
    el.onerror = () => resolve(0)
    el.src = src
  })
}

function fileTooLarge(file, maxMb) {
  return file.size > maxMb * 1024 * 1024
}

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v', 'ogv', '3gp'])
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif'])

const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'webm'])

function fileExtension(name = '') {
  return name.split('.').pop()?.toLowerCase() || ''
}

export function isVideoFile(file) {
  if (!file) return false
  if (file.type?.startsWith('video/')) return true
  return VIDEO_EXTENSIONS.has(fileExtension(file.name))
}

export function isImageFile(file) {
  if (!file) return false
  if (file.type?.startsWith('image/')) return true
  return IMAGE_EXTENSIONS.has(fileExtension(file.name))
}

export function isAudioFile(file) {
  if (!file) return false
  if (file.type?.startsWith('audio/')) return true
  return AUDIO_EXTENSIONS.has(fileExtension(file.name))
}

export async function readImageFiles(files) {
  const list = Array.from(files || []).filter(isImageFile)
  return Promise.all(
    list.map(async (file) => ({
      src: await readAsDataURL(file),
      name: file.name,
    }))
  )
}

export async function readVideoFiles(files) {
  const list = Array.from(files || []).filter(isVideoFile)
  if (!list.length && files?.length) {
    throw new Error('No supported video files selected (use MP4, MOV, WEBM, etc.)')
  }
  const results = []
  for (const file of list) {
    if (fileTooLarge(file, MAX_VIDEO_MB)) {
      throw new Error(`Video "${file.name}" exceeds ${MAX_VIDEO_MB}MB limit`)
    }
    const uploaded = await uploadPostMedia(file)
    const src = uploaded.url
    const duration = await getMediaDuration(resolveMediaUrl(src), 'video')
    results.push({ src, name: file.name, duration })
  }
  return results
}

export async function readAudioFile(file) {
  if (!isAudioFile(file)) {
    throw new Error('Please select an audio file')
  }
  if (fileTooLarge(file, MAX_AUDIO_MB)) {
    throw new Error(`Audio exceeds ${MAX_AUDIO_MB}MB limit`)
  }
  const uploaded = await uploadPostMedia(file)
  const src = uploaded.url
  const duration = await getMediaDuration(resolveMediaUrl(src), 'audio')
  return {
    src,
    name: file.name,
    duration,
    trimStart: 0,
    trimEnd: duration || 30,
    volume: 0.7,
    placementStart: 0,
  }
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function getTimelineMax(videos, audioTrack) {
  const videoDur = videos?.[0]?.duration || 0
  const audioDur = audioTrack?.duration || 0
  return Math.max(videoDur, audioDur, 30)
}

/** Compare user IDs safely (UUID strings, legacy _id fields) */
export function isSameUserId(a, b) {
  if (a == null || b == null) return false
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase()
}
