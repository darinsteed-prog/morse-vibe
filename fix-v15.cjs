const fs = require("fs");
const file = "android/app/build.gradle";
let src = fs.readFileSync(file, "utf8");
src = src.replace("versionCode 14", "versionCode 15");
src = src.replace('versionName "1.9"', 'versionName "2.0"');
fs.writeFileSync(file, src, "utf8");
console.log("✔ Version 15 (2.0)");
