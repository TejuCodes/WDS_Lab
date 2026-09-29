/**
 * ============================================================
 * FILE: src/controllers/owaspReleaseController.js
 * LAYER: Controller
 *
 * TEACHING NOTE - what is a controller?
 *   The HTTP route is a thin line: it knows the URL and the method.
 *   Everything else (querying Mongo, deciding what to send) lives in a
 *   controller function. This split means:
 *     - you can test the controller without starting a web server
 *     - the same logic can be reused by a CLI script or a cron job
 *
 *   Signature of an Express controller:
 *     (req, res, next) => {}
 *       req  - request  (req.params = /:year, req.query = ?limit=2)
 *       res  - response (res.json(), res.status())
 *       next - pass control to the next middleware / error handler
 *
 *   THE THREE RULES we always follow:
 *     1. GET  endpoints do not change data -> no database writes.
 *     2. Every error path ends with `next(err)` so ONE error handler
 *        formats the response. No try/catch copy-paste in each route.
 *     3. Wrap async code so rejected promises reach `next`.
 * ============================================================
 */

const OwaspRelease = require("../models/OwaspRelease");
const Vulnerability = require("../models/Vulnerability");
const { successResponse } = require("../utils/ApiResponse");
const AppError = require("../middleware/AppError");

/**
 * Small helper: Express does NOT catch errors thrown inside an
 * `async` function automatically. Without this wrapper a rejected
 * promise would hang the request until it timed out.
 * Express 5 handles this natively; we do it explicitly so the code
 * works the same way on Express 4 and 5.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** Years we officially ship: 2003, 2004, 2007, 2010, 2013, 2017, 2021, 2025. */
const SUPPORTED_YEARS = [2003, 2004, 2007, 2010, 2013, 2017, 2021, 2025];

/**
 * GET /api/owasp/releases
 * Returns every release, oldest first - this feeds the timeline.
 *
 * `?brief=true` returns a light version (year + title + summary only),
 * which is much faster for drawing the timeline, because the `changes`
 * and `categories` arrays are left out.
 */
exports.getAllReleases = asyncHandler(async (req, res) => {
  const brief = req.query.brief === "true";

  // `.select()` chooses which fields MongoDB should return. Fewer
  // fields = less network traffic = faster page.
  const query = OwaspRelease.find({}).sort({ year: 1 });
  if (brief) query.select("year title summary isLatest changes sourceUrl");

  const releases = await query.exec();

  res.json(
    successResponse(
      releases,
      `Loaded ${releases.length} OWASP Top 10 releases`,
      { count: releases.length, first: releases[0]?.year, last: releases.at(-1)?.year }
    )
  );
});

/**
 * GET /api/owasp/releases/latest
 * The newest official release (2025). We hard-code "latest = highest
 * year in the database" rather than trusting a boolean field, so the
 * API stays correct even if a flag is forgotten during seeding.
 */
exports.getLatestRelease = asyncHandler(async (req, res) => {
  const release = await OwaspRelease.findOne().sort({ year: -1 });
  if (!release) throw AppError.notFound("No OWASP releases are loaded yet. Run: npm run seed");
  res.json(successResponse(release, `Latest release: ${release.year}`));
});

/**
 * GET /api/owasp/releases/:year
 * One edition WITH its 10 categories, plus a progress hint.
 *
 * The categories are stored on the release document, so this is a
 * single database read - no join needed. We only return a summary of
 * each vulnerability (title, slug, severity, flags) because the long
 * teaching text is fetched later by /vulnerabilities/:slug.
 */
exports.getReleaseByYear = asyncHandler(async (req, res) => {
  // `req.params.year` is ALWAYS a string. "2003" === 2003 is false in
  // JavaScript, so convert before comparing numbers.
  const year = Number(req.params.year);

  if (!SUPPORTED_YEARS.includes(year)) {
    throw AppError.badRequest(
      `"${req.params.year}" is not an official OWASP Top 10 release year.`,
      { supportedYears: SUPPORTED_YEARS }
    );
  }

  const release = await OwaspRelease.findOne({ year });
  if (!release) {
    throw AppError.notFound(`OWASP Top 10 ${year} is not in the database. Run: npm run seed`);
  }

  // Lightweight summaries so the year view loads fast.
  const items = await Vulnerability.getByYear(year).select(
    "owaspId rank title slug typicalSeverity isNewCategoryInThisYear isRemovedVsPreviousYear changeNote conceptKey"
  );

  res.json(
    successResponse(
      {
        ...release.toObject(),
        // `categories` holds only titles; `items` carries the flags the
        // timeline and the "What changed" badges need.
        items,
      },
      `OWASP Top 10 - ${year}`
    )
  );
});

/**
 * GET /api/owasp/releases/:year/changes
 * The dedicated "What Changed?" endpoint.
 *
 * Returns three things:
 *   1. the previous year (null for 2003, the first edition)
 *   2. `changes`   - official bullet points for this edition
 *   3. `diff`      - item-by-item comparison, computed by us:
 *        added   -> flagged isNewCategoryInThisYear
 *        removed -> flagged isRemovedVsPreviousYear
 *        carried -> everything else, with its changeNote
 */
exports.getChangesForYear = asyncHandler(async (req, res) => {
  const year = Number(req.params.year);

  if (!SUPPORTED_YEARS.includes(year)) {
    throw AppError.badRequest(
      `"${req.params.year}" is not an official OWASP Top 10 release year.`,
      { supportedYears: SUPPORTED_YEARS }
    );
  }

  const release = await OwaspRelease.findOne({ year });
  if (!release) throw AppError.notFound(`OWASP Top 10 ${year} is not in the database.`);

  // 2003 is the first official list -> nothing to compare against.
  const previousYears = SUPPORTED_YEARS.filter((y) => y < year);
  const previousYear = previousYears.length ? previousYears.at(-1) : null;
  const previousRelease = previousYear
    ? await OwaspRelease.findOne({ year: previousYear })
    : null;

  const items = await Vulnerability.getByYear(year).select(
    "owaspId rank title slug isNewCategoryInThisYear isRemovedVsPreviousYear replacedFrom changeNote conceptKey"
  );

  // ---- HOW THE DIFF IS COMPUTED -------------------------------
  // We compare the CONCEPT of each entry, not its name. That way a
  // rename such as "Unvalidated Parameters" -> "Unvalidated Input"
  // is correctly seen as "carried over", not as add + remove.
  const currentConcepts = new Set(items.map((v) => v.conceptKey));
  const previousItems = previousYear
    ? await Vulnerability.getByYear(previousYear).select("owaspId rank title conceptKey")
    : [];
  const previousConcepts = new Set(previousItems.map((v) => v.conceptKey));

  // added   = a concept that did not exist in the previous edition
  const added = items
    .filter((v) => v.isNewCategoryInThisYear)
    .map((v) => ({
      owaspId: v.owaspId,
      title: v.title,
      changeNote: v.changeNote,
      replacedFrom: v.replacedFrom,
    }));

  // removed = a concept that WAS in the previous edition and is gone
  // now. `replacedFrom` tells us which new entry absorbed it.
  const absorbedBy = {};
  for (const v of items) {
    for (const from of v.replacedFrom || []) absorbedBy[from] = `${v.owaspId} ${v.title}`;
  }
  const removed = previousItems
    .filter((v) => !currentConcepts.has(v.conceptKey))
    .map((v) => {
      const key = `${v.owaspId} ${v.title} (${previousYear})`;
      return {
        owaspId: v.owaspId,
        title: v.title,
        absorbedBy: absorbedBy[key] || null,
        changeNote: absorbedBy[key]
          ? `No longer a category of its own. Its content is now covered by ${absorbedBy[key]}.`
          : "No longer a category of its own; the risk is now described inside other entries.",
      };
    });

  // carried = still on the list, possibly renamed or moved position
  const carried = items
    .filter((v) => !v.isNewCategoryInThisYear)
    .map((v) => {
      const before = previousItems.find((p) => p.conceptKey === v.conceptKey);
      return {
        owaspId: v.owaspId,
        title: v.title,
        conceptKey: v.conceptKey,
        wasTitle: before ? before.title : null,
        wasRank: before ? before.rank : null,
        renamed: Boolean(before) && before.title !== v.title,
        moved: Boolean(before) && before.rank !== v.rank,
        changeNote: v.changeNote,
      };
    });

  res.json(
    successResponse(
      {
        year,
        title: release.title,
        summary: release.summary,
        // Official, human written bullets for this edition.
        changes: release.changes,
        sourceUrl: release.sourceUrl,
        previousYear,
        previousTitle: previousRelease ? previousRelease.title : null,
        previousSummary: previousRelease ? previousRelease.summary : null,
        diff: { added, removed, carried },
        counts: {
          added: added.length,
          removed: removed.length,
          carried: carried.length,
        },
      },
      previousYear
        ? `What changed from ${previousYear} to ${year}`
        : `${year} is the first official OWASP Top 10 release, so there is nothing to compare it to.`
    )
  );
});

/**
 * GET /api/owasp/timeline
 * Everything the timeline widget needs in ONE request:
 *   - the list of years in order
 *   - for each year: the 10 category titles + the badges
 * This avoids the frontend making 8 separate calls on first paint.
 */
exports.getTimeline = asyncHandler(async (req, res) => {
  const releases = await OwaspRelease.getChronological().lean(); // .lean() = plain JS objects, faster
  const allItems = await Vulnerability.find({})
    .sort({ year: 1, rank: 1 })
    .lean();

  // Group the flat list of 80 documents into years -> array of items.
  // `reduce` builds one object from many; very handy for grouping.
  const itemsByYear = allItems.reduce((acc, item) => {
    (acc[item.year] = acc[item.year] || []).push({
      owaspId: item.owaspId,
      rank: item.rank,
      title: item.title,
      slug: item.slug,
      typicalSeverity: item.typicalSeverity,
      isNewCategoryInThisYear: item.isNewCategoryInThisYear,
      isRemovedVsPreviousYear: item.isRemovedVsPreviousYear,
      changeNote: item.changeNote,
    });
    return acc;
  }, {});

  const timeline = releases.map((r) => ({
    year: r.year,
    title: r.title,
    summary: r.summary,
    isLatest: r.year === Math.max(...SUPPORTED_YEARS),
    sourceUrl: r.sourceUrl,
    items: itemsByYear[r.year] || [],
    totalItems: (itemsByYear[r.year] || []).length,
  }));

  res.json(
    successResponse(timeline, "Timeline ready", {
      count: timeline.length,
      years: timeline.map((t) => t.year),
    })
  );
});

/**
 * GET /api/owasp/stats
 * A tiny dashboard summary - nice for the Home page.
 */
exports.getStats = asyncHandler(async (req, res) => {
  const [releaseCount, vulnerabilityCount, byYear] = await Promise.all([
    OwaspRelease.countDocuments(),
    Vulnerability.countDocuments(),
    // Aggregation = a GROUP BY inside MongoDB, done by the database
    // instead of by JavaScript. Much faster for counting.
    Vulnerability.aggregate([
      { $group: { _id: "$year", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json(
    successResponse(
      {
        releases: releaseCount,
        vulnerabilities: vulnerabilityCount,
        supportedYears: SUPPORTED_YEARS,
        perYear: byYear,
      },
      "Statistics loaded"
    )
  );
});
