const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");
src = src.replace(
  "        230,    // volumeThreshold - slightly higher to reduce noise dots",
  "        220,    // volumeThreshold (library default)"
);
fs.writeFileSync(file, src, "utf8");
console.log("✔ Threshold back to 220");
