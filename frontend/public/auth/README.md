# Auth page video

Place your login/sign-up hero video in this folder.

## Quick start

1. Add your video file as **`hero.mp4`** (recommended), or **`hero.webm`**
2. Refresh the login or register page — no rebuild needed

```
frontend/public/auth/
  hero.mp4    ← your video (any resolution / aspect ratio)
  hero.webm   ← optional second format for broader browser support
```

## Supported formats

- **MP4** (H.264) — `hero.mp4` — works in all modern browsers
- **WebM** — `hero.webm` — optional fallback

## Notes

- The player **scales any video size** to fit the panel (letterboxed if needed)
- Videos autoplay **muted** and loop (required for browser autoplay policies)
- Keep file size reasonable for fast loads (under ~20 MB is ideal)
- To use a custom filename, set in `frontend/.env`:

  ```
  VITE_AUTH_VIDEO=/auth/your-filename.mp4
  ```
