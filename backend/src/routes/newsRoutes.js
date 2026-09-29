/**
 * ============================================================
 * FILE: src/routes/newsRoutes.js
 * LAYER: Route
 *
 * TEACHING NOTE - what is a route?
 *   A route maps an HTTP method + URL to a controller function.
 *   `app.js` mounts this file once at /api/news, so everything here
 *   lives under that prefix.
 *
 * READ THIS BEFORE ADDING A ROUTE:
 *   Do not add a route that takes a URL to fetch. That endpoint
 *   would let any visitor use our server as a proxy into whatever
 *   network it can reach. See the header of data/newsSources.js for
 *   the full SSRF explanation.
 * ============================================================
 */

const express = require("express");
const controller = require("../controllers/newsController");

const router = express.Router();

/* The live feed. ?source= ?kind= ?limit= ?refresh=true */
router.get("/", controller.getNewsFeed);

/* The allowlist, so the UI can build its filters from the truth. */
router.get("/sources", controller.listNewsSources);

module.exports = router;
