const mongoose = require("mongoose");

const fieldNoteSchema = new mongoose.Schema(
  {
    entry_name: {
      type: String,
      required: true,
      trim: true,
    },
    temperature: {
      type: Number,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    location_text: {
      type: String,
      default: "",
    },
    draft_status: {
      type: String,
      enum: ["draft", "submitted"],
      default: "draft",
    },
    images: [
      {
        url: String,
        public_id: String,
        original_name: String,
      },
    ],
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("FieldNote", fieldNoteSchema);
