const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const generateToken = require("../utils/generateToken");

exports.register = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "full_name, email and password are required",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      full_name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email && !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.status === "INACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact admin",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken({
      id: user._id,
      email: user.email,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging in",
    });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};
