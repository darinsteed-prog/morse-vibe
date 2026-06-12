const fs = require("fs");
const file = "android/app/build.gradle";
let src = fs.readFileSync(file, "utf8");

if (!src.includes("billing")) {
  src = src.replace(
    `dependencies {`,
    `dependencies {
    implementation 'com.android.billingclient:billing:7.0.0'`
  );
  fs.writeFileSync(file, src, "utf8");
  console.log("✔ Added billing library");
} else {
  console.log("ℹ Already has billing library");
}
