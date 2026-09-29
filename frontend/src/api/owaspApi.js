import client from "./client";

/**
 * ============================================================
 * API FUNCTIONS
 * ------------------------------------------------------------
 * One small named function per endpoint. Components never import
 * axios directly - they call these. That means a URL change is a
 * one-line fix in ONE file instead of a search across the project.
 * ============================================================
 */

/* ---------- OWASP releases and the timeline ---------- */

/** All 8 years with their 10 category titles, in one request. */
export const getTimeline = () => client.get("/owasp/timeline");

/** Quick counts for the dashboard. */
export const getStats = () => client.get("/owasp/stats");

/** One edition, with category summaries and history badges. */
export const getRelease = (year) => client.get(`/owasp/releases/${year}`);

/** The "What Changed?" data for an edition. */
export const getChanges = (year) => client.get(`/owasp/releases/${year}/changes`);

/* ---------- vulnerabilities ---------- */

/** The 10 categories of one year, in OWASP order. */
export const getByYear = (year) => client.get(`/vulnerabilities/year/${year}`);

/** Full detail page data, with quiz answers and lab solution hidden. */
export const getBySlug = (slug) => client.get(`/vulnerabilities/${slug}`);

/** Every edition that mentioned the same idea (the evolution view). */
export const getEvolution = (conceptKey) =>
  client.get(`/vulnerabilities/concept/${conceptKey}/evolution`);

/** The list of concept keys, for the "biggest themes" panel. */
export const getConcepts = () => client.get("/vulnerabilities/concepts");

/** Free text search. */
export const search = (q) => client.get("/vulnerabilities/search", { params: { q } });

/* ---------- quiz and lab ---------- */

/**
 * Grades a quiz attempt on the server.
 * @param {string} slug  e.g. "2021-a03-injection"
 * @param {number[]} answers the chosen option index per question
 * @param {string} learnerId so the score is saved to progress
 */
export const submitQuiz = (slug, answers, learnerId) =>
  client.post(`/vulnerabilities/${slug}/quiz`, { answers, learnerId });

/** The lab task and steps, without the model solution. */
export const getLab = (slug) => client.get(`/vulnerabilities/${slug}/lab`);

/** The model answer, fetched only when the learner asks for it. */
export const getLabSolution = (slug) => client.get(`/vulnerabilities/${slug}/lab/solution`);

/* ---------- progress ---------- */

export const getProgress = (learnerId) => client.get(`/progress/${learnerId}`);

export const markComplete = (learnerId, payload) =>
  client.post(`/progress/${learnerId}/complete`, payload);

export const resetProgress = (learnerId) => client.delete(`/progress/${learnerId}/reset`);
