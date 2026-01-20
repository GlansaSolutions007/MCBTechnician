const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAndroidManifestFix(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest.application) {
      return config;
    }

    const application = manifest.application[0];

    // Find or create the meta-data element for Firebase notification color
    let metaData = application["meta-data"] || [];
    
    // Ensure meta-data is an array
    if (!Array.isArray(metaData)) {
      metaData = [metaData];
    }

    // Find the Firebase messaging notification color meta-data
    const notificationColorIndex = metaData.findIndex(
      (item) =>
        item.$ &&
        item.$["android:name"] ===
          "com.google.firebase.messaging.default_notification_color"
    );

    if (notificationColorIndex !== -1) {
      // Add tools:replace attribute to override the library's value
      if (!metaData[notificationColorIndex].$) {
        metaData[notificationColorIndex].$ = {};
      }
      metaData[notificationColorIndex].$["tools:replace"] = "android:resource";
      // Ensure the resource value is set
      if (!metaData[notificationColorIndex].$["android:resource"]) {
        metaData[notificationColorIndex].$["android:resource"] = "@color/notification_icon_color";
      }
    } else {
      // If it doesn't exist, add it with tools:replace
      metaData.push({
        $: {
          "android:name":
            "com.google.firebase.messaging.default_notification_color",
          "android:resource": "@color/notification_icon_color",
          "tools:replace": "android:resource",
        },
      });
    }

    // Ensure tools namespace is declared in manifest
    if (!manifest.$) {
      manifest.$ = {};
    }
    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    application["meta-data"] = metaData;

    return config;
  });
};

