const fs = require("fs");
const file = "server.ts";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  `  // Flight data proxy
  app.get("/api/flights", async (req: express.Request, res: express.Response) => {`,
  `  // Flight data proxy
  app.get("/api/flights", async (req: express.Request, res: express.Response) => {
    console.log("[flights] Request received lat=" + req.query.lat + " lon=" + req.query.lon);`
);

src = src.replace(
  `    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/webhook`,
  `    } catch(e: any) {
      console.log("[flights] Error:", e.message, e.stack);
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/webhook`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added logging");
