const { withAndroidManifest } = require("@expo/config-plugins");

// Allows plain http:// requests (Android blocks these by default since
// API 28) so the app can reach a local-network Supabase instance during
// internal/sideload testing, e.g. http://192.168.x.x:54321 -- there's no
// real HTTPS backend yet outside local dev. Deliberately a plain manifest
// flag via a local plugin rather than the expo-build-properties package:
// installing that package pulled in dependency-version bumps that broke
// expo-dev-menu's release-variant Kotlin compile
// (`Unresolved reference: core`/`Manifest` in DevMenuManager.kt) on this
// project. Revisit before a real store release, which should point at a
// real HTTPS backend and not need this at all.
module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application) {
      application.$["android:usesCleartextTraffic"] = "true";
    }
    return config;
  });
};
