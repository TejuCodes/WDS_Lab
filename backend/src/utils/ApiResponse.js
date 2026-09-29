/**
 * ============================================================
 * FILE: src/utils/ApiResponse.js
 * PURPOSE: One consistent JSON "shape" for every API reply.
 *
 * WHY?
 *   The frontend has to read responses from many endpoints. If each
 *   endpoint returned a different structure the React code would
 *   need lots of `if` checks. Instead we ALWAYS return:
 *
 *   {
 *     "success": true | false,
 *     "message": "human readable text",
 *     "data":    <payload> | null,
 *     "meta":    <optional extra info like counts/pagination>
 *   }
 *
 *   The frontend can then rely on `response.data.success` always.
 * ============================================================
 */

/**
 * Builds a successful response body.
 * @param {object} data  the payload (e.g. list of releases)
 * @param {string} message short human readable message
 * @param {object} [meta] optional extra info (counts, page numbers...)
 */
function successResponse(data, message = "OK", meta = undefined) {
  const body = { success: true, message, data: data ?? null };
  // Only add `meta` when it actually contains something, so the
  // JSON stays clean for endpoints that do not need it.
  if (meta) body.meta = meta;
  return body;
}

/**
 * Builds an error response body. Same shape as success so the
 * frontend can handle both with the same code path.
 */
function errorResponse(message = "Something went wrong", data = null, meta = undefined) {
  const body = { success: false, message, data };
  if (meta) body.meta = meta;
  return body;
}

module.exports = { successResponse, errorResponse };
