const User = require("../models/User");
const bcrypt = require("bcryptjs");

/* =========================================
   GET PROFILE
   GET /api/users/profile
========================================= */

const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch profile.",
    });
  }
};

/* =========================================
   UPDATE PROFILE
   PUT /api/users/profile
========================================= */

const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    user.username = username || user.username;
    user.email = email || user.email;

    const updatedUser = await user.save();

    res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: "Unable to update profile.",
    });
  }
};

/* =========================================
   CHANGE PASSWORD
   PUT /api/users/change-password
========================================= */

const changePassword = async (req, res) => {
  try {

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: "Please fill all fields.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match.",
      });
    }

    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect.",
      });
    }

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(
      newPassword,
      salt
    );

    await user.save();

    res.status(200).json({
      message: "Password changed successfully.",
    });

  } catch (error) {
    res.status(500).json({
      message: "Unable to change password.",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};