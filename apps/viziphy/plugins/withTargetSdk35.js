const { withProjectBuildGradle } = require("@expo/config-plugins");

// expo prebuild's generated android/build.gradle defaults targetSdkVersion
// to 34 (compileSdkVersion/buildToolsVersion are already 35). Google Play
// requires new releases to target at least API 35, so this bumps just the
// target -- compile SDK and build tools were already high enough for this
// to be a same-toolchain change, not an SDK/dependency upgrade.
module.exports = function withTargetSdk35(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      config.modResults.contents = config.modResults.contents.replace(
        "targetSdkVersion = Integer.parseInt(findProperty('android.targetSdkVersion') ?: '34')",
        "targetSdkVersion = Integer.parseInt(findProperty('android.targetSdkVersion') ?: '35')",
      );
    }
    return config;
  });
};
