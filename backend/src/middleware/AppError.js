/**
 * ============================================================
 * FILE: src/middleware/AppError.js
 * PURPOSE: A custom Error class with an HTTP status code.
 *
 * TEACHING NOTE - why not just `throw new Error("bad year")`?
 *   A normal Error has no HTTP status. Our error middleware would
 *   then answer 500 (server's fault) when the truth is 400
 *   (the client's fault). AppError carries `statusCode` so we can
 *   reply with the correct code: 400 bad request, 404 not found,
 *   409 conflict...
 * ============================================================
 */

class AppError extends Error {
  /**
   * @param {string} message   message shown to the client
   * @param {number} statusCode HTTP status code (default 500)
   * @param {object} [details] extra info (e.g. allowed years)
   */
  constructor(message, statusCode = 500, details = undefined) {
    // Calling the parent Error constructor gives us `this.message`
    // and a clean `stack` trace for debugging.
    super(message);
    this.name = "AppError"; // our errorHandler checks for this name
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, AppError);
  }

  // Shortcut factories so controllers read nicely:
  //   throw AppError.badRequest("Year must be 2003-2025");
  static badRequest(message, details) {
    return new AppError(message, 400, details);
  }
  static notFound(message = "Resource not found", details) {
    return new AppError(message, 404, details);
  }
  static conflict(message, details) {
    return new AppError(message, 409, details);
  }
}

module.exports = AppError;
