/**
 * ============================================================
 * FILE: src/seed/seed.js
 * PURPOSE: Load the OWASP history data into MongoDB.
 *
 * RUN IT WITH:   npm run seed
 *
 * WHAT IT DOES
 *   1. Connects to MongoDB.
 *   2. Deletes the old owasp collections so re-running is safe.
 *   3. Creates 8 release documents (one per year).
 *   4. Creates 80 vulnerability documents (8 years x 10 entries),
 *      each one merged from its year row + its concept profile.
 *   5. Prints a summary so you can see it worked.
 *
 * WHY A SEED SCRIPT?
 *   Typing 80 rich documents into MongoDB Compass by hand would take
 *   hours and would be impossible to review. A seed script is
 *   version-controlled data: you can see what changed, re-run it any
 *   time, and rebuild the database from scratch in seconds.
 * ============================================================
 */

require("dotenv").config();

const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const { RELEASES, YEARS, LATEST_YEAR, getPreviousYear } = require("../data/owaspReleases");
const { getProfile, CONCEPT_KEYS } = require("../data/vulnProfiles");
const OwaspRelease = require("../models/OwaspRelease");
const Vulnerability = require("../models/Vulnerability");

/** Only 2003, 2004, 2007, 2010, 2013, 2017, 2021 and 2025 are official. */
const OFFICIAL_YEARS = [2003, 2004, 2007, 2010, 2013, 2017, 2021, 2025];

/**
 * Builds the URL slug used by the frontend route.
 * "2021" + "A03" + "Injection" -> "2021-a03-injection"
 *
 * `.toLowerCase()` and `.replace()` normalise the text; a slug must
 * be safe to put in a URL, so spaces and punctuation are removed.
 */
function buildSlug(year, owaspId, title) {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${year}-${owaspId.toLowerCase()}-${cleanTitle}`;
}

/**
 * Step 1 - validate the data BEFORE touching the database.
 * Failing early is friendlier than inserting half a dataset.
 */
function validateSourceData() {
  const problems = [];

  if (YEARS.length !== OFFICIAL_YEARS.length ||
      !YEARS.every((y) => OFFICIAL_YEARS.includes(y))) {
    problems.push(
      `Years must be exactly [${OFFICIAL_YEARS.join(", ")}]. Found [${YEARS.join(", ")}]. ` +
      `Do not invent a release year - the latest official OWASP Top 10 is ${LATEST_YEAR}.`
    );
  }

  for (const release of RELEASES) {
    if (release.categories.length !== 10) {
      problems.push(`${release.year} has ${release.categories.length} categories, expected 10.`);
    }
    // Ranks must be exactly 1..10 with no duplicates.
    const ranks = release.categories.map((c) => c.rank).sort((a, b) => a - b);
    const expected = Array.from({ length: 10 }, (_, i) => i + 1);
    if (ranks.join(",") !== expected.join(",")) {
      problems.push(`${release.year} ranks are ${ranks.join(",")}, expected 1..10.`);
    }
    for (const category of release.categories) {
      if (!CONCEPT_KEYS.includes(category.conceptKey)) {
        problems.push(
          `${release.year} ${category.owaspId} "${category.title}" uses unknown conceptKey "${category.conceptKey}".`
        );
      }
    }
  }

  if (problems.length) {
    console.error("[seed] Source data has problems:");
    problems.forEach((p) => console.error("   - " + p));
    process.exit(1);
  }
  console.log(`[seed] Source data OK: ${RELEASES.length} releases, ${CONCEPT_KEYS.length} concept profiles.`);
}

/**
 * Step 2 - compute which concept keys already existed BEFORE a year.
 * That is how we know whether a category is genuinely new.
 */
function conceptsBefore(year) {
  const previous = getPreviousYear(year);
  if (!previous) return new Set();
  const previousRelease = RELEASES.find((r) => r.year === previous);
  return new Set(previousRelease.categories.map((c) => c.conceptKey));
}

/**
 * Step 3 - turn one (year, category) row into a full document.
 *
 * This is the important function in the whole project. It is the
 * merge point between:
 *   - the HISTORY data (which year, which id, is it new, why)
 *   - the CONCEPT PROFILE (the deep teaching content)
 */
function buildVulnerabilityDoc(release, category) {
  const profile = getProfile(category.conceptKey);   // throws if unknown
  const before = conceptsBefore(release.year);
  const genuinelyNew = !before.has(category.conceptKey);

  return {
    /* ---------- identity ---------- */
    year: release.year,
    owaspId: category.owaspId,
    rank: category.rank,
    title: category.title,
    slug: buildSlug(release.year, category.owaspId, category.title),
    conceptKey: category.conceptKey,

    /* ---------- history flags ---------- */
    // The 2003 edition introduces everything, so it is all "new".
    isNewInThisYear: getPreviousYear(release.year) === null ? true : genuinelyNew,
    isNewCategoryInThisYear: genuinelyNew,
    // A category is only "removed vs previous year" if it was
    // explicitly absorbed by another one (see replacedFrom).
    isRemovedVsPreviousYear: false,
    replacedFrom: category.replacedFrom || [],
    changeNote: category.changeNote || "",

    /* ---------- teaching content, copied from the profile ---------- */
    simpleExplanation: profile.simpleExplanation,
    whyItHappens: profile.whyItHappens,
    howItWorks: profile.howItWorks,
    safeExample: profile.safeExample,
    impact: profile.impact || [],
    typicalSeverity: profile.typicalSeverity || "high",

    vulnerableCode: profile.vulnerableCode
      ? {
          language: profile.vulnerableCode.language,
          filename: profile.vulnerableCode.filename,
          code: profile.vulnerableCode.code,
          walkthrough: profile.vulnerableCode.walkthrough || [],
        }
      : null,
    secureCode: profile.secureCode
      ? {
          language: profile.secureCode.language,
          filename: profile.secureCode.filename,
          code: profile.secureCode.code,
          explanation: profile.secureCode.explanation,
        }
      : null,

    prevention: profile.prevention || [],
    securePractices: profile.securePractices || [],
    furtherReading: profile.furtherReading || [],

    /* ---------- quiz and lab ---------- */
    quiz: (profile.quiz || []).map((q) => ({ ...q })),
    lab: profile.lab ? { ...profile.lab } : null,

    /* ---------- bookkeeping ---------- */
    sourceProfile: category.conceptKey,
  };
}

/**
 * Step 4 - build the "related" links automatically, so they are
 * never out of date:
 *
 *   a) same-year siblings listed in the profile's relatedConcepts
 *   b) the same idea in other years ("evolution")
 *
 * This runs AFTER all 80 documents are inserted, because it needs
 * to see the whole picture.
 */
function buildRelatedLinks(docs) {
  // Index every document by "year|conceptKey" for fast lookup.
  const byYearAndConcept = new Map();
  for (const doc of docs) {
    byYearAndConcept.set(`${doc.year}|${doc.conceptKey}`, doc);
  }

  for (const doc of docs) {
    const profile = getProfile(doc.conceptKey);
    const related = [];

    // (a) Same-year, related concepts.
    for (const conceptKey of profile.relatedConcepts || []) {
      const sibling = byYearAndConcept.get(`${doc.year}|${conceptKey}`);
      if (sibling) {
        related.push({
          year: sibling.year,
          owaspId: sibling.owaspId,
          title: sibling.title,
          slug: sibling.slug,
          relation: "same-year-related",
          note: `Related risk in the same edition: ${sibling.title}`,
        });
      }
    }

    // (b) The same idea in a different year - the "evolution" list.
    for (const other of docs) {
      if (other.conceptKey === doc.conceptKey && other.year !== doc.year) {
        related.push({
          year: other.year,
          owaspId: other.owaspId,
          title: other.title,
          slug: other.slug,
          relation: "evolution",
          note:
            other.year < doc.year
              ? `Earlier: listed as ${other.owaspId} ${other.title} in ${other.year}.`
              : `Later: listed as ${other.owaspId} ${other.title} in ${other.year}.`,
        });
      }
    }

    doc.related = related;
  }
}

/**
 * MAIN FUNCTION - does the actual work.
 */
async function seed() {
  try {
    // 0) Validate first.
    validateSourceData();

    // 1) Connect.
    await connectDB(process.env.MONGO_URI);

    // 2) Start from a clean slate. deleteMany({}) removes every
    //    document in the collection. This makes the script safe to
    //    run again after you change the data.
    console.log("[seed] Clearing existing collections...");
    await Promise.all([
      OwaspRelease.deleteMany({}),
      Vulnerability.deleteMany({}),
    ]);

    // 3) Insert the 8 releases.
    const releaseDocs = RELEASES.map((r) => ({
      year: r.year,
      title: r.title,
      summary: r.summary,
      isLatest: r.year === LATEST_YEAR,
      changes: r.changes,
      sourceUrl: r.sourceUrl,
      categories: r.categories.map((c) => ({
        owaspId: c.owaspId,
        rank: c.rank,
        title: c.title,
      })),
    }));
    const insertedReleases = await OwaspRelease.insertMany(releaseDocs);
    console.log(`[seed] Inserted ${insertedReleases.length} releases: ${YEARS.join(", ")}`);

    // 4) Build and insert the 80 vulnerabilities.
    const allDocs = [];
    for (const release of RELEASES) {
      for (const category of release.categories) {
        allDocs.push(buildVulnerabilityDoc(release, category));
      }
    }
    console.log(`[seed] Built ${allDocs.length} vulnerability documents.`);

    // 5) Wire up the related / evolution links, then save.
    buildRelatedLinks(allDocs);
    const insertedVulns = await Vulnerability.insertMany(allDocs);
    console.log(`[seed] Inserted ${insertedVulns.length} vulnerabilities.`);

    // 6) A readable summary, so you can eyeball the result.
    console.log("\n[seed] ---- OWASP Top 10 history loaded ----");
    for (const release of RELEASES) {
      const count = allDocs.filter((d) => d.year === release.year).length;
      const newOnes = allDocs
        .filter((d) => d.year === release.year && d.isNewCategoryInThisYear)
        .map((d) => d.owaspId);
      console.log(
        `  ${release.year}: ${count} entries` +
        (newOnes.length ? `  (new in this edition: ${newOnes.join(", ")})` : "")
      );
    }
    const totalNew = allDocs.filter((d) => d.isNewCategoryInThisYear).length;
    console.log(`\n[seed] Total: ${insertedReleases.length} releases, ${insertedVulns.length} vulnerabilities.`);
    console.log(`[seed] Concept keys used: ${new Set(allDocs.map((d) => d.conceptKey)).size} of ${CONCEPT_KEYS.length}.`);
    console.log(`[seed] Categories new across the whole history: ${totalNew}.`);
    console.log(`[seed] Latest official release stored: ${LATEST_YEAR}.`);

    // 7) Close the connection so the script can exit cleanly.
    await mongoose.connection.close();
    console.log("[seed] Done. Start the API with: npm run dev");
    process.exit(0);
  } catch (err) {
    console.error("[seed] Failed:", err);
    // 1 = an error happened. Scripts use this so a CI job notices.
    process.exit(1);
  }
}

// Only run when this file is executed directly (`node src/seed/seed.js`),
// not when it is imported by a test.
if (require.main === module) {
  seed();
}

module.exports = { seed, buildVulnerabilityDoc, buildSlug };
