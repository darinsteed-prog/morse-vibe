import React, { useState, useRef, useEffect } from 'react';
import { Globe, Copy, Check, Radio, Bluetooth, Wifi, Send } from 'lucide-react';

// Morse Vibe BLE Service UUID - unique to our app
// Both phones must use this exact UUID to find each other
const MORSE_VIBE_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const MORSE_VIBE_CHAR_UUID    = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

interface RemoteTabProps {
  roomId: string;
  setRoomId: (id: string) => void;
  wsConnected: boolean;
  wsRef: React.MutableRefObject<WebSocket | null>;
  copied: boolean;
  copyWebhook: () => void;
  lastReceivedText: string | null;
  setLastReceivedText: (t: string | null) => void;
  encryptionEnabled: boolean;
  encryptionKey: string;
  setText: (t: string) => void;
  vibrateSafe: (p: number | number[]) => void;
  settings: any;
}

interface MeshMessage { from: string; text: string; time: string; rssi?: number; }
interface BleDevice { deviceId: string; name: string; rssi?: number; }

const MORSE_MAP: Record<string,string> = {
  "A":".-","B":"-...","C":"-.-.","D":"-..","E":".","F":"..-.","G":"--.","H":"....","I":"..","J":".---",
  "K":"-.-","L":".-..","M":"--","N":"-.","O":"---","P":".--.","Q":"--.-","R":".-.","S":"...","T":"-",
  "U":"..-","V":"...-","W":".--","X":"-..-","Y":"-.--","Z":"--..","0":"-----","1":".----","2":"..---",
  "3":"...--","4":"....-","5":".....","6":"-....","7":"--...","8":"---..","9":"----."
};

function textToMorse(text: string): string {
  return text.toUpperCase().split('').map(c => c === ' ' ? '/' : (MORSE_MAP[c] || '')).filter(Boolean).join(' ');
}

export function RemoteTab({ roomId, setRoomId, wsConnected, wsRef, copied, copyWebhook, lastReceivedText, setLastReceivedText, encryptionEnabled, encryptionKey, setText, vibrateSafe, settings }: RemoteTabProps) {
  const [subTab, setSubTab] = useState<'remote'|'nearby'|'lora'>('remote');

  // Nearby (BLE direct) state
  const [btConnected, setBtConnected] = useState(false);
  const [btConnecting, setBtConnecting] = useState(false);
  const [btStatus, setBtStatus] = useState('Tap Scan to find nearby Morse Vibe users');
  const [btMessages, setBtMessages] = useState<MeshMessage[]>([]);
  const [btSendText, setBtSendText] = useState('');
  const [btSendMode, setBtSendMode] = useState<'text'|'morse'>('text');
  const [foundDevices, setFoundDevices] = useState<BleDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [autoVibe, setAutoVibe] = useState(true);
  const btDeviceRef = useRef<any>(null);
  const bleRef = useRef<any>(null);

  // LoRa state
  const [loraSendMode, setLoraSendMode] = useState<'text'|'morse'>('text');
  const [loraMode, setLoraMode] = useState<'wifi'|'bluetooth'>('wifi');
  const [loraHost, setLoraHost] = useState('192.168.0.1');
  const [loraPort, setLoraPort] = useState('4403');
  const [loraConnected, setLoraConnected] = useState(false);
  const [loraConnecting, setLoraConnecting] = useState(false);
  const [loraStatus, setLoraStatus] = useState('Not connected');
  const [loraMessages, setLoraMessages] = useState<MeshMessage[]>([]);
  const [loraSendText, setLoraSendText] = useState('');
  const loraWsRef = useRef<WebSocket | null>(null);

  const addBtMessage = (from: string, text: string, rssi?: number) => {
    setBtMessages(prev => [{ from, text, time: new Date().toLocaleTimeString(), rssi }, ...prev].slice(0, 50));
    if (autoVibe && from !== 'Me') setText(text);
  };

  // ── BLE Nearby ──────────────────────────────────────────────────────────────

  const initBle = async () => {
    const { BleClient } = await import('@capacitor-community/bluetooth-le');
    await BleClient.initialize({ androidNeverForLocation: false });
    bleRef.current = BleClient;
    return BleClient;
  };

  const startScan = async () => {
    setScanning(true);
    setFoundDevices([]);
    setBtStatus('Scanning for Morse Vibe devices...');
    try {
      const ble = await initBle();
      const seen = new Set<string>();

      await ble.requestLEScan(
        { services: [MORSE_VIBE_SERVICE_UUID], allowDuplicates: false, scanMode: 2 },
        (result: any) => {
          if (result.device && !seen.has(result.device.deviceId)) {
            seen.add(result.device.deviceId);
            setFoundDevices(prev => [...prev, {
              deviceId: result.device.deviceId,
              name: result.device.name || 'Morse Vibe User',
              rssi: result.rssi
            }].slice(0, 20));
          }
        }
      );

      setTimeout(async () => {
        try { await ble.stopLEScan(); } catch(e) {}
        setScanning(false);
        setBtStatus(seen.size > 0 ? 'Tap a device to connect' : 'No Morse Vibe devices found nearby — make sure the other phone has Morse Vibe open');
      }, 8000);

    } catch(e: any) {
      setScanning(false);
      setBtStatus('Scan failed: ' + (e.message || 'Check Bluetooth permissions'));
    }
  };

  const stopScan = async () => {
    try { if (bleRef.current) await bleRef.current.stopLEScan(); } catch(e) {}
    setScanning(false);
    setBtStatus('Scan stopped');
  };

  const connectToDevice = async (device: BleDevice) => {
    setBtConnecting(true);
    setBtStatus('Connecting to ' + device.name + '...');
    try {
      const ble = bleRef.current;
      await ble.connect(device.deviceId, () => {
        setBtConnected(false);
        btDeviceRef.current = null;
        setBtStatus('Disconnected — tap Scan to reconnect');
      });

      // Subscribe to notifications for incoming messages
      try {
        await ble.startNotifications(
          device.deviceId,
          MORSE_VIBE_SERVICE_UUID,
          MORSE_VIBE_CHAR_UUID,
          (value: any) => {
            try {
              const decoder = new TextDecoder();
              const text = decoder.decode(value.buffer || value);
              const parsed = JSON.parse(text);
              addBtMessage(parsed.from || device.name, parsed.text || text);
            } catch {
              addBtMessage(device.name, String(value));
            }
          }
        );
      } catch(e) {
        // Notifications may not be available on all devices — that's ok
      }

      btDeviceRef.current = device;
      setBtConnected(true);
      setBtConnecting(false);
      setFoundDevices([]);
      setBtStatus('Connected to ' + device.name);
      addBtMessage('System', 'Connected to ' + device.name);

    } catch(e: any) {
      setBtConnecting(false);
      setBtStatus('Connect failed: ' + (e.message || 'Unknown error'));
    }
  };

  const disconnectBt = async () => {
    try {
      if (bleRef.current && btDeviceRef.current) {
        await bleRef.current.disconnect(btDeviceRef.current.deviceId);
      }
    } catch(e) {}
    setBtConnected(false);
    btDeviceRef.current = null;
    setBtStatus('Tap Scan to find nearby Morse Vibe users');
  };

  const sendBtMessage = async (rawText?: string) => {
    const msg = rawText ?? btSendText;
    if (!msg.trim() || !btConnected || !btDeviceRef.current) return;

    const payload = btSendMode === 'morse'
      ? { from: 'Morse Vibe', text: textToMorse(msg), original: msg }
      : { from: 'Morse Vibe', text: msg };

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(payload));
      await bleRef.current.write(
        btDeviceRef.current.deviceId,
        MORSE_VIBE_SERVICE_UUID,
        MORSE_VIBE_CHAR_UUID,
        data
      );
      addBtMessage('Me', btSendMode === 'morse' ? textToMorse(msg) + ' (' + msg + ')' : msg);
      setBtSendText('');
    } catch(e: any) {
      setBtStatus('Send failed: ' + (e.message || 'Unknown error'));
      // Still show message locally
      addBtMessage('Me', msg);
      setBtSendText('');
    }
  };

  // ── LoRa ────────────────────────────────────────────────────────────────────

  const connectLora = () => {
    setLoraConnecting(true);
    setLoraStatus('Connecting...');
    try {
      const ws = new WebSocket('ws://' + loraHost + ':' + loraPort);
      ws.onopen = () => { setLoraConnected(true); setLoraConnecting(false); setLoraStatus('Connected to ' + loraHost); loraWsRef.current = ws; };
      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          setLoraMessages(prev => [{ from: d.from || 'Mesh', text: d.text || d.message || e.data, time: new Date().toLocaleTimeString(), rssi: d.rxRssi }, ...prev].slice(0, 50));
        } catch {
          setLoraMessages(prev => [{ from: 'Mesh', text: e.data, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
        }
      };
      ws.onclose = () => { setLoraConnected(false); setLoraStatus('Disconnected'); };
      ws.onerror = () => { setLoraConnected(false); setLoraConnecting(false); setLoraStatus('Connection failed'); };
    } catch(e) { setLoraConnecting(false); setLoraStatus('Error'); }
  };

  const sendLoraMessage = (rawText?: string) => {
    const msg = rawText ?? loraSendText;
    if (!msg.trim()) return;
    const payload = loraSendMode === 'morse' ? textToMorse(msg) : msg;
    if (loraWsRef.current?.readyState === WebSocket.OPEN) {
      loraWsRef.current.send(JSON.stringify({ type: 'sendText', text: payload }));
    }
    setLoraMessages(prev => [{ from: 'Me', text: payload, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
    setLoraSendText('');
  };

  const msgList = (msgs: MeshMessage[]) => msgs.length > 0 && (
    <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 flex flex-col gap-3 max-h-64 overflow-y-auto">
      <span className="text-[12px] font-mono text-white/30 uppercase tracking-wider">Messages</span>
      {msgs.map((msg, idx) => (
        <div key={idx} className={`p-3 rounded-xl border ${msg.from === 'Me' ? 'bg-vibe-primary/10 border-vibe-primary/20' : 'bg-white/5 border-white/5'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[12px] font-mono text-vibe-primary/60">{msg.from}</span>
            <span className="text-[11px] font-mono text-white/20">{msg.time}{msg.rssi ? ' · ' + msg.rssi + 'dBm' : ''}</span>
          </div>
          <p className="text-base break-all">{msg.text}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 flex-1">

      {/* Tab bar */}
      <div className="flex bg-vibe-surface/50 p-1 rounded-xl border border-white/5 gap-1">
        {(['remote', 'nearby', 'lora'] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`flex-1 py-2 px-1 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-colors ${subTab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
            {t === 'remote' ? 'Remote' : t === 'nearby' ? 'Nearby' : 'LoRa'}
          </button>
        ))}
      </div>

      {/* ── Remote tab ── */}
      {subTab === 'remote' && (
        <div className="flex flex-col gap-4">
          <div className="bg-vibe-surface border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${wsConnected ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
              <Globe className="w-8 h-8"/>
            </div>
            <div>
              <h3 className="font-bold text-2xl">Remote Control</h3>
              <p className="text-base text-white/40 mt-1">Connect multiple devices over internet</p>
            </div>
            <div className="w-full bg-black/20 rounded-xl p-4 border border-white/5">
              <p className="text-[12px] font-mono text-white/40 uppercase tracking-widest mb-1">Room ID</p>
              <p className="text-3xl font-bold tracking-[0.2em] text-vibe-primary">{roomId}</p>
              <input type="text" placeholder="Type new Room ID + Enter"
                className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base font-mono focus:outline-none text-white/60 uppercase"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const v = (e.target as HTMLInputElement).value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
                    if (v.length > 0) {
                      setRoomId(v);
                      localStorage.setItem('vibe_room_id', v);
                      if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({ type: 'join', roomId: v }));
                      }
                    }
                  }
                }} />
            </div>
            <div className="w-full text-left">
              <p className="text-[12px] font-mono text-white/40 uppercase tracking-widest mb-2">Webhook URL</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-black/20 rounded-lg p-2 text-[12px] font-mono text-white/60 truncate border border-white/5">
                  https://morse-vibe.onrender.com/api/webhook/{roomId}
                </div>
                <button onClick={copyWebhook} className="p-2 bg-vibe-primary rounded-lg">
                  {copied ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                </button>
              </div>
            </div>
          </div>
          {lastReceivedText && (
            <div style={{background:'#7c3aed',border:'2px solid white',borderRadius:'12px',padding:'20px'}}>
              <p style={{color:'white',fontSize:'10px',fontFamily:'monospace',marginBottom:'8px'}}>MESSAGE RECEIVED</p>
              <p style={{color:'white',fontSize:'18px',fontWeight:'bold',wordBreak:'break-all'}}>{lastReceivedText}</p>
              <button onClick={() => setLastReceivedText(null)} style={{color:'rgba(255,255,255,0.5)',fontSize:'11px',marginTop:'8px',background:'none',border:'none',cursor:'pointer'}}>dismiss</button>
            </div>
          )}
        </div>
      )}

      {/* ── Nearby (BLE Direct) tab ── */}
      {subTab === 'nearby' && (
        <div className="flex flex-col gap-4">
          <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Bluetooth className="w-4 h-4 text-blue-400"/>
              <span className="text-[12px] font-mono uppercase tracking-wider text-white/40">Nearby · Phone to Phone</span>
              <div className={`ml-auto w-2 h-2 rounded-full ${btConnected ? 'bg-emerald-500' : scanning ? 'bg-blue-500 animate-pulse' : 'bg-red-500/50'}`}/>
            </div>
            <p className="text-[11px] font-mono text-white/25">Direct Bluetooth between Morse Vibe phones. No internet. Range up to 100m outdoors.</p>
            <p className="text-[12px] font-mono text-white/40">{btStatus}</p>

            {!btConnected && !scanning && (
              <button onClick={startScan} className="w-full py-3 bg-blue-600 rounded-xl text-white text-base font-bold uppercase tracking-widest">
                Scan for Nearby Phones
              </button>
            )}

            {scanning && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"/>
                  <span className="text-[12px] font-mono text-blue-400">Scanning... ({foundDevices.length} found)</span>
                  <button onClick={stopScan} className="ml-auto text-[12px] font-mono text-white/40 border border-white/20 rounded px-2 py-1">Stop</button>
                </div>
              </div>
            )}

            {foundDevices.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-mono text-white/30 uppercase tracking-wider">Morse Vibe devices found</p>
                {[...foundDevices].sort((a, b) => (b.rssi || -100) - (a.rssi || -100)).map(d => {
                  const sig = d.rssi || -100;
                  const bars = sig > -60 ? 4 : sig > -70 ? 3 : sig > -80 ? 2 : 1;
                  return (
                    <button key={d.deviceId} onClick={() => connectToDevice(d)} disabled={btConnecting}
                      className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 disabled:opacity-50">
                      <div className="flex items-center gap-2">
                        <Bluetooth className="w-4 h-4 text-blue-400"/>
                        <div className="text-left">
                          <p className="text-base font-bold text-white">{d.name}</p>
                          <p className="text-[11px] font-mono text-white/20">{sig}dBm</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5 items-end">
                          {[1,2,3,4].map(b => <div key={b} className={`w-1 rounded-sm ${b <= bars ? 'bg-blue-400' : 'bg-white/10'}`} style={{height:(b*3+4)+'px'}}/>)}
                        </div>
                        <span className="text-[11px] font-mono text-blue-400">{btConnecting ? '...' : 'Connect'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {btConnected && (
              <button onClick={disconnectBt} className="w-full py-3 bg-white/10 rounded-xl text-white text-base font-bold uppercase tracking-widest">
                Disconnect from {btDeviceRef.current?.name}
              </button>
            )}

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div>
                <p className="text-base font-bold">Auto Vibe Received</p>
                <p className="text-[11px] font-mono text-white/30">Vibrate when message arrives</p>
              </div>
              <button onClick={() => setAutoVibe(!autoVibe)} className={`w-12 h-6 rounded-full relative ${autoVibe ? 'bg-vibe-primary' : 'bg-white/10'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${autoVibe ? 'left-7' : 'left-1'}`}/>
              </button>
            </div>
          </div>

          {btConnected && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                {(['text', 'morse'] as const).map(m => (
                  <button key={m} onClick={() => setBtSendMode(m)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest ${btSendMode === m ? 'bg-white/15 text-white' : 'text-white/30'}`}>
                    {m === 'morse' ? 'Morse Code' : 'Plain Text'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={btSendText} onChange={e => setBtSendText(e.target.value)}
                  placeholder={btSendMode === 'morse' ? 'Type text → sends as morse...' : 'Type message...'}
                  className="flex-1 bg-vibe-surface border border-white/10 rounded-xl px-4 py-3 text-base font-mono placeholder:text-white/20 focus:outline-none"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  onKeyDown={e => e.key === 'Enter' && sendBtMessage()}
                  onSubmit={() => sendBtMessage()}/>
                <button onClick={() => sendBtMessage()} className="p-3 bg-vibe-primary rounded-xl">
                  <Send className="w-5 h-5"/>
                </button>
              </div>
              {btSendMode === 'morse' && btSendText && (
                <p className="text-[11px] font-mono text-vibe-primary/50 px-1">{textToMorse(btSendText)}</p>
              )}
            </div>
          )}

          {msgList(btMessages)}

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-1">How to use</p>
            <p className="text-[11px] text-white/20 leading-relaxed">Both phones must have Morse Vibe open. Tap Scan — only Morse Vibe devices appear. Tap to connect. Send text or morse code directly between phones with no internet.</p>
          </div>
        </div>
      )}

      {/* ── LoRa tab ── */}
      {subTab === 'lora' && (
        <div className="flex flex-col gap-4">
          <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-green-400"/>
              <span className="text-[12px] font-mono uppercase tracking-wider text-white/40">LoRa / Meshtastic</span>
              <div className={`ml-auto w-2 h-2 rounded-full ${loraConnected ? 'bg-emerald-500' : loraConnecting ? 'bg-amber-500 animate-pulse' : 'bg-red-500/50'}`}/>
            </div>
            <p className="text-[11px] font-mono text-white/25">Connect to Meshtastic LoRa hardware for km-range off-grid communication.</p>
            <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
              <button onClick={() => setLoraMode('wifi')} className={`flex-1 py-2 rounded-lg text-base font-bold uppercase tracking-widest flex items-center justify-center gap-1 ${loraMode === 'wifi' ? 'bg-white/10 text-white' : 'text-white/40'}`}>
                <Wifi className="w-3 h-3"/>WiFi
              </button>
              <button onClick={() => setLoraMode('bluetooth')} className={`flex-1 py-2 rounded-lg text-base font-bold uppercase tracking-widest flex items-center justify-center gap-1 ${loraMode === 'bluetooth' ? 'bg-white/10 text-white' : 'text-white/40'}`}>
                <Bluetooth className="w-3 h-3"/>Bluetooth
              </button>
            </div>
            {loraMode === 'wifi' && (
              <div className="flex flex-col gap-2">
                <input type="text" value={loraHost} onChange={e => setLoraHost(e.target.value)} placeholder="Device IP (e.g. 192.168.0.1)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-base font-mono placeholder:text-white/20 focus:outline-none"/>
                <input type="text" value={loraPort} onChange={e => setLoraPort(e.target.value)} placeholder="Port (default 4403)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-base font-mono placeholder:text-white/20 focus:outline-none"/>
              </div>
            )}
            <p className="text-[12px] font-mono text-white/30">{loraStatus}</p>
            {!loraConnected ? (
              <button onClick={connectLora} disabled={loraConnecting} className="w-full py-3 bg-green-700 rounded-xl text-white text-base font-bold uppercase tracking-widest disabled:opacity-30">
                {loraConnecting ? 'Connecting...' : 'Connect to Meshtastic'}
              </button>
            ) : (
              <button onClick={() => { loraWsRef.current?.close(); setLoraConnected(false); setLoraStatus('Disconnected'); }} className="w-full py-3 bg-white/10 rounded-xl text-white text-base font-bold uppercase tracking-widest">
                Disconnect
              </button>
            )}
          </div>

          {loraConnected && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                {(['text', 'morse'] as const).map(m => (
                  <button key={m} onClick={() => setLoraSendMode(m)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest ${loraSendMode === m ? 'bg-white/15 text-white' : 'text-white/30'}`}>
                    {m === 'morse' ? 'Morse Code' : 'Plain Text'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={loraSendText} onChange={e => setLoraSendText(e.target.value)}
                  placeholder={loraSendMode === 'morse' ? 'Type text → sends as morse...' : 'Type message...'}
                  className="flex-1 bg-vibe-surface border border-white/10 rounded-xl px-4 py-3 text-base font-mono placeholder:text-white/20 focus:outline-none"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  onKeyDown={e => e.key === 'Enter' && sendLoraMessage()}
                  onSubmit={() => sendLoraMessage()}/>
                <button onClick={() => sendLoraMessage()} className="p-3 bg-vibe-primary rounded-xl">
                  <Send className="w-5 h-5"/>
                </button>
              </div>
              {loraSendMode === 'morse' && loraSendText && (
                <p className="text-[11px] font-mono text-vibe-primary/50 px-1">{textToMorse(loraSendText)}</p>
              )}
            </div>
          )}

          {msgList(loraMessages)}

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-1">Compatible Hardware</p>
            <p className="text-[11px] text-white/20 leading-relaxed">TTGO T-Beam · Heltec WiFi LoRa 32 · RAK4631 · Any device running Meshtastic firmware</p>
          </div>
        </div>
      )}

    </div>
  );
}
