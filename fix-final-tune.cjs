const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Raise volumeThreshold slightly to reduce noise dots (H reading as 5)
src = src.replace(
  "        220,    // volumeThreshold (library default)",
  "        230,    // volumeThreshold - slightly higher to reduce noise dots"
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Tuned threshold");
