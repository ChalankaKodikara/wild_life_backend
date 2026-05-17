const FieldNote = require("../models/fieldNote.model");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (fileBuffer, folder = "field_notes") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

const convertDMSToDecimal = (value) => {
  if (value === undefined || value === null || value === "") return null;

  const raw = value.toString().trim().replace(/`/g, "");

  const decimal = Number(raw);
  if (!Number.isNaN(decimal)) return decimal;

  const match = raw.match(
    /(\d+(?:\.\d+)?)°\s*(\d+(?:\.\d+)?)'\s*(\d+(?:\.\d+)?)"?\s*([NSEW])/i,
  );

  if (!match) return null;

  const degrees = parseFloat(match[1]);
  const minutes = parseFloat(match[2]);
  const seconds = parseFloat(match[3]);
  const direction = match[4].toUpperCase();

  let result = degrees + minutes / 60 + seconds / 3600;

  if (direction === "S" || direction === "W") {
    result *= -1;
  }

  return result;
};

exports.submitFieldNote = async (req, res) => {
  try {
    const {
      entry_name,
      temperature,
      notes,
      latitude,
      longitude,
      location_text,
      draft_status,
    } = req.body;

    if (!entry_name || entry_name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "entry_name is required",
      });
    }

    const parsedLatitude = convertDMSToDecimal(latitude);
    const parsedLongitude = convertDMSToDecimal(longitude);

    if (parsedLatitude === null || parsedLongitude === null) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    const uploadedImages = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "field_notes");

        uploadedImages.push({
          url: result.secure_url,
          public_id: result.public_id,
          original_name: file.originalname,
          mime_type: file.mimetype,
        });
      }
    }

    const newFieldNote = await FieldNote.create({
      entry_name: entry_name.trim(),
      temperature,
      notes,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      location_text,
      draft_status: draft_status || "submitted",
      images: uploadedImages,
      created_by: req.user.id,
    });

    const finalData = await FieldNote.findById(newFieldNote._id).populate(
      "created_by",
      "full_name email phone status",
    );

    return res.status(201).json({
      success: true,
      message: "Field note saved successfully",
      data: finalData,
    });
  } catch (error) {
    console.error("FIELD NOTE SUBMIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save field note",
      error: error.message,
    });
  }
};

exports.getAllFieldNotes = async (req, res) => {
  try {
    const fieldNotes = await FieldNote.find()
      .populate("created_by", "full_name email phone status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: fieldNotes.length,
      data: fieldNotes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch field notes",
      error: error.message,
    });
  }
};

exports.getFieldNotesByCreatedBy = async (req, res) => {
  try {
    const { createdById } = req.params;

    const fieldNotes = await FieldNote.find({ created_by: createdById })
      .populate("created_by", "full_name email phone status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: fieldNotes.length,
      data: fieldNotes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch field notes by user",
      error: error.message,
    });
  }
};

exports.getMyFieldNotes = async (req, res) => {
  try {
    const fieldNotes = await FieldNote.find({ created_by: req.user.id })
      .populate("created_by", "full_name email phone status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: fieldNotes.length,
      data: fieldNotes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch my field notes",
      error: error.message,
    });
  }
};

exports.getFieldNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    const fieldNote = await FieldNote.findById(id).populate(
      "created_by",
      "full_name email phone status",
    );

    if (!fieldNote) {
      return res.status(404).json({
        success: false,
        message: "Field note not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: fieldNote,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch field note",
      error: error.message,
    });
  }
};

exports.deleteFieldNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    const fieldNote = await FieldNote.findById(id);

    if (!fieldNote) {
      return res.status(404).json({
        success: false,
        message: "Field note not found",
      });
    }

    if (fieldNote.created_by.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this field note",
      });
    }

    if (fieldNote.images && fieldNote.images.length > 0) {
      for (const image of fieldNote.images) {
        if (image.public_id) {
          await cloudinary.uploader.destroy(image.public_id);
        }
      }
    }

    await FieldNote.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Field note deleted successfully",
      deleted_id: id,
    });
  } catch (error) {
    console.error("FIELD NOTE DELETE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete field note",
      error: error.message,
    });
  }
};
