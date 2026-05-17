const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
];

const allowedExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
  ".gif",
];

const fileFilter = (req, file, cb) => {
  const mime = (file.mimetype || "").toLowerCase();
  const ext = path.extname(file.originalname || "").toLowerCase();

  const isAllowedMime = allowedMimeTypes.includes(mime);
  const isAllowedExt = allowedExtensions.includes(ext);

  if (isAllowedMime || isAllowedExt) {
    return cb(null, true);
  }

  return cb(
    new Error(
      `Invalid image type. Received: ${mime || "unknown"}. Only JPG, JPEG, PNG, WEBP, HEIC, HEIF and GIF are allowed.`,
    ),
    false,
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
});

module.exports = upload;
