const fs = require("fs");
const file = "src/App.tsx";
let src = fs.readFileSync(file, "utf8");
src = src.replace("BitChat", "Nearby");
src = src.replace("bitchat", "nearby");
fs.writeFileSync(file, src, "utf8");
console.log("✔ Renamed BitChat to Nearby");
