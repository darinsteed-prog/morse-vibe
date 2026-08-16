const fs = require("fs");
const file = "android/app/build.gradle";
let src = fs.readFileSync(file, "utf8");
src = src.replace("versionCode 15", "versionCode 16");
src = src.replace('versionName "2.0"', 'versionName "2.1"');
fs.writeFileSync(file, src, "utf8");
console.log("✔ Version 16 (2.1)");
