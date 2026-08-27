const fs = require("fs");
const file = "server.ts";
let src = fs.readFileSync(file, "utf8");

// Add a simple test endpoint
src = src.replace(
  `  // ATC proxy endpoint`,
  `  // Simple test endpoint
  app.get("/api/test", (req: express.Request, res: express.Response) => {
    res.json({ ok: true, time: Date.now() });
  });

  // ATC proxy endpoint`
);

// Add timeout to the flights endpoint
src = src.replace(
  `        req2.on("error", reject);
        req2.setTimeout(10000, () => { req2.destroy(); reject(new Error("timeout")); });`,
  `        req2.on("error", (e) => { console.log("[flights] https error:", e.message); reject(e); });
        req2.setTimeout(8000, () => { console.log("[flights] timeout!"); req2.destroy(); reject(new Error("timeout")); });`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added test endpoint and better timeout logging");
