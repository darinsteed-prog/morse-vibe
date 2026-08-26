const fs = require("fs");
const file = "server.ts";
let src = fs.readFileSync(file, "utf8");

// Fix the /api/atc endpoint too
src = src.replace(
  `  // ATC proxy endpoint
  app.get("/api/atc", async (req, res) => {
    try {
      const response = await fetch("https://api.adsb.lol/v2/lat/53.3/lon/-6.3/dist/250");
      if (!response.ok) throw new Error("adsb.lol error " + response.status);
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });`,
  `  // ATC proxy endpoint
  app.get("/api/atc", async (req, res) => {
    try {
      const https = await import("https");
      const data = await new Promise((resolve, reject) => {
        const r = https.get("https://api.adsb.lol/v2/lat/53.3/lon/-6.3/dist/250", (response) => {
          let body = "";
          response.on("data", (chunk) => body += chunk);
          response.on("end", () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
        });
        r.on("error", reject);
      });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed /api/atc endpoint");
