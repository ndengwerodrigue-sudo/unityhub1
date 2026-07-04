/** Normalize and validate audio track payload from API */
function normalizeAudioTrack(raw) {
  if (!raw || typeof raw !== 'object' || !raw.src) return null;

  const duration = Math.max(0, Number(raw.duration) || 0);
  let trimStart = Math.max(0, Number(raw.trimStart) || 0);
  let trimEnd = Number(raw.trimEnd);
  if (!trimEnd || trimEnd <= trimStart) {
    trimEnd = duration > 0 ? duration : trimStart + 30;
  }
  trimEnd = Math.min(trimEnd, duration || trimEnd);

  return {
    src: String(raw.src),
    name: String(raw.name || 'Audio track').slice(0, 120),
    duration,
    trimStart,
    trimEnd,
    volume: Math.min(1, Math.max(0, Number(raw.volume ?? 0.7))),
    placementStart: Math.max(0, Number(raw.placementStart) || 0),
  };
}

module.exports = { normalizeAudioTrack };
