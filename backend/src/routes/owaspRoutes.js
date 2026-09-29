/**
 * ============================================================
 * FILE: src/routes/owaspRoutes.js
 * LAYER: Route
 *
 * TEACHING NOTE - what is a route?
 *   A route maps an HTTP method + URL to a controller function:
 *     router.get("/releases", controller.getAllReleases)
 *
 *   Use `router` (not `app`) here. `app.js` mounts this file once at a
 *   prefix, e.g. app.use("/api/owasp", owaspRoutes). That keeps the
 *   URLs short and grouped: /api/owasp/releases, /api/owasp/timeline...
 * ============================================================
 */

const express = require("express");
const controller = require("../controllers/owaspReleaseController");

const router = express.Router();

/* ---------- timeline & overview ---------- */
router.get("/stats", controller.getStats); // small dashboard numbers
router.get("/timeline", controller.getTimeline); // years + 10 titles each, one call
router.get("/releases/latest", controller.getLatestRelease); // must come BEFORE /:year
router.get("/releases", controller.getAllReleases); // ?brief=true for the light version

/* ---------- one edition + its history ---------- */
router.get("/releases/:year", controller.getReleaseByYear);
router.get("/releases/:year/changes", controller.getChangesForYear);

module.exports = router;
