/**
 * ============================================================
 * FILE: src/middleware/notFound.js
 * PURPOSE: Handles requests to URLs that do not exist.
 *
 * WHY it must be registered LAST (just before errorHandler)?
 *   Express walks the middleware stack in order. If notFound were
 *   registered early it would answer 404 before any real route
 *   got a chance to match. So the order in app.js is:
 *     routes -> notFound -> errorHandler
 * ============================================================
 */

const AppError = require("./AppError");

function notFound(req, res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
