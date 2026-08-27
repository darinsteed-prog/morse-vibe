const fs = require("fs");
const file = "server.ts";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  `    console.log("[flights] Request received lat=" + req.query.lat + " lon=" + req.query.lon);
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "lat and lon required" });
    const url = \`https://api.adsb.lol/v2/lat/\${lat}/lon/\${lon}/dist/250\`;
    try {
      console.log("[flights] fetching:", url);`,
  `    console.log("[flights] Request received lat=" + req.query.lat + " lon=" + req.query.lon);
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "lat and lon required" });
    const url = "https://api.adsb.lol/v2/lat/" + lat + "/lon/" + lon + "/dist/250";
    console.log("[flights] url:", url);
    try {
      console.log("[flights] fetching:", url);`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added more logging");
