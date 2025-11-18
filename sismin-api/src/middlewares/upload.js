import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // carpeta temporal
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato no soportado. Solo JPG y PNG'), false);
  }
};

const maxSizeMb = Number(process.env.MAX_FILE_MB || 5);

const upload = multer({
  storage,
  limits: { fileSize: process.env.MAX_FILE_MB * 1024 * 1024 },
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
  fileFilter
});

export default upload;