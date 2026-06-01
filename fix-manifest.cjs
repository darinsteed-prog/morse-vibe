const fs = require("fs");
const file = "android/app/src/main/AndroidManifest.xml";
let src = fs.readFileSync(file, "utf8");

if(!src.includes("RECORD_AUDIO")) {
  src = src.replace(
    '<uses-permission android:name="android.permission.INTERNET" />',
    `<uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />`
  );
  fs.writeFileSync(file, src, "utf8");
  console.log("✔ Added microphone permissions");
} else {
  console.log("ℹ RECORD_AUDIO already present");
}
