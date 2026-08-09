const fs = require("fs");
const file = "src/App.tsx";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  "url:'https://api.adsb.lol/v2/lat/'+clat+'/lon/'+clon+'/dist/250'",
  "url:'https://api.airplanes.live/v2/point/'+clat+'/'+clon+'/250'"
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Switched to airplanes.live API");
