const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");
src = src.replace("const isTone = level > 30;", "const isTone = level > 45;");
fs.writeFileSync(file, src, "utf8");
console.log("✔ Threshold raised to 45");
