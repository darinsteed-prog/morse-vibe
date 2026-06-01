const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");
src = src.replace(`"---..","8"`, `"---..":"8"`);
fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed typo");
