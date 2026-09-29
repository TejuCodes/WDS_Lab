/**
 * ============================================================
 * MODULE FORMATTERS
 * ------------------------------------------------------------
 * Small pure functions over a single module object. They are grouped
 * here, away from data/modules/index.js, because index.js imports all
 * 24 lessons and a page that only wants to group one module's
 * references should not pull in the other twenty-three.
 *
 * index.js re-exports these, so the audits can keep importing them
 * from the one obvious place.
 * ============================================================ */

/**
 * Refs grouped by source family, so the page can render one block
 * per framework instead of a flat undifferentiated list.
 */
export function refsBySource(module) {
  const groups = new Map();
  for (const ref of module.refs ?? []) {
    if (!groups.has(ref.src)) groups.set(ref.src, []);
    groups.get(ref.src).push(ref.id);
  }
  return [...groups.entries()].map(([src, ids]) => ({ src, ids }));
}

/** Non-OWASP references, used by the "beyond the Top 10" callout. */
export const extraRefs = (module) =>
  (module.refs ?? []).filter((r) => !/^owasp/i.test(r.src));

/** The optional cross-link into the OWASP history dataset. */
export const hasOwaspLink = (module) => Boolean(module.owaspConceptKey);
