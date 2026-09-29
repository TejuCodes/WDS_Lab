import { getManifest } from "./manifest";

/**
 * ============================================================
 * PER-FAMILY MODULE LOADER
 * ------------------------------------------------------------
 * A module page needs exactly one lesson. This file fetches only the
 * family that lesson lives in, so opening SQL injection does not
 * download the GraphQL lesson, the JWT lesson, or any of the other
 * twenty-three.
 *
 * The static import map is deliberate: a computed
 * import(`./${id}.js`) would make the bundler emit a glob of every
 * possible path and quietly give the saving back. Written out, the
 * bundler can see five separate chunks.
 *
 * The family id is read from the generated manifest, not guessed
 * from the key, so a module that is moved between families needs no
 * change here.
 * ============================================================ */

const LOADERS = {
  injection: () => import("./injection").then((m) => m.injectionModules),
  identity: () => import("./identity").then((m) => m.identityModules),
  "data-secrets": () => import("./data-secrets").then((m) => m.dataSecretsModules),
  browser: () => import("./browser").then((m) => m.browserModules),
  platform: () => import("./platform").then((m) => m.platformModules),
};

/** Families already fetched, so moving between siblings costs nothing. */
const cache = new Map();

function loadFamily(id) {
  if (!cache.has(id)) {
    const load = LOADERS[id];
    if (!load) return Promise.resolve([]);
    cache.set(id, load());
  }
  return cache.get(id);
}

/**
 * Resolve a module key to its full lesson.
 * @returns {Promise<object|null>} null when the key is not in the
 *   manifest, so the caller can render its own not-found state.
 */
export async function loadModule(key) {
  const entry = getManifest(key);
  if (!entry) return null;
  const modules = await loadFamily(entry.family);
  return modules.find((m) => m.key === key) ?? null;
}

/** Test seam: drops the memo so a loader failure cannot stick. */
export const __resetModuleCache = () => cache.clear();
