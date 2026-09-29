/**
 * ============================================================
 * FILE: src/controllers/newsController.js
 * PURPOSE: Serve the security news feed to the frontend.
 *
 * NOTE WHAT IS NOT HERE: there is no endpoint that takes a URL.
 * The only query parameters this endpoint understands are
 * `source`, `kind` and `limit`, and all three are checked against
 * values we already know. A user cannot make the server fetch an
 * arbitrary address. That design decision lives in the service and
 * the allowlist; this file just validates input and shapes output.
 *
 * There is also no public way to force a cache refresh. `refresh`
 * used to be honoured from the query string, which let anyone turn
 * one request into ten outbound fetches and hammer every publisher.
 * A forced refresh now requires the server-side token in
 * NEWS_REFRESH_TOKEN, so normal traffic always goes through cache.
 * ============================================================
 */

const { successResponse } = require("../utils/ApiResponse");
const AppError = require("../middleware/AppError");
const { getNews, filterNews, DEFAULT_TTL_MS } = require("../services/newsService");
const { NEWS_SOURCES } = require("../data/newsSources");

/**
 * Small helper: Express does NOT catch errors thrown inside an
 * `async` function automatically. Same wrapper the OWASP
 * controller uses, copied so this controller stands alone.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * GET /api/news
 * Query: ?source=cisa  ?kind=advisory|news|research  ?limit=20
 */
const getNewsFeed = asyncHandler(async (req, res) => {
  const { source, kind, limit, refresh } = req.query;

  // A forced refresh is only honoured when the caller presents the
  // configured server-side token. With NEWS_REFRESH_TOKEN unset the
  // comparison can never match, so the cache is always used.
  const force =
    Boolean(process.env.NEWS_REFRESH_TOKEN) && refresh === process.env.NEWS_REFRESH_TOKEN;

  const payload = await getNews({ force });

  // filterNews returns null when it does not recognise the value.
  // We turn that into a 400 rather than silently ignoring it, so a
  // typo in the query string is visible instead of mysterious.
  const items = filterNews(payload, { source, kind, limit });
  if (items === null) {
    const valid = NEWS_SOURCES.map((s) => s.id).join(", ");
    const kinds = ["advisory", "news", "research"].join(", ");
    throw AppError.badRequest(
      `Unknown filter. Valid source ids: ${valid}. Valid kinds: ${kinds}.`,
      { source: source || null, kind: kind || null }
    );
  }

  // We return the source list alongside the items so the UI can show
  // which publishers answered and which did not, rather than
  // pretending the feed is complete.
  res.json(
    successResponse(items, `Loaded ${items.length} stories from ${payload.sources.length} sources`, {
      fetchedAt: payload.fetchedAt,
      counts: { ...payload.counts, returned: items.length },
      partial: payload.counts.partial,
      sources: payload.sources,
      failures: payload.failures,
      cacheTtlSeconds: Math.round(DEFAULT_TTL_MS / 1000),
    })
  );
});

/**
 * GET /api/news/sources
 * The allowlist, so the UI can render its filter buttons from the
 * same list the server actually fetches. The frontend never keeps
 * its own copy of this list to drift out of sync.
 */
const listNewsSources = asyncHandler(async (req, res) => {
  res.json(
    successResponse(
      NEWS_SOURCES.map(({ id, name, site, kind, blurb }) => ({ id, name, site, kind, blurb })),
      `${NEWS_SOURCES.length} sources configured`
    )
  );
});

module.exports = { getNewsFeed, listNewsSources };
