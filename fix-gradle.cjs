const fs = require("fs");
const file = "android/app/build.gradle";
let src = fs.readFileSync(file, "utf8");

// Fix - remove signingConfig from inside signingConfigs block
src = src.replace(
  `    signingConfigs {
        release {
            signingConfig signingConfigs.release
            storeFile file("morse-vibe-release.jks")`,
  `    signingConfigs {
        release {
            storeFile file("morse-vibe-release.jks")`
);

// Add signingConfig to buildTypes release
src = src.replace(
  `        release {
            minifyEnabled false`,
  `        release {
            signingConfig signingConfigs.release
            minifyEnabled false`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed gradle signing config");
