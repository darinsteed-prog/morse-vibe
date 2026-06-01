const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Ignore tones longer than 350ms — those are gaps being picked up as tones
src = src.replace(
  "if (duration >= 20) processSymbol(duration);",
  `if (duration >= 20 && duration <= 350) processSymbol(duration);
      else if (duration > 350) addLog("IGNORED gap-tone " + duration + "ms");`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added max dash filter 350ms");
