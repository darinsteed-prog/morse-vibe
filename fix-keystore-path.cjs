const fs = require("fs");
const file = "android/app/build.gradle";
let src = fs.readFileSync(file, "utf8");
src = src.replace(
  `storeFile file("morse-vibe-release.jks")`,
  `storeFile file("../morse-vibe-release.jks")`
);
fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed keystore path");
