const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo's `orientation: "default"` maps to `screenOrientation="unspecified"` on Android, which on
 * most phones excludes the 180º-rotated portrait. `fullSensor` enables all four orientations.
 */
module.exports = function withFullSensorOrientation(config) {
  return withAndroidManifest(config, (modConfig) => {
    const application = modConfig.modResults.manifest.application?.[0];
    const mainActivity = application?.activity?.find(
      (activity) => activity.$?.['android:name'] === '.MainActivity',
    );

    if (mainActivity) {
      mainActivity.$['android:screenOrientation'] = 'fullSensor';
    }

    return modConfig;
  });
};
