const fs = require("fs");
const file = "server.ts";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  `  app.post("/api/webhook/:roomId"`,
  `  // Flight data proxy - tries multiple APIs so app never needs updating
  app.get("/api/flights", async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "lat and lon required" });
    const apis = [
      \`https://api.airplanes.live/v2/point/\${lat}/\${lon}/250\`,
      \`https://api.adsb.one/v2/point/\${lat}/\${lon}/250\`,
      \`https://api.adsb.lol/v2/lat/\${lat}/lon/\${lon}/dist/250\`,
    ];
    for (const url of apis) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!r.ok) continue;
        const data = await r.json();
        if (data.ac && data.ac.length > 0) {
          res.json(data);
          return;
        }
      } catch(e) { continue; }
    }
    // All APIs failed or returned empty - return empty
    res.json({ ac: [], msg: "No data available" });
  });

  app.post("/api/webhook/:roomId"`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added /api/flights endpoint to server");
