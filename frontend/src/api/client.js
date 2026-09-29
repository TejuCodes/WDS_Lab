import axios from "axios";

/**
 * ============================================================
 * API CLIENT
 * ------------------------------------------------------------
 * One axios instance for the whole app.
 *
 * WHY A SHARED INSTANCE?
 *   - baseURL is written once, so no component repeats "http://..."
 *   - timeouts are set once, so a hung request cannot leave a
 *     spinner on screen forever
 *   - an interceptor can unwrap our standard response shape, so
 *     pages receive `data` directly instead of response.data.data
 *
 * The dev server proxies /api to Express (see vite.config.js), so
 * in development we call relative URLs like "/api/owasp/timeline".
 * In production you set VITE_API_BASE_URL to your real API host.
 * ============================================================
 */

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/**
 * Response interceptor.
 * Every successful response from our backend looks like:
 *   { success: true, message: "...", data: {...}, meta: {...} }
 * Unwrapping it here means pages can just use the payload.
 * Errors keep their shape { success:false, message } so a page can
 * show `err.response?.data?.message`.
 */
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // A timeout has no response object, so give it a readable message.
    if (error.code === "ECONNABORTED") {
      error.message = "The request took too long. Is the backend running?";
    }
    return Promise.reject(error);
  }
);

export default client;
