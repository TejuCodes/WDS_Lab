/**
 * ============================================================
 * FILE: src/middleware/errorHandler.js
 * PURPOSE: The LAST stop for any error in the app.
 *
 * TEACHING NOTE - what is middleware?
 *   Middleware is a function that runs "in the middle" of a
 *   request. It receives (req, res, next):
 *     req  = the request (what the client sent)
 *     res  = the response (what we send back)
 *     next = a button that says "I am done, let the next one run"
 *
 *   If you do NOT call next() and you DO send a response, you
 *   "stop the chain" - that is exactly what an error handler does.
 *
 *   IMPORTANT ORDER: error middleware has FOUR parameters
 *   (err, req, res, next). Express only treats it as an error
 *   handler if all four are present. Do not remove `next` even
 *   if you never use it, or Express will treat it as normal
 *   middleware and it will never fire.
 * ============================================================
 */

const { errorResponse } = require("../utils/ApiResponse");

// Anything thrown with `next(error)` lands here. We translate the
// raw error into a clean JSON message the frontend understands.
function errorHandler(err, req, res, next) {
  // `next` is unused in most cases but MUST be the 4th parameter.
  // eslint-disable-next-line no-unused-vars
  console.error("[error]", err);

  // 1) Our own AppError -> we already know the status code.
  //    (See AppError.js - this lets controllers `throw` clean errors.)
  if (err.name === "AppError") {
    return res.status(err.statusCode).json(errorResponse(err.message, null, err.details));
  }

  // 2) Mongoose "validation error" -> a document did not match
  //    its schema (e.g. missing `year`). 400 = Bad Request.
  if (err.name === "ValidationError") {
    const fields = Object.values(err.errors).map((e) => e.message);
    return res
      .status(400)
      .json(errorResponse("Validation failed", { fields }));
  }

  // 3) Mongoose "CastError" -> a value had the wrong type, e.g.
  //    year "abc" where a Number was expected.
  if (err.name === "CastError") {
    return res
      .status(400)
      .json(errorResponse(`Invalid value for field "${err.path}"`, { received: err.value }));
  }

  // 4) Duplicate key error (code 11000) -> a unique index already
  //    holds that value, e.g. two releases for year 2021.
  if (err.code === 11000) {
    return res
      .status(409)
      .json(errorResponse("That record already exists", { keys: err.keyValue }));
  }

  // 5) Anything else is unexpected: hide internals in production so
  //    we never leak stack traces to a user.
  const status = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" ? "Internal server error" : err.message;

  res.status(status).json(errorResponse(message));
}

module.exports = errorHandler;
