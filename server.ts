import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_MESSAGE_LENGTH = 500;
const MAX_ROOM_CLIENTS = 20;

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "10kb" }));

  // Room state: roomId -> Set<WebSocket>
  const rooms = new Map<string, Set<WebSocket>>();

  const getOrCreateRoom = (roomId: string): Set<WebSocket> => {
    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    return rooms.get(roomId)!;
  };

  const leaveRoom = (ws: WebSocket, roomId: string | null) => {
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    room.delete(ws);
    if (room.size === 0) rooms.delete(roomId);
  };

  const broadcast = (roomId: string, payload: object, exclude?: WebSocket) => {
    const room = rooms.get(roomId);
    if (!room) return 0;
    let sent = 0;
    room.forEach((client) => {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(payload));
        sent++;
      }
    });
    return sent;
  };

  wss.on("connection", (ws) => {
    let currentRoom: string | null = null;

    // Ping/pong to detect stale connections
    (ws as any).isAlive = true;
    ws.on("pong", () => { (ws as any).isAlive = true; });

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "join") {
          const roomId = String(message.roomId ?? "").toUpperCase().slice(0, 12);
          if (!roomId) return;

          leaveRoom(ws, currentRoom);
          currentRoom = roomId;
          const room = getOrCreateRoom(roomId);

          if (room.size >= MAX_ROOM_CLIENTS) {
            ws.send(JSON.stringify({ type: "error", reason: "Room full" }));
            return;
          }

          room.add(ws);
          ws.send(JSON.stringify({ type: "joined", roomId, peers: room.size - 1 }));
        }

        if (message.type === "vibe" && currentRoom) {
          const text = String(message.text ?? "").slice(0, MAX_MESSAGE_LENGTH);
          if (!text.trim()) return;
          broadcast(currentRoom, { type: "remote_vibe", text }, ws);
        }
      } catch (e) {
        console.error("WS parse error:", e);
      }
    });

    ws.on("close", () => leaveRoom(ws, currentRoom));
    ws.on("error", (err) => {
      console.error("WS client error:", err.message);
      leaveRoom(ws, currentRoom);
    });
  });

  // Heartbeat — drop dead connections every 30s
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if ((ws as any).isAlive === false) return ws.terminate();
      (ws as any).isAlive = false;
      ws.ping();
    });
  }, 30_000);

  wss.on("close", () => clearInterval(heartbeat));

  // Webhook: POST /api/webhook/:roomId { "message": "hello" }
  app.post("/api/webhook/:roomId", (req, res) => {
    const roomId = String(req.params.roomId ?? "").toUpperCase().slice(0, 12);
    const message = String(req.body?.message ?? "").slice(0, MAX_MESSAGE_LENGTH);

    if (!message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    const room = rooms.get(roomId);
    if (!room || room.size === 0) {
      return res.status(404).json({ error: "Room not found or no active listeners" });
    }

    const sent = broadcast(roomId, { type: "remote_vibe", text: message });
    res.json({ status: "ok", room: roomId, sentTo: sent });
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", rooms: rooms.size, clients: wss.clients.size });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`✦ Morse Vibe server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
