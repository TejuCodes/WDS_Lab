/**
 * ============================================================
 * FILE: src/app.js
 * LAYER: App
 *
 * This file BUILDS the Express application but does NOT start it.
 * Keeping "build" and "listen" separate is a best practice:
 *   - app.js  can be imported by tests without opening a port
 *   - server.js is the only place that calls app.listen()
 *
 * THE MIDDLEWARE ORDER BELOW IS NOT RANDOM. Read it top to bottom:
 * ============================================================
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const { successResponse } = require("./utils/ApiResponse");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

// Create the app. `express()` returns a request handler function with
// helper methods (.use, .get, .post...) attached.
const app = express();

/* ============================================================
 * 1) SECURITY HEADERS  (must be first so every response has them)
 * ============================================================
 * helmet sets safe HTTP headers automatically. It is a good habit to
 * learn it BY DEFAULT because you will forget to add it manually in
 * one project or another.
 *
 * TEACHING MOMENT: this very course is about secure defaults. Turn
 * helmet off and see which headers disappear in the browser's
 * Network tab - then turn it back on.
 */
app.use(
  helmet({
    // The React app is served from a different PORT than the API, not
    // a different domain, so images from the docs are fine. We relax
    // this one policy so student documentation links can show images.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/* ============================================================
 * 2) CORS - "who is allowed to call me?"
 * ============================================================
 * The browser BLOCKS a page on http://localhost:5173 from calling an
 * API on http://localhost:5000 unless that API says so. That is CORS.
 * In production you would list your real site and nothing else.
 */
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, callback) {
      // No `origin` header = a tool like curl or Postman, not a
      // browser. Browsers ALWAYS send it, so allowing "no origin"
      // does not open the API to random websites.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin} is not allowed.`));
    },
    credentials: true, // allows cookies/Authorization headers later
  })
);

/* ============================================================
 * 3) BODY PARSING - read JSON and form data from the request
 * ============================================================
 * Without this, req.body would always be undefined and your POST
 * endpoints would crash. The limit stops someone sending a 2 GB body.
 */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* ============================================================
 * 4) REQUEST LOGGING
 * ============================================================
 * morgan prints one line per request: method, URL, status, time.
 * "dev" is a readable format for local development.
 */
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

/* ============================================================
 * 5) ROUTES
 * ============================================================
 * Every feature gets its own router file. `app.use(prefix, router)`
 * means "for URLs starting with prefix, use these routes".
 */
app.get("/api/health", (req, res) => {
  res.json(successResponse({ status: "ok", uptimeSeconds: Math.round(process.uptime()) }, "API is healthy"));
});

app.use("/api/owasp", require("./routes/owaspRoutes"));
app.use("/api/vulnerabilities", require("./routes/vulnerabilityRoutes"));
app.use("/api/progress", require("./routes/progressRoutes"));
app.use("/api/news", require("./routes/newsRoutes"));

/* ============================================================
 * 6) 404 - unknown URL
 * ============================================================
 * Registered AFTER all routes so it only runs if nothing matched.
 */
app.use(notFound);

/* ============================================================
 * 7) ERROR HANDLER - must be the very last line
 * ============================================================
 * Any error thrown anywhere above arrives here and becomes clean JSON.
 */
app.use(errorHandler);

// Export the app without listening, so tests can import it.
module.exports = app;
