const fs = require("fs");
const file = "android/app/build.gradle";
let src = fs.readFileSync(file, "utf8");

if (!src.includes("signingConfigs")) {
  src = src.replace(
    "android {",
    `android {
    signingConfigs {
        release {
            storeFile file("morse-vibe-release.jks")
            storePassword project.hasProperty("STORE_PASSWORD") ? STORE_PASSWORD : ""
            keyAlias "morse-vibe"
            keyPassword project.hasProperty("KEY_PASSWORD") ? KEY_PASSWORD : ""
        }
    }`
  );
  fs.writeFileSync(file, src, "utf8");
  console.log("✔ Added signing config");
} else {
  console.log("ℹ Already has signing config");
}
