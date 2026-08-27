const fs = require("fs");
const file = "server.ts";
let src = fs.readFileSync(file, "utf8");

// Replace the flights endpoint with native fetch
src = src.replace(
  `  // Flight data proxy
  app.get("/api/flights", async (req: express.Request, res: express.Response) => {
    console.log("[flights] Request received lat=" + req.query.lat + " lon=" + req.query.lon);
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "lat and lon required" });
    const url = \`https://api.adsb.lol/v2/lat/\${lat}/lon/\${lon}/dist/250\`;
    try {
      const data = await new Promise<any>((resolve, reject) => {
        const req2 = https.get(url, (response: any) => {
          let body = "";
          response.on("data", (chunk: any) => body += chunk);
          response.on("end", () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
        });
        req2.on("error", (e) => { console.log("[flights] https error:", e.message); reject(e); });
        req2.setTimeout(8000, () => { console.log("[flights] timeout!"); req2.destroy(); reject(new Error("timeout")); });
      });
      res.json(data);
    } catch(e: any) {
      console.log("[flights] Error:", e.message, e.stack);
      res.status(500).json({ error: e.message });
    }
  });`,
  `  // Flight data proxy
  app.get("/api/flights", async (req: express.Request, res: express.Response) => {
    console.log("[flights] Request received lat=" + req.query.lat + " lon=" + req.query.lon);
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "lat and lon required" });
    const url = \`https://api.adsb.lol/v2/lat/\${lat}/lon/\${lon}/dist/250\`;
    try {
      console.log("[flights] fetching:", url);
      const controller = new AbortController();
      const timer = setTimeout(() => { console.log("[flights] aborting fetch"); controller.abort(); }, 8000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      console.log("[flights] response status:", response.status);
      const data = await response.json();
      console.log("[flights] ac count:", data.ac?.length);
      res.json(data);
    } catch(e: any) {
      console.log("[flights] Error:", e.message);
      res.status(500).json({ error: e.message });
    }
  });`
);

// Also fix the /api/atc endpoint
src = src.replace(
  `  // ATC proxy endpoint
  app.get("/api/atc", async (req: express.Request, res: express.Response) => {
    try {
      const data = await new Promise<any>((resolve, reject) => {
        const r = https.get("https://api.adsb.lol/v2/lat/53.3/lon/-6.3/dist/250", (response: any) => {
          let body = "";
          response.on("data", (chunk: any) => body += chunk);
          response.on("end", () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
        });
        r.on("error", reject);
      });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });`,
  `  // ATC proxy endpoint
  app.get("/api/atc", async (req: express.Request, res: express.Response) => {
    try {
      const response = await fetch("https://api.adsb.lol/v2/lat/53.3/lon/-6.3/dist/250");
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Switched to native fetch");
