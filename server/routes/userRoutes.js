const express = require("express");

const router = express.Router();

const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");

// Get logged-in user's profile
router.get("/profile", protect, getProfile);

// Update profile
router.put("/profile", protect, updateProfile);

// Change password
router.put("/change-password", protect, changePassword);

module.exports = router;