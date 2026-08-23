#!/usr/bin/env node
// Assembles a self-contained static bundle in dist/ for deploying to any
// static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, ...).
// The dev server (server/index.js) serves public/ and config/ separately;
// a static host needs them merged into one tree, with config/ nested under
// the same root so the frontend's `fetch('/config/wedding.config.json')`
// still resolves.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Reference-only images: not linked from any config field, so they'd just
// bloat the deploy. Keep this list in sync with README's "design reference
// only" note if that ever changes.
const EXCLUDE_ASSETS = new Set(['HomepageBackground.jpg', 'Shiv-Parvati-Vivah.jpeg']);

function copyDir(src, dest, { exclude } = {}) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (exclude && exclude.has(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d, entry.name === 'assets' ? { exclude: EXCLUDE_ASSETS } : undefined);
    else fs.copyFileSync(s, d);
  }
}

fs.rmSync(DIST, { recursive: true, force: true });
copyDir(path.join(ROOT, 'public'), DIST);
copyDir(path.join(ROOT, 'config'), path.join(DIST, 'config'));

console.log(`Built static site to ${path.relative(ROOT, DIST)}/`);
console.log('Drag this folder to https://app.netlify.com/drop, or deploy it with any static host.');
