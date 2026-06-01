const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");
src = src.replace("const isTone = level > 45;", "const isTone = level > 35;");
fs.writeFileSync(file, src, "utf8");
console.log("✔ Threshold lowered to 35");
