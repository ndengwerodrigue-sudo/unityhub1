/**
 * Download post text, images, and videos as files.
 */
import { resolveMediaUrl } from './post'

function extensionFromMime(mime = '') {
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('gif')) return 'gif'
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('mp4')) return 'mp4'
  if (mime.includes('quicktime') || mime.includes('mov')) return 'mov'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  return 'bin'
}

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(',')
  const mimeMatch = header?.match(/data:([^;]+)/)
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return { blob: new Blob([bytes], { type: mime }), mime }
}

async function urlToBlob(src) {
  if (src.startsWith('data:')) {
    return dataUrlToBlob(src)
  }
  const response = await fetch(src)
  if (!response.ok) throw new Error('Failed to fetch image')
  const blob = await response.blob()
  return { blob, mime: blob.type || 'image/jpeg' }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  setTimeout(() => {
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, 300)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function downloadPostAssets(post) {
  const safeId = String(post.id || 'post').replace(/[^\w-]/g, '')
  const baseName = `unity-hub-post-${safeId}`

  const textLines = [
    'Unity Hub — Post Export',
    `Author: ${post.author?.name || 'Unknown'}`,
    `Date: ${post.createdAt || ''}`,
    '',
    post.content || '',
  ]
  const textBlob = new Blob(['\uFEFF', textLines.join('\r\n')], {
    type: 'text/plain;charset=utf-8',
  })
  triggerDownload(textBlob, `${baseName}.txt`)
  await delay(400)

  const images = Array.isArray(post.images) ? post.images.filter(Boolean) : []
  for (let i = 0; i < images.length; i += 1) {
    try {
      const { blob, mime } = await urlToBlob(resolveMediaUrl(images[i]))
      const ext = extensionFromMime(mime)
      triggerDownload(blob, `${baseName}-image-${i + 1}.${ext}`)
      await delay(500)
    } catch {
      // skip broken image
    }
  }

  const videos = Array.isArray(post.videos) ? post.videos.filter(Boolean) : []
  for (let i = 0; i < videos.length; i += 1) {
    try {
      const { blob, mime } = await urlToBlob(resolveMediaUrl(videos[i]))
      const ext = extensionFromMime(mime)
      triggerDownload(blob, `${baseName}-video-${i + 1}.${ext}`)
      await delay(500)
    } catch {
      // skip broken video
    }
  }

  return {
    textDownloaded: true,
    imageCount: images.length,
    videoCount: videos.length,
  }
}
