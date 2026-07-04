import { Music, Upload, X, Scissors } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import Button from '../ui/Button'
import { formatTime, getTimelineMax, readAudioFile } from '../../utils/post'

export default function MusicEditor({ audioTrack, onChange, onRemove, videos = [] }) {
  const timelineMax = getTimelineMax(videos, audioTrack)
  const duration = audioTrack?.duration || timelineMax
  const trimStart = audioTrack?.trimStart ?? 0
  const trimEnd = audioTrack?.trimEnd ?? duration
  const volume = audioTrack?.volume ?? 0.7
  const placementStart = audioTrack?.placementStart ?? 0

  const update = (patch) => onChange({ ...audioTrack, ...patch })

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const track = await readAudioFile(file)
      onChange(track)
      toast.success('Music loaded')
    } catch (err) {
      toast.error(err.message || 'Failed to load audio')
    }
  }

  if (!audioTrack?.src) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle accent="rose" className="flex items-center gap-2 text-base">
            <Music className="w-4 h-4 text-rose-400" />
            Music
          </CardTitle>
          <CardDescription>Add background music to your post or video</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-border hover:border-rose-500/40 hover:bg-rose-500/5 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-muted" />
            <span className="text-sm font-medium text-foreground">Upload MP3, WAV, or M4A</span>
            <span className="text-xs text-muted">Trim, adjust volume, and place on timeline</span>
            <input type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          </label>
        </CardContent>
      </Card>
    )
  }

  const trimPercent = (v) => (duration > 0 ? (v / duration) * 100 : 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 w-full">
          <div>
            <CardTitle accent="rose" className="flex items-center gap-2 text-base">
              <Music className="w-4 h-4 text-rose-400" />
              Music editor
            </CardTitle>
            <CardDescription className="truncate max-w-[240px]">{audioTrack.name}</CardDescription>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10"
            aria-label="Remove music"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-5">
        <div>
          <p className="text-xs font-medium text-subtle uppercase tracking-wide mb-2 flex items-center gap-1">
            <Scissors className="w-3.5 h-3.5" /> Crop music
          </p>
          <div className="relative h-10 rounded-xl bg-surface border border-border overflow-hidden">
            <div
              className="absolute inset-y-0 bg-violet-500/25 border-x-2 border-violet-400/60"
              style={{
                left: `${trimPercent(trimStart)}%`,
                right: `${100 - trimPercent(trimEnd)}%`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted">
              {formatTime(trimStart)} → {formatTime(trimEnd)} ({formatTime(trimEnd - trimStart)})
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <label className="space-y-1">
              <span className="text-xs text-muted">Trim start</span>
              <input
                type="range"
                min={0}
                max={Math.max(0, trimEnd - 0.5)}
                step={0.1}
                value={trimStart}
                onChange={(e) => update({ trimStart: Math.min(Number(e.target.value), trimEnd - 0.5) })}
                className="w-full accent-violet-500"
              />
              <span className="text-[10px] text-subtle tabular-nums">{formatTime(trimStart)}</span>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted">Trim end</span>
              <input
                type="range"
                min={trimStart + 0.5}
                max={duration}
                step={0.1}
                value={trimEnd}
                onChange={(e) => update({ trimEnd: Number(e.target.value) })}
                className="w-full accent-violet-500"
              />
              <span className="text-[10px] text-subtle tabular-nums">{formatTime(trimEnd)}</span>
            </label>
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-medium text-subtle uppercase tracking-wide">Music volume</span>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => update({ volume: Number(e.target.value) })}
              className="flex-1 accent-primary"
            />
            <span className="text-sm font-medium text-foreground tabular-nums w-10 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-medium text-subtle uppercase tracking-wide">
            {videos.length > 0 ? 'Start music on video at' : 'Start music on post at'}
          </span>
          <input
            type="range"
            min={0}
            max={timelineMax}
            step={0.1}
            value={placementStart}
            onChange={(e) => update({ placementStart: Number(e.target.value) })}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-subtle tabular-nums">
            <span>0:00</span>
            <span className="text-cyan-400 font-medium">{formatTime(placementStart)}</span>
            <span>{formatTime(timelineMax)}</span>
          </div>
          {videos.length > 0 && (
            <p className="text-[10px] text-muted">
              Music plays when the video reaches {formatTime(placementStart)}. Video is muted while music plays.
            </p>
          )}
        </label>

        <Button type="button" variant="secondary" size="sm" onClick={() => document.getElementById('music-replace-input')?.click()}>
          Replace track
        </Button>
        <input id="music-replace-input" type="file" accept="audio/*" className="hidden" onChange={handleFile} />
      </CardContent>
    </Card>
  )
}
