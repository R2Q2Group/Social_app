const { withAppBuildGradle } = require("@expo/config-plugins");

// Injects the Play Store upload-key signing config into build.gradle so
// release builds are signed with the upload keystore rather than the debug
// keystore. Credentials are read from user-level ~/.gradle/gradle.properties
// (never from the repo) via four properties:
//   VIZIPHY_UPLOAD_STORE_FILE    — absolute path to the .jks file
//   VIZIPHY_UPLOAD_STORE_PASSWORD
//   VIZIPHY_UPLOAD_KEY_ALIAS
//   VIZIPHY_UPLOAD_KEY_PASSWORD
// Falls back to the debug keystore when those properties are absent so the
// dev workflow is unaffected on machines that don't have the upload key.
module.exports = function withReleaseSigningConfig(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Idempotency guard — don't apply twice.
    if (contents.includes("signingConfigs.upload")) {
      return config;
    }

    // 1. Add the upload signingConfig block right after the debug block.
    contents = contents.replace(
      `        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`,
      `        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        if (project.hasProperty('VIZIPHY_UPLOAD_STORE_FILE')) {
            upload {
                storeFile file(VIZIPHY_UPLOAD_STORE_FILE)
                storePassword VIZIPHY_UPLOAD_STORE_PASSWORD
                keyAlias VIZIPHY_UPLOAD_KEY_ALIAS
                keyPassword VIZIPHY_UPLOAD_KEY_PASSWORD
            }
        }
    }`
    );

    // 2. Change the release buildType to use the upload key when available.
    contents = contents.replace(
      `            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`,
      `            signingConfig project.hasProperty('VIZIPHY_UPLOAD_STORE_FILE') ? signingConfigs.upload : signingConfigs.debug`
    );

    config.modResults.contents = contents;
    return config;
  });
};
