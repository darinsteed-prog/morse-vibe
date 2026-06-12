const fs = require("fs");
const file = "android/app/build.gradle";
let src = fs.readFileSync(file, "utf8");
src = src.replace("versionCode 3", "versionCode 4");
src = src.replace('versionName "1.2"', 'versionName "1.3"');
fs.writeFileSync(file, src, "utf8");
console.log("✔ Version 4 (1.3)");
