import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Local disk storage configuration
const diskStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}${file.originalname}`);
  }
});

// Create local multer upload middleware
const localUpload = multer({ storage: diskStorage });

// Export the appropriate upload middleware based on environment
export default localUpload;

// Note: For production with persistent storage, you would implement
// cloud storage like AWS S3 or use Render's persistent disk feature
// which would require a paid plan. The code above uses local storage
// which works on Render's free tier but files will be lost on service
// restart. For a student project, this limitation is acceptable.