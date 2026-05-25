import React, { useState, useRef } from 'react';
import { Radio, Bluetooth, Wifi, Send, Circle } from 'lucide-react';

interface MeshModeProps {
  setText: (text: string) => void;
  isTransmitting: boolean;
  vibrateSafe: (pattern: number | number[]) => void;
}

interface MeshMessage {
  from: string;
  text: string;
  time: string;
  rssi?: number;
}

export function MeshMode({ setText, isTransmitting, vibrateSafe }: MeshModeProps) {
  const [connectionType, setConnectionType] = useState<'bluetooth' | 'wifi'>('bluetooth');
  const [wifiHost, setWifiHost] = useState('192.168.0.1');
  const [wifiPort, setWifiPort] = useState('4403');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [messages, setMessages] = useState<MeshMessage[]>([]);
  const [sendText, setSendText] = useState('');
  const [status, setStatus] = useState('Not connected');
  const wsRef = useRef<WebSocket | null>(null);
  const [autoVibe, setAutoVibe] = useState(true);

  const connectWifi = () => {
    setConnecting(true);
    setStatus('Connecting via WiFi...');
    try {
      const ws = new WebSocket(`ws://${wifiHost}:${wifiPort}`);
      ws.onopen = () => {
        setConnected(true);
        setConnecting(false);
        setStatus(`Connected via WiFi to ${wifiHost}`);
        wsRef.current = ws;
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleIncomingMessage(data);
        } catch {
          console.log('Raw message:', event.data);
        }
      };
      ws.onclose = () => {
        setConnected(false);
        setStatus('Disconnected');
      };
      ws.onerror = () => {
        setConnected(false);
        setConnecting(false);
        setStatus('WiFi connection failed — check IP and port');
      };
    } catch (e) {
      setConnecting(false);
      setStatus('Connection error');
    }
  };

  const connectBluetooth = async () => {
    setConnecting(true);
    setStatus('Scanning for Meshtastic device...');
    try {
      // Use Web Bluetooth API
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Meshtastic' },
          { services: ['6ba1b218-15a8-461f-9fa8-5d6646df81ad'] }
        ],
        optionalServices: ['6ba1b218-15a8-461f-9fa8-5d6646df81ad']
      });
      setStatus(`Found: ${device.name} — connecting...`);
      const server = await device.gatt.connect();
      setConnected(true);
      setConnecting(false);
      setStatus(`Connected via Bluetooth to ${device.name}`);

      // Listen for disconnection
      device.addEventListener('gattserverdisconnected', () => {
        setConnected(false);
        setStatus('Bluetooth disconnected');
      });

      // Get Meshtastic service
      const service = await server.getPrimaryService('6ba1b218-15a8-461f-9fa8-5d6646df81ad');
      const characteristic = await service.getCharacteristic('ed9da18c-a800-4f66-a670-aa7547ed8d4f');
      
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        const decoder = new TextDecoder();
        const text = decoder.decode(value);
        try {
          const data = JSON.parse(text);
          handleIncomingMessage(data);
        } catch {
          handleIncomingMessage({ from: 'Device', text, time: new Date().toLocaleTimeString() });
        }
      });

    } catch (e: any) {
      setConnecting(false);
      setStatus(`Bluetooth failed: ${e.message || 'Could not connect'}`);
    }
  };

  const handleIncomingMessage = (data: any) => {
    const msg: MeshMessage = {
      from: data.from || data.fromId || 'Unknown',
      text: data.text || data.payload?.text || data.message || JSON.stringify(data),
      time: new Date().toLocaleTimeString(),
      rssi: data.rxRssi
    };
    setMessages(prev => [msg, ...prev].slice(0, 50));

    // Auto vibrate as Morse
    if (autoVibe && msg.text) {
      setText(msg.text);
    }
  };

  const disconnect = () => {
    wsRef.current?.close();
    setConnected(false);
    setStatus('Disconnected');
  };

  const sendMessage = () => {
    if (!sendText.trim() || !connected) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'sendText', text: sendText }));
      setMessages(prev => [{
        from: 'Me',
        text: sendText,
        time: new Date().toLocaleTimeString()
      }, ...prev]);
      setSendText('');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
        <div className="flex items-center gap-2 text-white/40">
          <Radio className="w-4 h-4" />
          <span className="text-[10px] font-mono uppercase tracking-wider">Meshtastic Bridge</span>
          <div className={`ml-auto w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : connecting ? 'bg-amber-500 animate-pulse' : 'bg-red-500/50'}`} />
        </div>

        {/* Connection Type */}
        <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setConnectionType('bluetooth')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1 ${connectionType === 'bluetooth' ? 'bg-white/10 text-white' : 'text-white/40'}`}
          >
            <Bluetooth className="w-3 h-3" /> Bluetooth
          </button>
          <button
            onClick={() => setConnectionType('wifi')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1 ${connectionType === 'wifi' ? 'bg-white/10 text-white' : 'text-white/40'}`}
          >
            <Wifi className="w-3 h-3" /> WiFi
          </button>
        </div>

        {/* WiFi Settings */}
        {connectionType === 'wifi' && (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={wifiHost}
              onChange={e => setWifiHost(e.target.value)}
              placeholder="Device IP (e.g. 192.168.0.1)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono placeholder:text-white/20 focus:outline-none"
            />
            <input
              type="text"
              value={wifiPort}
              onChange={e => setWifiPort(e.target.value)}
              placeholder="Port (default 4403)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono placeholder:text-white/20 focus:outline-none"
            />
          </div>
        )}

        {/* Status */}
        <p className="text-[10px] font-mono text-white/30">{status}</p>

        {/* Connect Button */}
        {!connected ? (
          <button
            onClick={connectionType === 'bluetooth' ? connectBluetooth : connectWifi}
            disabled={connecting}
            className="w-full py-3 bg-vibe-primary rounded-xl text-white text-xs font-bold uppercase tracking-widest disabled:opacity-30 transition-all"
          >
            {connecting ? 'Connecting...' : `Connect via ${connectionType === 'bluetooth' ? 'Bluetooth' : 'WiFi'}`}
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="w-full py-3 bg-white/10 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all"
          >
            Disconnect
          </button>
        )}

        {/* Auto Vibe Toggle */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
          <div>
            <p className="text-xs font-bold">Auto Vibe Messages</p>
            <p className="text-[9px] text-white/30 font-mono">Vibrate incoming LoRa messages as Morse</p>
          </div>
          <button
            onClick={() => setAutoVibe(!autoVibe)}
            className={`w-12 h-6 rounded-full transition-colors relative ${autoVibe ? 'bg-vibe-primary' : 'bg-white/10'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${autoVibe ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* Send Message */}
      {connected && (
        <div className="flex gap-2">
          <input
            type="text"
            value={sendText}
            onChange={e => setSendText(e.target.value)}
            placeholder="Send via LoRa..."
            className="flex-1 bg-vibe-surface border border-white/10 rounded-xl px-4 py-3 text-sm font-mono placeholder:text-white/20 focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!sendText.trim()}
            className="p-3 bg-vibe-primary rounded-xl disabled:opacity-30"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Received Messages</span>
          {messages.map((msg, idx) => (
            <div key={idx} className={`p-3 rounded-xl border ${msg.from === 'Me' ? 'bg-vibe-primary/10 border-vibe-primary/20' : 'bg-white/5 border-white/5'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono text-vibe-primary/60">{msg.from}</span>
                <span className="text-[9px] font-mono text-white/20">{msg.time}{msg.rssi ? ` · ${msg.rssi}dBm` : ''}</span>
              </div>
              <p className="text-sm">{msg.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="bg-white/5 rounded-xl p-3 border border-white/5">
        <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-1">Compatible Devices</p>
        <p className="text-[9px] text-white/20 leading-relaxed">TTGO T-Beam · Heltec WiFi LoRa 32 · RAK4631 · Any device running Meshtastic firmware</p>
      </div>
    </div>
  );
}