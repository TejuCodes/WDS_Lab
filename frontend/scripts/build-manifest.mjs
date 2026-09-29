import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderManifest } from "./manifest-source";

/**
 * ============================================================
 * MANIFEST GENERATOR
 * ------------------------------------------------------------
 * Writes src/data/modules/manifest.js. The derivation itself lives
 * in ./manifest-source.mjs so that scripts/smoke-routes.jsx can check
 * the committed file for drift without this script's write side
 * effect running first and quietly fixing it.
 *
 * Run with: npm run manifest
 * ============================================================ */

const out = resolve(process.cwd(), "src/data/modules/manifest.js");
writeFileSync(out, renderManifest(), "utf8");
console.log(`wrote src/data/modules/manifest.js (${(renderManifest().length / 1024).toFixed(1)} kB)`);
