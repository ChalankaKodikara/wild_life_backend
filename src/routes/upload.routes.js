const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload.middleware");
const {
  uploadSingleImage,
  uploadMultipleImages,
} = require("../controllers/upload.controller");

router.post("/single", upload.single("image"), uploadSingleImage);
router.post("/multiple", upload.array("images", 10), uploadMultipleImages);

module.exports = router;
