const fs = require("fs");
const file = "android/app/src/main/AndroidManifest.xml";
let src = fs.readFileSync(file, "utf8");

if (!src.includes("BILLING")) {
  src = src.replace(
    `<uses-permission android:name="android.permission.INTERNET" />`,
    `<uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="com.android.vending.BILLING" />`
  );
  fs.writeFileSync(file, src, "utf8");
  console.log("✔ Added billing permission");
} else {
  console.log("ℹ Already has billing permission");
}
