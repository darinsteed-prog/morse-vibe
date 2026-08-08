const fs = require("fs");
const file = "android/app/build.gradle";
let src = fs.readFileSync(file, "utf8");
src = src.replace("versionCode 13", "versionCode 14");
src = src.replace('versionName "1.8"', 'versionName "1.9"');
fs.writeFileSync(file, src, "utf8");
console.log("✔ Version 14 (1.9)");
