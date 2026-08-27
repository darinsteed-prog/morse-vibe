const fs = require("fs");
const file = "server.ts";
let src = fs.readFileSync(file, "utf8");

// Replace the entire flights endpoint with a much simpler version
const oldEndpoint = src.substring(
  src.indexOf("  // Flight data proxy"),
  src.indexOf("  app.post(\"/api/webhook")
);

const newEndpoint = `  // Flight data proxy
  app.get("/api/flights", async (req: any, res: any) => {
    try {
      const lat = req.query.lat || "53.3";
      const lon = req.query.lon || "-6.3";
      console.log("[flights] fetching for lat=" + lat + " lon=" + lon);
      const url = "https://api.adsb.lol/v2/lat/" + lat + "/lon/" + lon + "/dist/250";
      const r = await fetch(url);
      console.log("[flights] status=" + r.status);
      const body = await r.text();
      console.log("[flights] body length=" + body.length);
      res.setHeader("Content-Type", "application/json");
      res.send(body);
    } catch(err: any) {
      console.log("[flights] CATCH:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

`;

src = src.replace(oldEndpoint, newEndpoint);
fs.writeFileSync(file, src, "utf8");
console.log("✔ Simplified flights endpoint");
