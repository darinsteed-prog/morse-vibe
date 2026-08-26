const fs = require("fs");
const file = "server.ts";
let src = fs.readFileSync(file, "utf8");

// Fix ws parameter types
src = src.replace(
  `wss.on("connection", (ws) => {`,
  `wss.on("connection", (ws: any) => {`
);
src = src.replace(
  `ws.on("message", (data) => {`,
  `ws.on("message", (data: any) => {`
);

// Fix chunk parameters
src = src.replace(/response\.on\("data", \(chunk\) =>/g, `response.on("data", (chunk: any) =>`);

// Fix remaining req/res
src = src.replace(
  `app.post("/api/webhook/:roomId", validateWebhookAuth, (req, res) => {`,
  `app.post("/api/webhook/:roomId", validateWebhookAuth, (req: any, res: any) => {`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed all any types");
