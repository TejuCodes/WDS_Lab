import client from "./client";

/**
 * ============================================================
 * SECURITY NEWS API
 * ------------------------------------------------------------
 * The browser never talks to a news publisher directly. It asks
 * our own backend, which reads a fixed allowlist of feeds, strips
 * the HTML out of them and caches the result.
 *
 * Two reasons that matters, and both are security topics in this
 * project:
 *
 *   1. SSRF. If the page asked a publisher for a feed, and a user
 *      could choose that URL, our visitor's browser (or our server,
 *      depending on the design) would be pointed at whatever
 *      address the user liked. Putting the fetch on the server with
 *      a hardcoded list removes the choice entirely.
 *   2. XSS. A feed is HTML written by a stranger. The backend turns
 *      every story into plain text before it reaches us, so there is
 *      no markup here for React to render.
 *
 * That is also why these functions take a filter but never a URL.
 * ============================================================
 */

/**
 * The live feed.
 * @param {object} opts
 * @param {string} [opts.source] a source id from /news/sources
 * @param {string} [opts.kind]    "advisory" | "news" | "research"
 * @param {number} [opts.limit]   how many stories
 * @returns full payload: { success, message, data, meta }
 */
export const getNews = ({ source, kind, limit } = {}) => {
  const params = {};
  if (source) params.source = source;
  if (kind) params.kind = kind;
  if (limit) params.limit = limit;
  return client.get("/news", { params });
};

/** The configured sources, used to build the filter buttons. */
export const getNewsSources = () => client.get("/news/sources");
