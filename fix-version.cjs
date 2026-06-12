const fs = require("fs");
const file = "android/app/build.gradle";
let src = fs.readFileSync(file, "utf8");
src = src.replace("versionCode 1", "versionCode 2");
src = src.replace('versionName "1.0"', 'versionName "1.1"');
fs.writeFileSync(file, src, "utf8");
console.log("✔ Version updated to 2 (1.1)");
