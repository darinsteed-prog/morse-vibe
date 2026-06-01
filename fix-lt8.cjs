const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Increase letter timer to 8x dot = 536ms at 18WPM
// Letter gaps in this video are ~940ms so 536ms is safely below that
src = src.replace(
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 6);",
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 8);"
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Letter timer set to 8x dot");
