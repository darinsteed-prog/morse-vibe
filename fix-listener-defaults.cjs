const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  `        -60,    // volumeFilterMin dB
        -10,    // volumeFilterMax dB
        400,    // frequencyFilterMin Hz
        1200,   // frequencyFilterMax Hz
        200,    // volumeThreshold (0-255)`,
  `        -60,    // volumeFilterMin dB
        -30,    // volumeFilterMax dB (library default)
        400,    // frequencyFilterMin Hz
        1200,   // frequencyFilterMax Hz
        220,    // volumeThreshold (library default)`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed to library defaults");
