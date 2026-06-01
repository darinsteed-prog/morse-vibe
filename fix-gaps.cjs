const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Letter gap: increase from 3x to 4x dot
src = src.replace(
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 3);",
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 4);"
);

// Word gap: increase from 12x to 15x dot  
src = src.replace(
  "}, getDot() * 12);",
  "}, getDot() * 15);"
);

// Smoothing back to 0.3 - 0.6 was too heavy, blurs dot/dash boundary
src = src.replace(
  "analyser.smoothingTimeConstant = 0.6;",
  "analyser.smoothingTimeConstant = 0.3;"
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed letter and word gaps");
