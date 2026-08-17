const fs = require("fs");
const file = "android/app/build.gradle";
let src = fs.readFileSync(file, "utf8");
src = src.replace("versionCode 17", "versionCode 18");
src = src.replace('versionName "2.2"', 'versionName "2.3"');
fs.writeFileSync(file, src, "utf8");
console.log("✔ Version 18 (2.3)");
