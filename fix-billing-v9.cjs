const fs = require("fs");
const file = "android/app/build.gradle";
let src = fs.readFileSync(file, "utf8");
src = src.replace(
  "implementation 'com.android.billingclient:billing:7.1.1'",
  "implementation 'com.android.billingclient:billing:7.1.1'\n    implementation 'com.android.billingclient:billing:9.0.0'"
);
// Actually just replace 7.1.1 with 9.0.0
src = src.replace(
  "implementation 'com.android.billingclient:billing:7.1.1'\n    implementation 'com.android.billingclient:billing:9.0.0'",
  "implementation 'com.android.billingclient:billing:9.0.0'"
);
fs.writeFileSync(file, src, "utf8");
console.log("✔ Updated billing to 9.0.0");
