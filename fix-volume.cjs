const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Widen volume range significantly
src = src.replace("-60,           // volumeFilterMin dB", "-80,           // volumeFilterMin dB");
src = src.replace("-10,           // volumeFilterMax dB", "0,             // volumeFilterMax dB");

// Lower threshold - was blocking dots
src = src.replace("180,           // volumeThreshold", "150,           // volumeThreshold");

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed volume range");
