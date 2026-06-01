const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Cap valid tone at 300ms - letter gaps (494ms) get ignored
src = src.replace(
  "if (duration >= 40 && duration <= 600) processSymbol(duration);",
  "if (duration >= 40 && duration <= 300) processSymbol(duration);"
);

// When we see 300-700ms tone it is a letter gap - commit current letter
src = src.replace(
  "else if (duration > 600) { addLog(\"GAP \" + duration + \"ms\"); commitLetter(); }",
  `else if (duration > 300 && duration <= 1500) { addLog("LGAP " + duration + "ms → commit"); commitLetter(); }
      else if (duration > 1500) { addLog("WGAP " + duration + "ms → word"); commitLetter(); }`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed - letter gaps now commit instead of decode as dashes");
