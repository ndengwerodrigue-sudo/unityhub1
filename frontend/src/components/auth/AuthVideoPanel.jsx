import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Volume2, VolumeX } from 'lucide-react'

const DEFAULT_MP4 = '/auth/hero.mp4'
const DEFAULT_WEBM = '/auth/hero.webm'

/**
 * Full-panel auth hero video. Drop hero.mp4 (or hero.webm) into frontend/public/auth/
 * Optional override: VITE_AUTH_VIDEO=/auth/my-video.mp4
 */
export default function AuthVideoPanel({ className = '', compact = false }) {
  const videoRef = useRef(null)
  const [muted, setMuted] = useState(true)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  const customSrc = import.meta.env.VITE_AUTH_VIDEO?.trim()
  const mp4Src = customSrc?.endsWith('.webm') ? DEFAULT_MP4 : (customSrc || DEFAULT_MP4)
  const webmSrc = customSrc?.endsWith('.webm') ? customSrc : DEFAULT_WEBM

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setMuted(videoRef.current.muted)
  }

  return (
    <div className={`relative flex flex-col overflow-hidden bg-background ${className}`}>
      {/* Fallback gradient when video is loading or missing */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/15 transition-opacity duration-700 ${
          ready && !failed ? 'opacity-40' : 'opacity-100'
        }`}
        aria-hidden
      />
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-secondary/10 blur-3xl pointer-events-none" aria-hidden />

      {/* Video — object-contain scales any aspect ratio */}
      {!failed && (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setReady(true)}
          onError={() => setFailed(true)}
          aria-label="Unity Hub introduction video"
        >
          <source src={mp4Src} type="video/mp4" />
          <source src={webmSrc} type="video/webm" />
        </video>
      )}

      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
          <p className="text-sm text-muted max-w-xs leading-relaxed">
            Add your video to{' '}
            <code className="text-xs text-primary/90 bg-surface px-1.5 py-0.5 rounded border border-border">
              frontend/public/auth/hero.mp4
            </code>
          </p>
        </div>
      )}

      {/* Top bar: logo + mute */}
      {!compact && (
        <div className="relative z-10 flex items-center justify-between p-8 xl:p-10">
          <Link to="/" className="inline-flex items-center gap-2.5 text-foreground font-semibold drop-shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary shadow-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            Unity Hub
          </Link>

          {ready && !failed && (
            <button
              type="button"
              onClick={toggleMute}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-background/60 backdrop-blur-sm text-foreground hover:bg-surface transition"
              aria-label={muted ? 'Unmute video' : 'Mute video'}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          )}
        </div>
      )}

      {compact && ready && !failed && (
        <button
          type="button"
          onClick={toggleMute}
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-background/60 backdrop-blur-sm text-foreground hover:bg-surface transition"
          aria-label={muted ? 'Unmute video' : 'Mute video'}
        >
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
      )}

      {/* Spacer pushes footer down */}
      <div className="flex-1 min-h-0" />

      {!compact && (
        <p className="relative z-10 px-8 xl:px-10 pb-8 text-xs text-subtle drop-shadow-sm">
          &copy; {new Date().getFullYear()} Unity Hub
        </p>
      )}
    </div>
  )
}
