#!/usr/bin/env node
// Mirrors packages/ai-core/src into supabase/functions/_shared/ai-core.
//
// Local Edge Function containers (`supabase start` / `functions serve`) bind
// mount only supabase/functions -- nothing outside that tree, including
// sibling workspace packages, is visible inside the container. Edge
// Functions that need @r2q2/ai-core import this generated mirror instead of
// the package directly. packages/ai-core/src remains the single source of
// truth; run this (via `npm run dev` / `npm run deploy`, which do it
// automatically) whenever ai-core changes.
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "..", "ai-core", "src");
const DEST = path.join(
  __dirname,
  "..",
  "supabase",
  "functions",
  "_shared",
  "ai-core",
);

fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

for (const entry of fs.readdirSync(SRC)) {
  if (!entry.endsWith(".ts")) continue;
  fs.copyFileSync(path.join(SRC, entry), path.join(DEST, entry));
}

console.log(`Synced ${SRC} -> ${DEST}`);
