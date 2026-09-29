/**
 * ============================================================
 * FILE: src/routes/progressRoutes.js
 * LAYER: Route
 *
 * Mounted at /api/progress
 * In a real project, put an `auth` middleware in front of these:
 *   router.use(authMiddleware);
 * so only the signed-in learner can read or change their own data.
 * ============================================================
 */

const express = require("express");
const controller = require("../controllers/progressController");

const router = express.Router();

router.get("/:learnerId", controller.getProgress);
router.get("/:learnerId/stats", controller.getStats);
router.post("/:learnerId/complete", controller.markComplete);
router.delete("/:learnerId/reset", controller.reset);

module.exports = router;
