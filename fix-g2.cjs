const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Lower noise floor multiplier from 2.5 to 1.8 - was blocking dots
src = src.replace(
  "const isTone = power > noiseFloorRef.current * 2.5;",
  "const isTone = power > noiseFloorRef.current * 1.8;"
);

// Lower noise floor measurement from 1.5x to 1.2x
src = src.replace(
  "? Math.max(...noiseSamples) * 1.5",
  "? Math.max(...noiseSamples) * 1.2"
);

// Letter timer from 5x to 4x dot
src = src.replace(
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 5);",
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 4);"
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed noise floor and letter timer");
