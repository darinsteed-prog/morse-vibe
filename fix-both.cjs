const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Back to 3x letter timer
src = src.replace(
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 5);",
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 3);"
);

// Raise max dash from 350ms to 600ms
src = src.replace(
  "if (duration >= 20 && duration <= 350) processSymbol(duration);",
  "if (duration >= 20 && duration <= 600) processSymbol(duration);"
);
src = src.replace(
  'else if (duration > 350) addLog("IGNORED gap-tone " + duration + "ms");',
  'else if (duration > 600) addLog("IGNORED gap-tone " + duration + "ms");'
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed");
