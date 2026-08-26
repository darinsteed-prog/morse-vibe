const fs = require("fs");
const file = "server.ts";
let src = fs.readFileSync(file, "utf8");

// Fix implicit any types
src = src.replace(
  `app.get("/api/atc", async (req, res) => {`,
  `app.get("/api/atc", async (req: express.Request, res: express.Response) => {`
);

src = src.replace(
  `app.get("/api/flights", async (req, res) => {`,
  `app.get("/api/flights", async (req: express.Request, res: express.Response) => {`
);

src = src.replace(
  `app.post("/api/webhook/:roomId", validateWebhookAuth, (req, res) => {`,
  `app.post("/api/webhook/:roomId", validateWebhookAuth, (req: express.Request, res: express.Response) => {`
);

// Fix the Promise callback type
src = src.replace(
  `      const data = await new Promise((resolve, reject) => {
        const r = https.get("https://api.adsb.lol/v2/lat/53.3/lon/-6.3/dist/250", (response) => {`,
  `      const data = await new Promise<any>((resolve, reject) => {
        const r = https.get("https://api.adsb.lol/v2/lat/53.3/lon/-6.3/dist/250", (response: any) => {`
);

src = src.replace(
  `      const data = await new Promise((resolve, reject) => {
        const req = https.get(url, (response) => {`,
  `      const data = await new Promise<any>((resolve, reject) => {
        const req2 = https.get(url, (response: any) => {`
);

src = src.replace(
  `        req.on("error", reject);
        req.setTimeout(10000, () => { req.destroy(); reject(new Error("timeout")); });`,
  `        req2.on("error", reject);
        req2.setTimeout(10000, () => { req2.destroy(); reject(new Error("timeout")); });`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed TypeScript types");
