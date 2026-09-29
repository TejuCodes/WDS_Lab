/**
 * ============================================================
 * MODULE CATALOGUE
 * ------------------------------------------------------------
 * The HEAVY half of the catalogue. Importing this file pulls in all
 * 24 lessons in full - 264 kB of prose, diagrams and puzzles.
 *
 * That is the right thing for the tests, the audits and anything
 * that genuinely needs every lesson at once. It is the wrong thing
 * for the first paint, which is why the sidebar, the home page and
 * the catalogue index import ../modules/manifest instead, and a
 * single module page loads only its own family via loadModule.js.
 *
 * Family ids, labels and blurbs live in ./families so that the
 * generated manifest and this file cannot describe the same five
 * families two different ways.
 *
 * DERIVING THE ORDER PUZZLE
 * Each diagram is a small directed graph of nodes, and the
 * defence node is a branch off the attack line rather than part
 * of it. The order puzzle is therefore the longest attack-line
 * path through the graph: it is guaranteed to agree with the
 * flowchart the learner can see, and the author never has to
 * write the same list twice. A module may override it with an
 * explicit `orderSteps` array of node indexes.
 * ============================================================ */

import { FAMILIES as FAMILY_META } from "./families";
import { injectionModules } from "./injection";
import { identityModules } from "./identity";
import { dataSecretsModules } from "./data-secrets";
import { browserModules } from "./browser";
import { platformModules } from "./platform";
import { getAttackPath } from "../../lib/diagramLayout";

export { getAttackPath };

const MODULES_BY_FAMILY = {
  injection: injectionModules,
  identity: identityModules,
  "data-secrets": dataSecretsModules,
  browser: browserModules,
  platform: platformModules,
};

export const FAMILIES = FAMILY_META.map((f) => ({
  ...f,
  modules: MODULES_BY_FAMILY[f.id],
}));

/** Every module, in family order, in the order its family lists it. */
export const ALL_MODULES = FAMILIES.flatMap((f) => f.modules);

const BY_KEY = new Map(ALL_MODULES.map((m) => [m.key, m]));

export const getModule = (key) => BY_KEY.get(key) ?? null;

export const getFamily = (id) => FAMILIES.find((f) => f.id === id) ?? null;

export const getModulesByFamily = (id) => getFamily(id)?.modules ?? [];

// The formatters and the severity comparator live in light modules so
// that a single module page can use them without importing all 24
// lessons. Re-exported here, because the audits reach for this file.
export { refsBySource, extraRefs, hasOwaspLink } from "../../lib/moduleFormat";
export { SEVERITY_ORDER, bySeverity } from "./manifest";

import { extraRefs } from "../../lib/moduleFormat";


/**
 * Structural check used by the build-time test. Returns a list of
 * human-readable problems; an empty array means the catalogue is
 * sound. Not called at import time - the UI does not need it.
 */
export function validateCatalog(modules = ALL_MODULES) {
  const problems = [];
  const seen = new Set();
  const shapes = new Set();

  for (const m of modules) {
    const at = `module "${m.key ?? "<missing key>"}"`;
    for (const k of ["key", "title", "family", "icon", "severity", "tagline", "cwe", "explain", "history", "diagram"]) {
      if (!m[k]) problems.push(`${at}: missing "${k}"`);
    }
    if (seen.has(m.key)) problems.push(`${at}: duplicate key`);
    seen.add(m.key);

    if (!getFamily(m.family)) problems.push(`${at}: unknown family "${m.family}"`);

    if (!Array.isArray(m.refs) || m.refs.length < 4)
      problems.push(`${at}: needs at least 4 refs`);
    if (extraRefs(m).length === 0) problems.push(`${at}: needs a non-OWASP ref`);

    if (!Array.isArray(m.history) || m.history.length < 6)
      problems.push(`${at}: needs at least 6 history entries`);
    for (const h of m.history ?? [])
      if (typeof h.year !== "number" || !h.title || !h.text)
        problems.push(`${at}: bad history entry`);

    const nodes = m.diagram?.nodes ?? [];
    if (nodes.length < 6 || nodes.length > 8)
      problems.push(`${at}: diagram needs 6-8 nodes, has ${nodes.length}`);
    if (!nodes.some((n) => n.tone === "defence"))
      problems.push(`${at}: diagram has no defence node`);
    for (const e of m.diagram?.edges ?? []) {
      if (e.from < 0 || e.from >= nodes.length || e.to < 0 || e.to >= nodes.length)
        problems.push(`${at}: edge ${e.from}->${e.to} is out of range`);
    }
    if (getAttackPath(m).length < 3)
      problems.push(`${at}: attack path is too short to make a puzzle`);

    const p = m.puzzle;
    if (!p) continue;
    shapes.add(p.type === "headers" ? `headers-${p.mode}` : p.type);
    if (p.type === "spot") {
      if (!p.lines?.some((l) => l.vulnerable)) problems.push(`${at}: spot has no vulnerable line`);
    } else if (p.type === "payload") {
      if (!p.base?.includes("{slot}")) problems.push(`${at}: payload base lacks {slot}`);
      if (p.options?.length !== 4) problems.push(`${at}: payload needs 4 options`);
      if (typeof p.answer !== "number") problems.push(`${at}: payload needs an answer index`);
      for (const i of [0, 1, 2, 3]) if (!p.why?.[String(i)]) problems.push(`${at}: payload missing why[${i}]`);
    } else if (p.type === "headers") {
      if (p.mode === "pick") {
        if (p.options?.length !== 4) problems.push(`${at}: headers pick needs 4 options`);
        for (const i of [0, 1, 2, 3]) if (!p.why?.[String(i)]) problems.push(`${at}: headers pick missing why[${i}]`);
      } else if (p.mode === "sort") {
        const n = p.items?.length ?? 0;
        if (!n) problems.push(`${at}: headers sort has no items`);
        const ord = p.order ?? [];
        if (new Set(ord).size !== n || ord.length !== n)
          problems.push(`${at}: headers sort order is not a full permutation`);
      } else {
        problems.push(`${at}: unknown headers mode "${p.mode}"`);
      }
    } else {
      problems.push(`${at}: unknown puzzle type "${p.type}"`);
    }
  }

  for (const want of ["spot", "payload", "headers-pick", "headers-sort"])
    if (!shapes.has(want)) problems.push(`catalogue: no module uses the "${want}" puzzle`);

  return problems;
}

export default ALL_MODULES;
