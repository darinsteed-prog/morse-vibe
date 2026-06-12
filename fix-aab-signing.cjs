const fs = require("fs");
const file = "android/app/build.gradle";
let src = fs.readFileSync(file, "utf8");

// Add release signing to buildTypes
if (!src.includes("signingConfig signingConfigs.release")) {
  src = src.replace(
    `release {`,
    `release {
            signingConfig signingConfigs.release`
  );
  fs.writeFileSync(file, src, "utf8");
  console.log("✔ Added signing to release build type");
} else {
  console.log("ℹ Already has signing config");
}
