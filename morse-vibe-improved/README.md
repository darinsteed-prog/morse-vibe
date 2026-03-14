# Morse Vibe ⚡

A tactile, full-stack Morse code communication tool with haptic feedback. Transmit messages through vibrations across your phone, smartwatch, or any remote device.

## Features

- **Three Input Modes**: Type via keyboard, tap like a telegraph, or receive from remote devices
- **Real-Time Sync**: WebSocket-powered — transmit from one device, feel it on another instantly
- **Webhook API**: Trigger vibrations externally via POST request (BitChat, automation tools, etc.)
- **Custom Haptic Patterns**: Define vibration sequences per word or character — with inline form (no more window.prompt!)
- **Visual Flash**: Screen syncs with vibration for accessibility and silent environments
- **Transmission History**: Quickly re-send recent messages (up to 15 entries)
- **Truncation Warning**: Alerts you if a message is too long for the browser's vibration limit
- **Live Connection Status**: Shows WebSocket state (connecting / live / offline) with auto-reconnect
- **Haptic Diagnostic**: Test vibration support and fire test patterns from Settings

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS v4, Framer Motion, Lucide Icons
- **Backend**: Node.js, Express, WebSockets (`ws`)
- **Build**: Vite

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/morse-vibe.git
cd morse-vibe
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Remote Sync

1. Open the app on two devices
2. Both should share the same **Room ID** (shown in the Remote tab)
3. Transmit from one — the other vibrates in real-time

## Webhook API

```
POST /api/webhook/:roomId
Content-Type: application/json

{ "message": "SOS" }
```

Returns `{ "status": "ok", "room": "ABCD12", "sentTo": 2 }`.

Health check: `GET /api/health`

## License

Apache-2.0
