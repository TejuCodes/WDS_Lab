import { FAMILIES } from "../src/data/modules/families";
import { injectionModules } from "../src/data/modules/injection";
import { identityModules } from "../src/data/modules/identity";
import { dataSecretsModules } from "../src/data/modules/data-secrets";
import { browserModules } from "../src/data/modules/browser";
import { platformModules } from "../src/data/modules/platform";

/**
 * ============================================================
 * MANIFEST SOURCE  -  the pure half of the generator
 * ------------------------------------------------------------
 * Derives manifest.js from the five family files. No file writing
 * and no side effects, so both the generator and the drift check in
 * scripts/smoke-routes.jsx can import it and get the same answer.
 *
 * WHY THE SPLIT EXISTS
 * The five family files are the single source of truth. They are
 * 264 kB of lesson prose, and the sidebar, the home page and the
 * catalogue index are all on the first paint while displaying almost
 * none of it. A manifest entry keeps the handful of small fields those
 * screens render, plus one pre-lowercased search string built from
 * exactly the field list ModulesPage used to fold together in the
 * browser - so search results do not change because the catalogue got
 * lighter.
 * ============================================================ */

const BY_FAMILY = {
  injection: injectionModules,
  identity: identityModules,
  "data-secrets": dataSecretsModules,
  browser: browserModules,
  platform: platformModules,
};

/**
 * The exact haystack ModulesPage searched before the split, folded
 * down to one lowercase string. Keeping the field list identical is
 * the point: the deep fields (impact bullets, every reference id)
 * must stay searchable.
 */
export const searchTextFor = (m) =>
  [m.title, m.tagline, m.cwe.id, m.cwe.name, m.family, ...m.explain.impact, ...m.refs.map((r) => `${r.src} ${r.id}`)]
    .join(" ")
    .toLowerCase();

export const manifestEntryFor = (m) => ({
  key: m.key,
  title: m.title,
  family: m.family,
  icon: m.icon,
  severity: m.severity,
  tagline: m.tagline,
  historyCount: m.history.length,
  refCount: m.refs.length,
  cwe: m.cwe.id,
  search: searchTextFor(m),
});

/** The manifest as plain data. */
export function buildManifest() {
  return FAMILIES.map((f) => {
    const modules = BY_FAMILY[f.id];
    if (!modules) throw new Error(`family "${f.id}" has no module file`);
    return { ...f, modules: modules.map(manifestEntryFor) };
  });
}

const j = (value) => JSON.stringify(value);

/** The exact text manifest.js should contain. */
export function renderManifest() {
  const families = buildManifest();
  const count = families.reduce((n, f) => n + f.modules.length, 0);

  const body = families
    .map(
      (f) => `  {
    id: ${j(f.id)},
    label: ${j(f.label)},
    blurb: ${j(f.blurb)},
    modules: [
${f.modules.map((m) => `      {
        key: ${j(m.key)},
        title: ${j(m.title)},
        family: ${j(m.family)},
        icon: ${j(m.icon)},
        severity: ${j(m.severity)},
        tagline: ${j(m.tagline)},
        historyCount: ${m.historyCount},
        refCount: ${m.refCount},
        cwe: ${j(m.cwe)},
        search: ${j(m.search)},
      },`).join("\n")}
    ],
  },`,
    )
    .join("\n");

  return `/**
 * ============================================================
 * MODULE MANIFEST  -  GENERATED, DO NOT EDIT
 * ------------------------------------------------------------
 * Written by scripts/build-manifest.mjs from the five family files.
 * Run \`npm run manifest\` after changing any module, and
 * \`npm run smoke\` to prove this file still matches its source.
 *
 * This is the light half of the catalogue. It carries what the
 * sidebar, the home page and the catalogue index need - and the
 * pre-lowercased search string, so search still reaches into the
 * impact bullets and the reference ids - without the lesson prose. A
 * module page loads its own family on demand.
 * ============================================================ */

export const MANIFEST_FAMILIES = [
${body}
];

/** Every module, in family order. */
export const MANIFEST = MANIFEST_FAMILIES.flatMap((f) => f.modules);

export const MODULE_COUNT = ${count};

const BY_KEY = new Map(MANIFEST.map((m) => [m.key, m]));

export const getManifest = (key) => BY_KEY.get(key) ?? null;

export const getManifestFamily = (id) => MANIFEST_FAMILIES.find((f) => f.id === id) ?? null;

/** Search the catalogue. Field list mirrors \`searchTextFor\` exactly. */
export function searchManifest(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return MANIFEST.filter((m) => m.search.includes(q));
}

/** Severity order, worst first - used by the "worst first" sort. */
export const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export const bySeverity = (a, b) =>
  (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
`;
}
