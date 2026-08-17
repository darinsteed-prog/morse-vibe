const fs = require("fs");
const file = "src/App.tsx";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  `url:'https://morse-vibe.onrender.com/api/flights?lat='+clat+'&lon='+clon+clat+'/'+clon+'/250'`,
  `url:'https://morse-vibe.onrender.com/api/flights?lat='+clat+'&lon='+clon`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed malformed URL");
