import { renderToString } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ALL_MODULES, FAMILIES, getModule } from "../src/data/modules/index";
import { MANIFEST, MANIFEST_FAMILIES, MODULE_COUNT, searchManifest } from "../src/data/modules/manifest";
import { manifestEntryFor, searchTextFor, renderManifest } from "./manifest-source";
import { getAttackPath, computeLayout } from "../src/lib/diagramLayout";
import Layout from "../src/components/layout/Layout";
import { ThemeProvider } from "../src/context/ThemeContext";
import HomePage from "../src/pages/HomePage";
import ModulesPage from "../src/pages/ModulesPage";
import ModulePage, { ModuleLesson } from "../src/pages/ModulePage";
import NotFoundPage from "../src/pages/NotFoundPage";
import ModuleIcon from "../src/components/module/ModuleIcon";
import { FaDatabase } from "react-icons/fa";

/**
 * ============================================================
 * RENDER SMOKE TEST
 * ------------------------------------------------------------
 * Renders every route to an HTML string with react-dom/server and
 * fails on the first throw. This is not a substitute for looking at
 * the app, but it is the cheap check that catches the failure mode
 * that is easiest to ship and hardest to notice by hand: a module
 * whose data shape does not match what its page expects, or an icon
 * name that does not exist, which renders as a blank space rather
 * than an error.
 *
 * Run with: npm run smoke
 * ============================================================ */

let failures = 0;
const fail = (msg, err) => {
  failures++;
  console.log(`  FAIL ${msg}`);
  if (err) console.log(`       ${err.message.split("\n")[0]}`);
};

const renderAt = (path, routePath, element) =>
  renderToString(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path={routePath} element={element} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );

console.log(`smoke: ${ALL_MODULES.length} modules across ${FAMILIES.length} families\n`);

// --- 0. the generated manifest has not drifted from its source ----
// manifest.js is committed and is what the first paint imports, so a
// module edited without re-running the generator would silently drop
// out of the sidebar and the catalogue. This is the check that makes
// the split safe to keep.
{
  const onDisk = readFileSync(resolve(process.cwd(), "src/data/modules/manifest.js"), "utf8");
  if (onDisk !== renderManifest())
    fail("src/data/modules/manifest.js is stale - run `npm run manifest`");

  if (MANIFEST.length !== ALL_MODULES.length)
    fail(`manifest has ${MANIFEST.length} modules, the catalogue has ${ALL_MODULES.length}`);
  if (MODULE_COUNT !== ALL_MODULES.length)
    fail(`MODULE_COUNT is ${MODULE_COUNT}, expected ${ALL_MODULES.length}`);
  if (MANIFEST_FAMILIES.length !== FAMILIES.length)
    fail(`manifest has ${MANIFEST_FAMILIES.length} families, expected ${FAMILIES.length}`);

  // every field the manifest claims must still be true
  for (const m of ALL_MODULES) {
    const entry = MANIFEST.find((x) => x.key === m.key);
    if (!entry) { fail(`${m.key}: missing from the manifest, so the sidebar cannot link to it`); continue; }
    const want = manifestEntryFor(m);
    for (const k of Object.keys(want))
      if (entry[k] !== want[k]) fail(`${m.key}: manifest field "${k}" is stale`);
    if (entry.search !== searchTextFor(m)) fail(`${m.key}: manifest search text is stale`);
  }

  // search must still find modules by their reference ids, which is
  // the part of the haystack that the light manifest has to preserve
  for (const [query, expectKey] of [
    ["cwe-89", "sql-injection"],
    ["cwe-327", "crypto-weakness"],
    ["t1190", "sql-injection"],
    ["t1195.002", "deserialization"],
    ["rfc 6454", "cors"],
    ["rfc 9110", "clickjacking"],
    ["html5 security cheat sheet", "client-storage"],
  ]) {
    const hits = searchManifest(query) ?? [];
    if (!hits.some((h) => h.key === expectKey))
      fail(`searching "${query}" no longer finds ${expectKey} (got ${hits.map((h) => h.key).join(", ") || "nothing"})`);
  }
  if (searchManifest("") !== null) fail('an empty query should return null, not a match-all list');
}

// --- 1. every module lesson renders, and shows its own title -------
// ModuleLesson is rendered directly: the route component fetches the
// module in an effect, which server rendering never runs, so going
// through the route would only ever exercise the loading state.
for (const m of ALL_MODULES) {
  let html = "";
  try {
    html = renderToString(
      <ThemeProvider>
        <MemoryRouter>
          <ModuleLesson module={m} crossLink={null} evolution={null} linkError={null} />
        </MemoryRouter>
      </ThemeProvider>,
    );
  } catch (e) {
    fail(`${m.key}: ModuleLesson threw`, e);
    continue;
  }
  const title = m.title.replace(/&/g, "&amp;");
  if (!html.includes(title.slice(0, 18))) fail(`${m.key}: title "${title}" is not in the output`);
  if (html.length < 5000) fail(`${m.key}: output is only ${html.length} chars, suspiciously short`);
  if (!html.includes("dia__svg")) fail(`${m.key}: the attack diagram did not render`);
  if (!html.includes("pz__")) fail(`${m.key}: no puzzle rendered`);
  if (!html.includes("hist__")) fail(`${m.key}: no history rendered`);
}

// --- 1b. the route component renders every key without throwing ----
for (const m of ALL_MODULES) {
  try {
    const html = renderAt(`/modules/${m.key}`, "/modules/:moduleKey", <ModulePage />);
    if (html.includes("Module not found"))
      fail(`${m.key}: the route reported the module missing even though the manifest has it`);
    if (!html.includes("aria-busy"))
      fail(`${m.key}: the route did not show its loading state for an unfetched lesson`);
  } catch (e) {
    fail(`${m.key}: the route component threw`, e);
  }
}
// a key that does not exist must land on not-found, not on a crash
{
  const html = renderAt("/modules/not-a-real-module", "/modules/:moduleKey", <ModulePage />);
  if (!html.includes("Module not found")) fail("an unknown key did not render the not-found state");
}

// --- 2. the shared pages render -----------------------------------
for (const [label, path, route] of [
  ["home", "/", "/"],
  ["modules index", "/modules", "/modules"],
]) {
  try {
    const html =
      label === "home"
        ? renderToString(
            <ThemeProvider>
              <MemoryRouter initialEntries={["/"]}>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<HomePage />} />
                  </Route>
                </Routes>
              </MemoryRouter>
            </ThemeProvider>,
          )
        : renderAt("/modules", "/modules", <ModulesPage />);
    if (html.length < 2000) fail(`${label}: output is only ${html.length} chars`);
  } catch (e) {
    fail(`${label} page threw`, e);
  }
}

// --- 3. every icon name in the catalogue actually exists -----------
const iconNames = new Set(ALL_MODULES.map((m) => m.icon));
for (const name of iconNames) {
  try {
    const html = renderToString(
      <ModuleIcon name={name} className="smoke-icon" />,
    );
    // an unresolved name renders the fallback, which has no <svg>
    if (!html.includes("<svg")) fail(`icon "${name}" did not resolve to a component`);
  } catch (e) {
    fail(`icon "${name}" threw`, e);
  }
}

// a known-good control, so a broken harness cannot look like a pass
try {
  const ok = renderToString(<ModuleIcon name="FaDatabase" />);
  if (!ok.includes("<svg")) fail("control icon FaDatabase did not resolve");
} catch (e) {
  fail("control icon threw", e);
}

// --- 4. the sidebar link for every module points at a real route ---
for (const m of ALL_MODULES) {
  if (getModule(m.key) !== m) fail(`${m.key}: getModule did not return the same object`);
  const path = getAttackPath(m);
  if (path.length < 4) fail(`${m.key}: attack path is ${path.length} steps`);
  const L = computeLayout(m);
  if (L.routes.length !== m.diagram.edges.length) fail(`${m.key}: edge/route count mismatch`);
}

console.log(`  ${iconNames.size} distinct icons, all resolved`);
console.log(failures ? `\n${failures} PROBLEMS` : "\nSMOKE: PASS");
process.exit(failures ? 1 : 0);
