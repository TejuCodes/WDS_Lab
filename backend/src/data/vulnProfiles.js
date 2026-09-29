/**
 * ============================================================
 * FILE: src/data/vulnProfiles.js
 * PURPOSE: Merges every concept profile into one lookup object.
 *
 * `PROFILES["xss"]` returns the full teaching content for the XSS
 * concept, no matter which year (2003 A4, 2007 A1, 2010 A2, 2013 A3,
 * 2017 A7, 2021 A03, 2025 A05) referred to it.
 *
 * WHY SPLIT INTO THREE FILES?
 *   A single 2500-line data file is impossible to review. Three
 *   themed files (attacks, access/auth, data) can each be read on
 *   their own, and a reviewer can be asked to check only the one
 *   they know. The merge here means the rest of the app never has
 *   to care how many files there are.
 * ============================================================
 */

const attackFamily = require("./profiles/attack-family");
const accessAuthFamily = require("./profiles/access-auth-family");
const dataFamily = require("./profiles/data-family");

// The spread operator (...) copies the key/value pairs of each family
// into one flat object, so PROFILES.xss works regardless of which
// file it came from.
const PROFILES = {
  ...attackFamily,
  ...accessAuthFamily,
  ...dataFamily,
};

/** Every conceptKey, sorted - used by the seed script to validate data. */
const CONCEPT_KEYS = Object.keys(PROFILES).sort();

/**
 * Fetches a profile or fails loudly.
 * A missing profile during seeding would silently create a document
 * with empty teaching text, so we make it an explicit error instead.
 */
function getProfile(conceptKey) {
  const profile = PROFILES[conceptKey];
  if (!profile) {
    throw new Error(
      `No concept profile named "${conceptKey}". Known keys: ${CONCEPT_KEYS.join(", ")}`
    );
  }
  return profile;
}

/** A light list for the "biggest themes" panel on the History page. */
function listConcepts() {
  return CONCEPT_KEYS.map((key) => ({
    conceptKey: key,
    title: PROFILES[key].title,
    typicalSeverity: PROFILES[key].typicalSeverity,
    relatedConcepts: PROFILES[key].relatedConcepts || [],
    quizQuestions: (PROFILES[key].quiz || []).length,
    hasLab: Boolean(PROFILES[key].lab),
  }));
}

module.exports = { PROFILES, CONCEPT_KEYS, getProfile, listConcepts };
