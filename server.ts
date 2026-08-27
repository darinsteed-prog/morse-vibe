import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number = 60 * 1000;
  private maxRequests: number = 30;
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);
    if (validRequests.length >= this.maxRequests) return false;
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

async function startServer() {
  console.log("Starting server...");
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 8080;
  const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || "default-dev-token";
  const rateLimiter = new RateLimiter();
  app.use(express.json());

  const validateWebhookAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Missing authorization header" });
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer') return res.status(401).json({ error: "Invalid authorization scheme" });
    if (token !== WEBHOOK_TOKEN) return res.status(403).json({ error: "Invalid webhook token" });
    next();
  };

  const rooms = new Map<string, Set<WebSocket>>();
  const wsRateLimiters = new WeakMap<WebSocket, RateLimiter>();

  wss.on("connection", (ws: any) => {
    let currentRoom: string | null = null;
    const limiter = new RateLimiter();
    wsRateLimiters.set(ws, limiter);
    ws.on("message", (data: any) => {
      if (!limiter.isAllowed("message")) { ws.send(JSON.stringify({ type: "error", error: "Too many messages." })); return; }
      try {
        const message = JSON.parse(data.toString());
        if (data.byteLength > 50000) { ws.send(JSON.stringify({ type: "error", error: "Message too large" })); return; }
        if (message.type === "join") {
          const { roomId } = message;
          if (!roomId || typeof roomId !== 'string' || !roomId.match(/^[a-zA-Z0-9_-]{1,100}$/)) { ws.send(JSON.stringify({ type: "error", error: "Invalid room ID" })); return; }
          if (currentRoom) rooms.get(currentRoom)?.delete(ws);
          currentRoom = roomId;
          if (!rooms.has(roomId)) rooms.set(roomId, new Set());
          rooms.get(roomId)!.add(ws);
          ws.send(JSON.stringify({ type: "joined", roomId }));
        }
        if (message.type === "vibe" && currentRoom) {
          const { text } = message;
          if (!text || typeof text !== 'string' || text.length > 5000) { ws.send(JSON.stringify({ type: "error", error: "Invalid message" })); return; }
          rooms.get(currentRoom)?.forEach((client) => { if (client !== ws && client.readyState === WebSocket.OPEN) client.send(JSON.stringify({ type: "remote_vibe", text })); });
        }
      } catch (e) { console.error("WS error:", e); ws.send(JSON.stringify({ type: "error", error: "Invalid message format" })); }
    });
    ws.on("close", () => { if (currentRoom) { rooms.get(currentRoom)?.delete(ws); if (rooms.get(currentRoom)?.size === 0) rooms.delete(currentRoom); } });
  });

  // ATC proxy endpoint
  app.get("/api/atc", async (req: express.Request, res: express.Response) => {
    try {
      const https = await import("https");
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
  });

  // Flight data proxy
  app.get("/api/flights", async (req: express.Request, res: express.Response) => {
    console.log("[flights] Request received lat=" + req.query.lat + " lon=" + req.query.lon);
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "lat and lon required" });
    const url = `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/250`;
    try {
      const https = await import("https");
      const data = await new Promise<any>((resolve, reject) => {
        const req2 = https.get(url, (response: any) => {
          let body = "";
          response.on("data", (chunk: any) => body += chunk);
          response.on("end", () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
        });
        req2.on("error", reject);
        req2.setTimeout(10000, () => { req2.destroy(); reject(new Error("timeout")); });
      });
      res.json(data);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/webhook/:roomId", validateWebhookAuth, (req: express.Request, res: express.Response) => {
    const { roomId } = req.params;
    const { message } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress || "unknown";
    if (!rateLimiter.isAllowed(clientIp)) return res.status(429).json({ error: "Too many requests." });
    if (!message || typeof message !== 'string') return res.status(400).json({ error: "Message required" });
    if (message.length > 10000) return res.status(400).json({ error: "Message too long" });
    if (!roomId.match(/^[a-zA-Z0-9_-]+$/)) return res.status(400).json({ error: "Invalid room ID" });
    const roomClients = rooms.get(roomId);
    if (roomClients) { roomClients.forEach((client) => { if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify({ type: "remote_vibe", text: message })); }); res.json({ status: "ok", sentTo: roomClients.size }); }
    else res.status(404).json({ error: "Room not found" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req: express.Request, res: express.Response) => { res.sendFile(path.join(__dirname, "dist", "index.html")); });
  }

  server.listen(PORT, "0.0.0.0", () => { console.log(`Server running on http://localhost:${PORT}`); });
}

startServer();
