const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");
src = src.replace(
  `-40,    // volumeFilterMin dB (discard very quiet sounds)\n        -5,     // volumeFilterMax dB (discard very loud sounds)\n        400,    // frequencyFilterMin Hz\n        1200,   // frequencyFilterMax Hz\n        100,    // volumeThreshold (0-255) - 100 is author default`,
  `-60,    // volumeFilterMin dB\n        -10,    // volumeFilterMax dB\n        400,    // frequencyFilterMin Hz\n        1200,   // frequencyFilterMax Hz\n        200,    // volumeThreshold (0-255)`
);
fs.writeFileSync(file, src, "utf8");
console.log("✔ Reverted");
