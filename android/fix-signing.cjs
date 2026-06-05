const fs = require("fs");
const file = "app/build.gradle";
let src = fs.readFileSync(file, "utf8");

// Add signing config
if (!src.includes("signingConfigs")) {
  src = src.replace(
    "android {",
    `android {
    signingConfigs {
        release {
            storeFile file("morse-vibe-release.jks")
            storePassword System.getenv("STORE_PASSWORD") ?: ""
            keyAlias "morse-vibe"
            keyPassword System.getenv("KEY_PASSWORD") ?: ""
        }
    }`
  );
  src = src.replace(
    "buildTypes {",
    `buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }`
  );
  fs.writeFileSync(file, src, "utf8");
  console.log("✔ Added signing config");
}
