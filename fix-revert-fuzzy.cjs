const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");
src = src.replace(
  "return matches >= Math.ceil(last.length * 0.5) && matches < last.length;",
  "return matches >= Math.ceil(last.length * 0.6) && matches < last.length;"
);
fs.writeFileSync(file, src, "utf8");
console.log("✔ Reverted fuzzy match");
