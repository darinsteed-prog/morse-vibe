const fs = require("fs");
const file = "server.ts";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  `const r = await fetch(url);`,
  `const r = await fetch(url, { headers: { "User-Agent": "MorseVibe/2.0 (contact: faithalarmapp@gmail.com)" } });`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added User-Agent header");
