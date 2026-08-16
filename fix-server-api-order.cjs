const fs = require("fs");
const file = "server.ts";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  `    const apis = [
      \`https://api.airplanes.live/v2/point/\${lat}/\${lon}/250\`,
      \`https://api.adsb.one/v2/point/\${lat}/\${lon}/250\`,
      \`https://api.adsb.lol/v2/lat/\${lat}/lon/\${lon}/dist/250\`,
    ];`,
  `    const apis = [
      \`https://api.adsb.lol/v2/lat/\${lat}/lon/\${lon}/dist/250\`,
      \`https://api.adsb.one/v2/point/\${lat}/\${lon}/250\`,
    ];`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed API order - adsb.lol first");
