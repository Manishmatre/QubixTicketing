import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('[StorageAdapter] Cloudinary object storage adapter initialized.');
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
  'text/markdown',
  'text/html',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/octet-stream',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const randomHex = crypto.randomBytes(16).toString('hex');
    const safeExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    cb(null, `${Date.now()}-${randomHex}${safeExt}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: (Number(process.env.MAX_FILE_SIZE_MB) || 15) * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error(`Unsupported file format (${file.mimetype}). Allowed types: images, PDF, DOC, XLS, CSV, TXT, ZIP.`));
      return;
    }
    cb(null, true);
  },
});

export const processUploadedFile = async (
  file: Express.Multer.File
): Promise<{ fileUrl: string; fileName: string }> => {
  if (isCloudinaryConfigured) {
    try {
      const res = await cloudinary.uploader.upload(file.path, {
        folder: 'qubix-attachments',
        resource_type: 'auto',
      });
      // Optionally cleanup local temp file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return {
        fileUrl: res.secure_url,
        fileName: file.filename,
      };
    } catch (err: any) {
      console.warn(`[StorageAdapter] Cloudinary upload failed (${err.message}), falling back to local file.`);
    }
  }

  return {
    fileUrl: `/uploads/${file.filename}`,
    fileName: file.filename,
  };
};

export const getUploadDirectory = (): string => UPLOAD_DIR;
