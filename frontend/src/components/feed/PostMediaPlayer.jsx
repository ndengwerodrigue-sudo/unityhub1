import { useRef, useEffect, useState, useCallback } from 'react'
import { Play, Pause, Volume2, Music } from 'lucide-react'
import { cn } from '../../lib/cn'
import PostImageGallery from './PostImageGallery'
import { formatTime, resolveMediaUrl } from '../../utils/post'

export default function PostMediaPlayer({
  videos = [],
  images = [],
  audioTrack = null,
  postId = 'post',
  className,
}) {
  const videoRef = useRef(null)
  const audioRef = useRef(null)
  const placementTimerRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  const hasVideo = videos?.length > 0
  const hasAudio = !!audioTrack?.src
  const trimStart = audioTrack?.trimStart ?? 0
  const trimEnd = audioTrack?.trimEnd ?? audioTrack?.duration ?? 0
  const volume = audioTrack?.volume ?? 0.7
  const placementStart = audioTrack?.placementStart ?? 0

  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.volume = volume
  }, [volume, audioTrack?.src])

  const syncAudioToVideo = useCallback(() => {
    const video = videoRef.current
    const audio = audioRef.current
    if (!video || !audio || !hasAudio) return

    const vt = video.currentTime

    if (vt < placementStart || vt >= placementStart + (trimEnd - trimStart)) {
      if (!audio.paused) audio.pause()
      return
    }

    const targetAudioTime = trimStart + (vt - placementStart)
    if (targetAudioTime >= trimEnd) {
      audio.pause()
      return
    }

    if (Math.abs(audio.currentTime - targetAudioTime) > 0.25) {
      audio.currentTime = targetAudioTime
    }

    if (!video.paused && audio.paused) {
      audio.play().catch(() => {})
    }
    if (video.paused && !audio.paused) {
      audio.pause()
    }
  }, [hasAudio, trimStart, trimEnd, placementStart])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !hasVideo) return undefined
    const onTime = () => syncAudioToVideo()
    const onPlay = () => {
      setPlaying(true)
      syncAudioToVideo()
    }
    const onPause = () => {
      setPlaying(false)
      audioRef.current?.pause()
    }
    const onEnded = () => {
      setPlaying(false)
      audioRef.current?.pause()
    }
    video.addEventListener('timeupdate', onTime)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)
    return () => {
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
    }
  }, [hasVideo, syncAudioToVideo])

  const togglePlay = () => {
    if (hasVideo && videoRef.current) {
      const video = videoRef.current
      if (video.paused) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
      return
    }

    const audio = audioRef.current
    if (hasAudio && audio) {
      if (audio.paused) {
        const startPlayback = () => {
          audio.currentTime = trimStart
          audio.play().catch(() => {})
          setPlaying(true)
        }
        if (placementStart > 0) {
          placementTimerRef.current = window.setTimeout(startPlayback, placementStart * 1000)
          setPlaying(true)
        } else {
          startPlayback()
        }
      } else {
        if (placementTimerRef.current) {
          clearTimeout(placementTimerRef.current)
          placementTimerRef.current = null
        }
        audio.pause()
        setPlaying(false)
      }
    }
  }

  useEffect(() => {
    return () => {
      if (placementTimerRef.current) clearTimeout(placementTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || hasVideo) return undefined
    const onTime = () => {
      if (audio.currentTime >= trimEnd) {
        audio.pause()
        audio.currentTime = trimStart
        setPlaying(false)
      }
    }
    audio.addEventListener('timeupdate', onTime)
    return () => audio.removeEventListener('timeupdate', onTime)
  }, [hasVideo, hasAudio, trimStart, trimEnd])

  if (!hasVideo && !hasAudio && !images?.length) return null

  return (
    <div className={cn('space-y-3', className)}>
      {hasVideo && (
        <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden bg-transparent group">
          <video
            ref={videoRef}
            src={resolveMediaUrl(videos[0])}
            className="w-full max-h-[min(75vh,720px)] rounded-2xl lg:rounded-3xl bg-transparent object-contain mx-auto block ring-1 ring-white/10"
            playsInline
            muted={hasAudio}
            loop={false}
            controls={!hasAudio}
            onLoadedMetadata={() => setVideoReady(true)}
            preload="metadata"
          />
          {hasAudio && (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              <span className="p-4 rounded-full bg-black/50 backdrop-blur-sm border border-white/20">
                {playing ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-0.5" />}
              </span>
            </button>
          )}
          {videos.length > 1 && (
            <p className="text-xs text-subtle mt-2 text-center">+{videos.length - 1} more video(s)</p>
          )}
        </div>
      )}

      {hasAudio && (
        <>
          <audio ref={audioRef} src={resolveMediaUrl(audioTrack.src)} preload="metadata" className="hidden" />
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface/60 border border-border">
            {hasVideo ? (
              <button
                type="button"
                onClick={togglePlay}
                disabled={!videoReady && hasVideo}
                className="p-2 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors disabled:opacity-50"
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={togglePlay}
                className="p-2 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate flex items-center gap-1">
                <Music className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                {audioTrack.name || 'Music'}
              </p>
              <p className="text-[10px] text-subtle mt-0.5">
                {formatTime(trimStart)}–{formatTime(trimEnd)}
                {placementStart > 0 && ` · starts at ${formatTime(placementStart)}`}
                {' · '}
                {Math.round(volume * 100)}% vol
              </p>
            </div>
            <Volume2 className="w-4 h-4 text-muted shrink-0" />
          </div>
        </>
      )}

      {images?.length > 0 && <PostImageGallery images={images} postId={postId} />}
    </div>
  )
}
