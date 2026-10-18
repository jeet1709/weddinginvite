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

// Skip OS clutter if it's ever present locally.
const EXCLUDE = new Set(['.DS_Store']);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (EXCLUDE.has(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

fs.rmSync(DIST, { recursive: true, force: true });
copyDir(path.join(ROOT, 'public'), DIST);
copyDir(path.join(ROOT, 'config'), path.join(DIST, 'config'));

console.log(`Built static site to ${path.relative(ROOT, DIST)}/`);
console.log('Deploy this folder with any static host (GitHub Pages does it automatically on push).');
