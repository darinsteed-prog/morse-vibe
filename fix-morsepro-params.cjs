const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Fix the three critical parameters based on morsecode.world defaults
// volumeFilterMin: -60 to -40 dB (author uses -40 as default)
// volumeFilterMax: -10 to 0 dB (author uses -5 as default)  
// volumeThreshold: 100-200 (author uses 100 as default, lower = more sensitive)
src = src.replace(
  `        -70,    // volumeFilterMin dB
        0,      // volumeFilterMax dB - accept any volume
        400,    // frequencyFilterMin Hz
        1200,   // frequencyFilterMax Hz
        180,    // volumeThreshold (0-255) - lower = more sensitive`,
  `        -40,    // volumeFilterMin dB (discard very quiet sounds)
        -5,     // volumeFilterMax dB (discard very loud sounds)
        400,    // frequencyFilterMin Hz
        1200,   // frequencyFilterMax Hz
        100,    // volumeThreshold (0-255) - 100 is author default`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed morse-pro parameters to match author defaults");
