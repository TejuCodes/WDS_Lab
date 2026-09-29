/**
 * ============================================================
 * FILE: src/models/Progress.js
 * MODEL: tracks what a learner has completed.
 *
 * TEACHING NOTE - why store progress server side?
 *   Because the learning flow ends with "Mark Complete". If progress
 *   only lived in the browser (localStorage) it would be lost when the
 *   student changes device, and the teacher could not report who has
 *   finished a module. So each completion is a small document here.
 *
 *   NOTE FOR THE CLASS: a real platform adds authentication and puts
 *   `userId` on this schema. For this project we key the document on
 *   a `learnerId` string that the frontend generates and stores, so
 *   the feature works end-to-end before login exists.
 * ============================================================
 */

const mongoose = require("mongoose");

/** One finished activity: a reading, a quiz or a lab. */
const ActivitySchema = new mongoose.Schema(
  {
    // "vulnerability" | "quiz" | "lab" | "release"
    kind: {
      type: String,
      enum: ["vulnerability", "quiz", "lab", "release"],
      required: true,
    },
    // Slug of the thing completed, e.g. "2021-a03-injection".
    ref: { type: String, required: true },
    year: { type: Number },
    // Quiz score 0-100. Only used when kind === "quiz".
    score: { type: Number, min: 0, max: 100 },
    completedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ProgressSchema = new mongoose.Schema(
  {
    // Free-form id for now; later this becomes the authenticated user id.
    learnerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    name: { type: String, trim: true, default: "Learner" },

    activities: { type: [ActivitySchema], default: [] },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/** How many OWASP years this learner has finished reading (all 10 of a year). */
ProgressSchema.virtual("yearsCompleted").get(function () {
  const byYear = new Set(
    this.activities.filter((a) => a.kind === "vulnerability").map((a) => a.year)
  );
  return [...byYear].filter(Boolean).sort();
});

/** Virtual: total number of completed activities. */
ProgressSchema.virtual("completedCount").get(function () {
  return this.activities.length;
});

/**
 * Adds an activity, but never twice.
 * We check first instead of relying on a unique index because the
 * unique key would have to span an array element, which requires a
 * compound index on a sub-document path. Doing it in code is clearer
 * for beginners and the data volume here is tiny.
 */
ProgressSchema.methods.markComplete = function (entry) {
  const already = this.activities.some(
    (a) => a.kind === entry.kind && a.ref === entry.ref
  );
  if (already) {
    // Re-answering a quiz should still update the best score.
    if (entry.kind === "quiz" && typeof entry.score === "number") {
      const found = this.activities.find((a) => a.kind === entry.kind && a.ref === entry.ref);
      found.score = Math.max(found.score ?? 0, entry.score);
      found.completedAt = new Date();
    }
    return { added: false, progress: this };
  }
  this.activities.push(entry);
  return { added: true, progress: this };
};

module.exports = mongoose.model("Progress", ProgressSchema);
