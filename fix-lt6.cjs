const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");
src = src.replace(
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 10);",
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 6);"
);
fs.writeFileSync(file, src, "utf8");
console.log("✔ Letter timer set to 6x = 400ms at 18WPM");
