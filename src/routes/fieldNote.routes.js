const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload.middleware");
const authMiddleware = require("../middleware/auth.middleware");
const {
  submitFieldNote,
  getAllFieldNotes,
  getFieldNotesByCreatedBy,
  getMyFieldNotes,
  getFieldNoteById,
  deleteFieldNoteById,
} = require("../controllers/fieldNote.controller");

router.post(
  "/submit",
  authMiddleware,
  (req, res, next) => {
    upload.array("images", 10)(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Image upload failed",
        });
      }

      next();
    });
  },
  submitFieldNote,
);

router.get("/", authMiddleware, getAllFieldNotes);
router.get("/my-notes", authMiddleware, getMyFieldNotes);
router.get("/user/:createdById", authMiddleware, getFieldNotesByCreatedBy);
router.get("/:id", authMiddleware, getFieldNoteById);
router.delete("/:id", authMiddleware, deleteFieldNoteById);
module.exports = router;
