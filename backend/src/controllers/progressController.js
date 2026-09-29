/**
 * ============================================================
 * FILE: src/controllers/progressController.js
 * LAYER: Controller
 *
 * Handles the last two steps of the learning flow:
 *   "Take Quiz" -> recorded by the vulnerability controller
 *   "Mark Complete" -> handled here
 *
 * There is no login in this project yet, so the learner is identified
 * by a `learnerId` string that the React app generates once and keeps
 * in localStorage. Swapping this for a real JWT auth check later only
 * means adding one middleware in front of these routes - the body of
 * the functions stays the same.
 * ============================================================
 */

const Progress = require("../models/Progress");
const Vulnerability = require("../models/Vulnerability");
const { successResponse } = require("../utils/ApiResponse");
const AppError = require("../middleware/AppError");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * GET /api/progress/:learnerId
 * The learner's dashboard: what they finished, per year and in total.
 */
exports.getProgress = asyncHandler(async (req, res) => {
  const { learnerId } = req.params;
  if (!learnerId.trim()) throw AppError.badRequest("learnerId cannot be empty.");

  // `findOne(...).lean()` returns a plain object (or null) - faster
  // than a full mongoose document when we only read.
  const progress = await Progress.findOne({ learnerId }).lean();

  // A brand new learner has no document yet. That is NOT an error -
  // return an empty dashboard so the frontend needs no special case.
  if (!progress) {
    return res.json(
      successResponse(
        { learnerId, name: "Learner", activities: [], stats: emptyStats() },
        "No progress recorded yet."
      )
    );
  }

  // Join with the vulnerability collection to show real titles instead
  // of raw slugs. This is a manual "join" done in JavaScript.
  const slugs = progress.activities.map((a) => a.ref);
  const docs = await Vulnerability.find({ slug: { $in: slugs } })
    .select("slug title owaspId year rank")
    .lean();
  const bySlug = Object.fromEntries(docs.map((d) => [d.slug, d]));

  res.json(
    successResponse(
      {
        ...progress,
        // Replace each bare ref with a readable object.
        activities: progress.activities.map((a) => ({
          ...a,
          title: bySlug[a.ref]?.title ?? a.ref,
          owaspId: bySlug[a.ref]?.owaspId ?? null,
          rank: bySlug[a.ref]?.rank ?? null,
        })),
        stats: await buildStats(progress, docs),
      },
      `Progress for ${progress.name}`
    )
  );
});

/**
 * POST /api/progress/:learnerId/complete
 * Body: { "kind": "vulnerability" | "lab" | "release", "ref": "2021-a03-injection",
 *         "year": 2021, "name": "Asha" }
 *
 * Marking the same thing twice is harmless - markComplete() in the
 * model ignores duplicates, so the button can be spammed safely.
 */
exports.markComplete = asyncHandler(async (req, res) => {
  const { learnerId } = req.params;
  const { kind, ref, year, name, score } = req.body || {};

  if (!kind || !ref) {
    throw AppError.badRequest('Send "kind" and "ref", e.g. { "kind": "lab", "ref": "2021-a03-injection" }.');
  }
  if (!["vulnerability", "quiz", "lab", "release"].includes(kind)) {
    throw AppError.badRequest(`Unknown kind "${kind}". Use vulnerability | quiz | lab | release.`);
  }
  // Never trust a ref that points nowhere - confirm the vulnerability exists.
  if (kind !== "release") {
    const exists = await Vulnerability.exists({ slug: ref });
    if (!exists) throw AppError.notFound(`No vulnerability has the slug "${ref}".`);
  }

  // findOneAndUpdate with upsert gives us "find the learner's document
  // or create it, then set this field" in one atomic database call.
  const progress =
    (await Progress.findOne({ learnerId })) || new Progress({ learnerId, name: name || "Learner" });

  if (name) progress.name = name;
  const { added } = progress.markComplete({
    kind,
    ref,
    year: year ? Number(year) : undefined,
    score: typeof score === "number" ? score : undefined,
  });

  await progress.save();

  res.json(
    successResponse(
      { learnerId: progress.learnerId, added, activities: progress.activities },
      added
        ? "Marked as complete. Nice work!"
        : "Already completed - your best score was kept."
    )
  );
});

/**
 * GET /api/progress/:learnerId/stats
 * A compact summary the React Home page can render as a ring/bar.
 */
exports.getStats = asyncHandler(async (req, res) => {
  const progress = await Progress.findOne({ learnerId: req.params.learnerId }).lean();
  if (!progress) return res.json(successResponse(emptyStats(), "Nothing completed yet."));

  const docs = await Vulnerability.find({ slug: { $in: progress.activities.map((a) => a.ref) } })
    .select("year slug")
    .lean();

  res.json(successResponse(await buildStats(progress, docs), "Progress statistics"));
});

/**
 * DELETE /api/progress/:learnerId/reset
 * Wipes progress for a learner so they can redo the module.
 * Documented here so you can see a DELETE route with a real purpose.
 */
exports.reset = asyncHandler(async (req, res) => {
  const result = await Progress.deleteOne({ learnerId: req.params.learnerId });
  res.json(
    successResponse(
      { deleted: result.deletedCount },
      result.deletedCount ? "Progress reset." : "Nothing to reset."
    )
  );
});

/* ----------------- private helpers (not routes) ----------------- */

function emptyStats() {
  return {
    vulnerabilitiesCompleted: 0,
    quizzesCompleted: 0,
    labsCompleted: 0,
    yearsTouched: 0,
    averageQuizScore: 0,
    percentOfCatalogue: 0,
  };
}

/**
 * Turns a progress document into friendly numbers.
 * `totalCatalogue` is the number of vulnerability documents (80), so
 * `percentOfCatalogue` shows how much of the history module is done.
 *
 * Marked `async` because it needs one extra database read (the size of
 * the whole catalogue). `await` inside is fine because the caller
 * already lives in an async function.
 */
async function buildStats(progress, docs) {
  const acts = progress.activities || [];
  const vulnerabilitiesCompleted = new Set(
    acts.filter((a) => a.kind === "vulnerability").map((a) => a.ref)
  ).size;
  const labsCompleted = new Set(
    acts.filter((a) => a.kind === "lab").map((a) => a.ref)
  ).size;
  const quizActs = acts.filter((a) => a.kind === "quiz" && typeof a.score === "number");

  // Mean of the scores, rounded. An empty list must not divide by 0.
  const averageQuizScore = quizActs.length
    ? Math.round(quizActs.reduce((sum, a) => sum + a.score, 0) / quizActs.length)
    : 0;

  const totalCatalogue = await Vulnerability.countDocuments();

  return {
    vulnerabilitiesCompleted,
    quizzesCompleted: quizActs.length,
    labsCompleted,
    yearsTouched: new Set(acts.map((a) => a.year).filter(Boolean)).size,
    averageQuizScore,
    percentOfCatalogue: totalCatalogue
      ? Math.round((vulnerabilitiesCompleted / totalCatalogue) * 100)
      : 0,
    totalCatalogue,
  };
}
