const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (fileBuffer, folder = "mobile_uploads") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

exports.uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, "mobile_uploads");

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        original_name: req.file.originalname,
        bytes: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Image upload failed",
      error: error.message,
    });
  }
};

exports.uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No image files provided",
      });
    }

    const uploadedImages = await Promise.all(
      req.files.map(async (file) => {
        const result = await uploadToCloudinary(file.buffer, "mobile_uploads");

        return {
          url: result.secure_url,
          public_id: result.public_id,
          original_name: file.originalname,
          bytes: result.bytes,
          format: result.format,
          width: result.width,
          height: result.height,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      count: uploadedImages.length,
      data: uploadedImages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Multiple image upload failed",
      error: error.message,
    });
  }
};
