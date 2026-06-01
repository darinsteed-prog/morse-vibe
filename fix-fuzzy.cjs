const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Lower fuzzy match from 60% to 50% - catches more errors
src = src.replace(
  "return matches >= Math.ceil(last.length * 0.6) && matches < last.length;",
  "return matches >= Math.ceil(last.length * 0.5) && matches < last.length;"
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Lowered fuzzy match threshold");
