const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");
src = src.replace(
  "const isTone = level > thresholdRef.current;",
  "const isTone = level > 20;"
);
fs.writeFileSync(file, src, "utf8");
console.log("✔ Threshold set to 20");
