const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Workspace packages (@r2q2/ai-core, @r2q2/design-tokens) live outside
// apps/viziphy and are consumed as raw TS source, not a built package —
// Metro needs to watch and resolve them from outside its project root.
// Watch only those two source dirs (not the whole monorepo root) so Metro
// doesn't also crawl the ~1000-package root node_modules as project source.
config.watchFolders = [
  path.resolve(monorepoRoot, "packages/ai-core"),
  path.resolve(monorepoRoot, "packages/design-tokens"),
];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
