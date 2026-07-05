const fs = require("fs");
const file = "android/app/build.gradle";
let src = fs.readFileSync(file, "utf8");
src = src.replace("versionCode 5", "versionCode 6");
src = src.replace('versionName "1.0"', 'versionName "1.1"');
fs.writeFileSync(file, src, "utf8");
console.log("✔ Version 6 (1.1)");
