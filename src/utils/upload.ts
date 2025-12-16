import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const coversDir = path.join(uploadsDir, 'covers');
const tribesDir = path.join(uploadsDir, 'tribes');

[uploadsDir, avatarsDir, coversDir, tribesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = uploadsDir;
    if (req.path.includes('avatar') || req.path.includes('upload-image')) {
      dest = req.path.includes('/tribes/') ? tribesDir : avatarsDir;
    } else if (req.path.includes('cover') || req.path.includes('upload-cover')) {
      dest = req.path.includes('/tribes/') ? tribesDir : coversDir;
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'img-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Create multer upload instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Process and resize avatar
export const processAvatar = async (filePath: string): Promise<string> => {
  const outputPath = filePath.replace(/\.[^.]+$/, '-processed.jpg');
  
  await sharp(filePath)
    .resize(400, 400, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 90 })
    .toFile(outputPath);

  // Delete original file
  fs.unlinkSync(filePath);

  return outputPath;
};

// Process and resize cover photo
export const processCoverPhoto = async (filePath: string): Promise<string> => {
  const outputPath = filePath.replace(/\.[^.]+$/, '-processed.jpg');
  
  await sharp(filePath)
    .resize(1200, 400, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 85 })
    .toFile(outputPath);

  // Delete original file
  fs.unlinkSync(filePath);

  return outputPath;
};

// Get public URL for uploaded file
export const getFileUrl = (filePath: string): string => {
  // Extract just the filename from the full path
  const fileName = path.basename(filePath);
  let folder = 'uploads';
  if (filePath.includes('avatars')) {
    folder = 'avatars';
  } else if (filePath.includes('covers')) {
    folder = 'covers';
  } else if (filePath.includes('tribes')) {
    folder = 'tribes';
  }
  
  // Return the URL path that will be served by Express static middleware
  return `/uploads/${folder}/${fileName}`;
};

// Process tribe avatar (400x400)
export const processTribeAvatar = async (filePath: string): Promise<string> => {
  const outputPath = filePath.replace(/\.[^.]+$/, '-processed.jpg');
  
  await sharp(filePath)
    .resize(400, 400, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 90 })
    .toFile(outputPath);

  // Delete original file
  fs.unlinkSync(filePath);

  return outputPath;
};

// Process tribe cover (1200x400)
export const processTribeCover = async (filePath: string): Promise<string> => {
  const outputPath = filePath.replace(/\.[^.]+$/, '-processed.jpg');
  
  await sharp(filePath)
    .resize(1200, 400, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 85 })
    .toFile(outputPath);

  // Delete original file
  fs.unlinkSync(filePath);

  return outputPath;
};
