const fs = require("fs");
const file = "src/components/FlashMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Replace hardcoded dotLen with wpm-based calculation
src = src.replace(
  "            const dotLen = 120;",
  "            const dotLen = 1200 / wpm;"
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed dotLen to use WPM");

// Verify
const check = fs.readFileSync(file, "utf8");
const idx = check.indexOf("dotLen");
console.log("Context:", check.substring(idx-20, idx+50));
