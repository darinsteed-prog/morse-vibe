const fs = require("fs");
const file = "server.ts";
let src = fs.readFileSync(file, "utf8");

// Replace the /api/flights endpoint with a simpler version using https
src = src.replace(
  `  // Flight data proxy - tries multiple APIs so app never needs updating
  app.get("/api/flights", async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "lat and lon required" });
    const apis = [
      \`https://api.adsb.lol/v2/lat/\${lat}/lon/\${lon}/dist/250\`,
      \`https://api.adsb.one/v2/point/\${lat}/\${lon}/250\`,
    ];
    for (const url of apis) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!r.ok) continue;
        const data = await r.json();
        if (data.ac !== undefined) {
          res.json(data);
          return;
        }
      } catch(e) { continue; }
    }
    // All APIs failed or returned empty - return empty
    res.json({ ac: [], msg: "No data available" });
  });`,
  `  // Flight data proxy
  app.get("/api/flights", async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "lat and lon required" });
    const url = \`https://api.adsb.lol/v2/lat/\${lat}/lon/\${lon}/dist/250\`;
    try {
      const https = await import("https");
      const data = await new Promise((resolve, reject) => {
        const req = https.get(url, (response) => {
          let body = "";
          response.on("data", (chunk) => body += chunk);
          response.on("end", () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
        });
        req.on("error", reject);
        req.setTimeout(10000, () => { req.destroy(); reject(new Error("timeout")); });
      });
      res.json(data);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed server to use https module");
