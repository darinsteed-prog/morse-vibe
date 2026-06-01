const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");
src = src.replace(
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 3);",
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 4.5);"
);
fs.writeFileSync(file, src, "utf8");
console.log("✔ Letter timer set to 4.5x dot");
