const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Increase word gap multiplier from 7 to 9
src = src.replace(
  "}, getDot() * 7);",
  "}, getDot() * 9);"
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed word gap");
