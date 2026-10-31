import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate secure randomized filename to prevent directory traversal or collision
    const randomHex = crypto.randomBytes(16).toString('hex');
    const safeExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    cb(null, `${Date.now()}-${randomHex}${safeExt}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: (Number(process.env.MAX_FILE_SIZE_MB) || 15) * 1024 * 1024, // 15MB default
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error(`Unsupported file format (${file.mimetype}). Allowed types: images, PDF, DOC, XLS, CSV, TXT, ZIP.`));
      return;
    }
    cb(null, true);
  },
});

export const getUploadDirectory = (): string => UPLOAD_DIR;

