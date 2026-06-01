const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// 1. Lower threshold to 20 - catches dots
src = src.replace("const isTone = level > 35;", "const isTone = level > 20;");

// 2. Letter timer to 8x - gives time for all symbols to arrive
src = src.replace(
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 4.5);",
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 8);"
);

// 3. Cap real tones at 300ms - letter gaps (494ms) commit instead of decode
src = src.replace(
  "if (duration >= 20 && duration <= 600) {",
  "if (duration >= 20 && duration <= 300) {"
);
src = src.replace(
  `} else if (duration > 600) {
        addLog("GAP " + duration + "ms â†' commit");
        commitLetter();`,
  `} else if (duration > 300) {
        addLog("GAP " + duration + "ms → commit");
        commitLetter();`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Restored working settings");
