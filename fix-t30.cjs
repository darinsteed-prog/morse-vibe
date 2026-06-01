const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");
src = src.replace("const isTone = level > 20;", "const isTone = level > 30;");
fs.writeFileSync(file, src, "utf8");
console.log("✔ Threshold raised to 30");
