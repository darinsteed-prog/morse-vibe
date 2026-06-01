const fs = require("fs");
const file = "src/components/RemoteTab.tsx";
let src = fs.readFileSync(file, "utf8");

// Add missing semicolon after morseMap closing brace
src = src.replaceAll(
  `"9":"----."}
                let payload`,
  `"9":"----."};
                let payload`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed missing semicolons");
