const fs = require("fs");
const file = "android/app/build.gradle";
let src = fs.readFileSync(file, "utf8");
src = src.replace("versionCode 4", "versionCode 5");
src = src.replace('versionName "1.3"', 'versionName "1.0"');
fs.writeFileSync(file, src, "utf8");
console.log("✔ Version 5 (1.0)");
