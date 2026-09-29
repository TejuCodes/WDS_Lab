/**
 * ============================================================
 * FILE: src/models/OwaspRelease.js
 * MODEL: one OWASP Top 10 publication year.
 *
 * TEACHING NOTE - why a separate model for the YEAR?
 *   A release holds facts about the *edition* (2003, 2004, ... 2025):
 *   its headline summary, the official "what changed" notes, the list
 *   of the 10 category TITLES, and the source link. It does NOT hold
 *   the long teaching text for each category - that lives in the
 *   Vulnerability model. Splitting them like this is called
 *   "normalising", and it stops us repeating the same year summary
 *   10 times inside 10 vulnerability documents.
 * ============================================================
 */

const mongoose = require("mongoose");

/**
 * A single category title inside a release, e.g.
 *   { owaspId: "A01", rank: 1, title: "Broken Access Control" }
 *
 * TEACHING NOTE - sub-schemas
 *   `new mongoose.Schema({...})` without a model name creates a
 *   reusable *shape*. When you use it inside another schema it becomes
 *   an embedded sub-document: stored inside the parent document
 *   instead of getting its own collection.
 */
const CategorySchema = new mongoose.Schema(
  {
    // "A1" in the old editions, "A01" in the modern ones - so this is
    // a String, not a Number.
    owaspId: { type: String, required: true, trim: true },
    // Position 1..10 in that year's list. Used for sorting.
    rank: { type: Number, required: true, min: 1, max: 10 },
    title: { type: String, required: true, trim: true },
  },
  { _id: false } // no need for a separate _id on a tiny sub-document
);

const OwaspReleaseSchema = new mongoose.Schema(
  {
    // Unique index: the database itself refuses two documents with the
    // same year. `sparse` lets a doc exist even if year were missing.
    year: {
      type: Number,
      required: [true, "Release year is required"],
      unique: true,
      min: 2003,
      max: 2025,
    },

    // Display name, e.g. "OWASP Top 10 - 2021"
    title: { type: String, required: true, trim: true },

    // One-paragraph plain-English summary of that edition.
    summary: { type: String, required: true, trim: true },

    // True for the newest edition we ship (2025). The frontend can
    // use this to show a "latest release" badge.
    isLatest: { type: Boolean, default: false },

    // ---- The "What Changed?" section -----------------------------
    // Bullet points explaining how this edition differs from the
    // previous one. Empty array for 2003 (it is the first edition).
    changes: {
      type: [String],
      default: [],
    },

    // Category titles only (the details are in Vulnerability docs).
    categories: { type: [CategorySchema], default: [] },

    // Official reference so students can verify what they read.
    sourceUrl: { type: String, trim: true },
  },
  {
    // `timestamps` automatically adds createdAt / updatedAt.
    timestamps: true,
    // This makes the API responses use the `year` field as the id,
    // e.g. /api/owasp/releases/2021
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Virtual field: a handy API-friendly id string.
 * In MongoDB every document gets a random ObjectId such as
 * "665f1a...". For humans, "2021" is much nicer, so we add `slug`
 * without storing a second copy of the data.
 */
OwaspReleaseSchema.virtual("slug").get(function () {
  return String(this.year);
});

/**
 * TEACHING NOTE - what is a "static method" on a model?
 *   It is a helper attached to the model itself, like
 *   `OwaspRelease.getChronological()`. Controllers then read nicely
 *   instead of repeating the same `.find().sort()` chain.
 */
OwaspReleaseSchema.statics.getChronological = function () {
  return this.find({}).sort({ year: 1 }); // 1 = ascending (2003 -> 2025)
};

OwaspReleaseSchema.statics.getLatest = function () {
  return this.findOne({ isLatest: true });
};

/**
 * `mongoose.model(name, schema)` turns the schema into a usable model.
 * Model names are singular + capitalised by convention: "OwaspRelease".
 */
module.exports = mongoose.model("OwaspRelease", OwaspReleaseSchema);
