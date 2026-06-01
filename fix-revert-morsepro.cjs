const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Revert to exact settings that gave HELLO EVERYON E
src = src.replace(/-80,\s+\/\/ volumeFilterMin dB/, "-60,           // volumeFilterMin dB");
src = src.replace(/0,\s+\/\/ volumeFilterMax dB/, "-10,           // volumeFilterMax dB");
src = src.replace(/150,\s+\/\/ volumeThreshold/, "200,           // volumeThreshold");
src = src.replace(/300,\s+\/\/ frequencyFilterMin Hz/, "400,           // frequencyFilterMin Hz");
src = src.replace(/1400,\s+\/\/ frequencyFilterMax Hz/, "1200,          // frequencyFilterMax Hz");
src = src.replace(/800,\s+\/\/ bufferDuration/, "500,           // bufferDuration");

fs.writeFileSync(file, src, "utf8");
console.log("✔ Reverted to HELLO EVERYON E settings");
