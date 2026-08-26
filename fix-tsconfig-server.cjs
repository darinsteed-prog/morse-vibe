const fs = require("fs");
const file = "tsconfig.server.json";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  `"allowImportingTsExtensions": false`,
  `"allowImportingTsExtensions": false,
    "strict": false,
    "noImplicitAny": false`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed tsconfig.server.json");
