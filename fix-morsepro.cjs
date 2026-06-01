const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Lower volume threshold from 200 to 180 - catches weaker signals better
src = src.replace("200,           // volumeThreshold", "180,           // volumeThreshold");

// Widen frequency range slightly 300-1400Hz
src = src.replace("400,           // frequencyFilterMin Hz", "300,           // frequencyFilterMin Hz");
src = src.replace("1200,          // frequencyFilterMax Hz", "1400,          // frequencyFilterMax Hz");

// Increase buffer duration for better frequency lock
src = src.replace("500,           // bufferDuration ms for frequency adaptation", "800,           // bufferDuration ms for frequency adaptation");

fs.writeFileSync(file, src, "utf8");
console.log("✔ Tuned morse-pro parameters");
