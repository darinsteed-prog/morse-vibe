const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Increase letter timer from 3x to 5x dot
src = src.replace(
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 3);",
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 5);"
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Letter timer increased to 5x dot");
