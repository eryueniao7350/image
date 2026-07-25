/**
 * Post-build fixups for files copied verbatim out of public/.
 *
 * Vite rewrites asset URLs in index.html and supports the %BASE_URL% token
 * there, but everything under public/ is copied to dist/ untouched. When the
 * site is served from a subpath (GitHub Pages without a custom domain), those
 * files still point at the domain root and 404.
 *
 * Two things need patching:
 *   1. Root-absolute links in the hand-written static pages.
 *   2. `pathSegmentsToKeep` in the GitHub Pages SPA redirect shim, which must
 *      equal the number of path segments in BASE or every deep link redirects
 *      to the wrong place.
 *
 * No-op when BASE is empty (root deployment).
 *
 * Run: node scripts/fix-public-base.mjs   (after vite build)
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { BASE } from "./shared-utils.mjs";

const DIST = "dist";

/** Hand-written pages that live in public/ and are copied as-is. */
const STATIC_PAGES = [
  "about/index.html",
  "blog/index.html",
  "privacy/index.html",
  "terms/index.html",
];

/** Rewrite root-absolute href/src, leaving protocol-relative and absolute URLs alone. */
function prefixRootLinks(html) {
  return html.replace(/(href|src)="\/(?!\/)/g, `$1="${BASE}/`);
}

function main() {
  if (!existsSync(DIST)) {
    throw new Error(`${DIST}/ not found — run vite build first.`);
  }

  if (!BASE) {
    console.log("BASE is empty (root deployment) — nothing to rewrite.");
    return;
  }

  let patched = 0;

  for (const rel of STATIC_PAGES) {
    const path = join(DIST, rel);
    if (!existsSync(path)) {
      console.warn(`  skip (missing): ${rel}`);
      continue;
    }
    const before = readFileSync(path, "utf-8");
    const count = (before.match(/(href|src)="\/(?!\/)/g) || []).length;
    const after = prefixRootLinks(before);
    if (after !== before) {
      writeFileSync(path, after);
      patched++;
    }
    console.log(`  ${rel}: ${count} links prefixed`);
  }

  // GitHub Pages SPA shim: depth must match the number of segments in BASE.
  const depth = BASE.split("/").filter(Boolean).length;
  const shim = join(DIST, "404.html");
  if (existsSync(shim)) {
    const before = readFileSync(shim, "utf-8");
    const after = before.replace(
      /var pathSegmentsToKeep = \d+;[^\n]*/,
      `var pathSegmentsToKeep = ${depth}; // derived from SITE_URL (BASE="${BASE}")`,
    );
    if (after === before) {
      throw new Error(
        "404.html: could not find `var pathSegmentsToKeep = <n>;` — the SPA shim changed shape, " +
          "deep links would silently redirect to the wrong path.",
      );
    }
    writeFileSync(shim, after);
    patched++;
    console.log(`  404.html: pathSegmentsToKeep = ${depth}`);
  } else {
    console.warn("  skip (missing): 404.html");
  }

  console.log(`Public base fixups: ${patched} file(s) patched for BASE="${BASE}"`);
}

main();
