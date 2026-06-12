const fs = require("fs");
const file = "android/app/build.gradle";
let src = fs.readFileSync(file, "utf8");
src = src.replace("versionCode 2", "versionCode 3");
src = src.replace('versionName "1.1"', 'versionName "1.2"');
fs.writeFileSync(file, src, "utf8");
console.log("✔ Version updated to 3 (1.2)");
