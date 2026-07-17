import multer from 'multer';
import { ApiError } from '../utils/ApiError';

const ALLOWED_MIME = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls (legacy, still parsed by exceljs where possible)
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB — generous for any realistic faculty/team roster

export const excelUpload = multer({
  storage: multer.memoryStorage(), // never persist raw uploads to disk unvalidated
  limits: { fileSize: MAX_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(ApiError.badRequest('Only .xlsx/.xls spreadsheet files are accepted'));
    }
    cb(null, true);
  },
}).single('file');
