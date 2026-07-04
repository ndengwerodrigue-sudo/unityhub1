const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'uploads', 'posts');
fs.mkdirSync(uploadDir, { recursive: true });

const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.ogv', '.3gp']);
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.heic', '.heif']);
const AUDIO_EXT = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.webm']);

function extOf(name = '') {
  return path.extname(name).toLowerCase();
}

function isAllowedMedia(file) {
  const mime = file.mimetype || '';
  if (mime.startsWith('video/') || mime.startsWith('image/') || mime.startsWith('audio/')) {
    return true;
  }
  const ext = extOf(file.originalname);
  return VIDEO_EXT.has(ext) || IMAGE_EXT.has(ext) || AUDIO_EXT.has(ext);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = extOf(file.originalname) || '.bin';
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, safe);
  },
});

const uploadPostMedia = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (isAllowedMedia(file)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image, video, and audio files are allowed'));
  },
});

module.exports = {
  uploadPostMedia,
  uploadDir,
};
