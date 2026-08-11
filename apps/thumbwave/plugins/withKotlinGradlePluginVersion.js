const { withProjectBuildGradle } = require("@expo/config-plugins");

// expo prebuild's generated android/build.gradle declares the Kotlin Gradle
// plugin classpath with no version pin, so Gradle resolves it independently
// of the `kotlinVersion` ext property the rest of the build (and Expo's own
// Compose-compiler version lookup) reads — on this project that resolved to
// a Kotlin version older than what expo-modules-core's Compose compiler
// requires, failing the build with a "Compose Compiler requires Kotlin X but
// you appear to be using Kotlin Y" error. Pin it to the same `kotlinVersion`
// so both stay in sync. (Same fix as apps/viziphy/plugins, Gate 2.)
module.exports = function withKotlinGradlePluginVersion(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      config.modResults.contents = config.modResults.contents.replace(
        "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')",
        'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:${kotlinVersion}")',
      );
    }
    return config;
  });
};
