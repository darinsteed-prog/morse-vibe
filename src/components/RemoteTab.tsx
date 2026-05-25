import React, { useState, useRef } from 'react';
import { Globe, Copy, Check, Radio, Bluetooth, Wifi, Send, X } from 'lucide-react';
import { ImageDecoder } from './ImageDecoder';
import { QRDecoder } from './QRDecoder';
import { MorseDecoder } from './MorseDecoder';

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

export function RemoteTab({ roomId, setRoomId, wsConnected, wsRef, copied, copyWebhook, lastReceivedText, setLastReceivedText, encryptionEnabled, encryptionKey, setText, vibrateSafe, settings }: RemoteTabProps) {
  const [subTab, setSubTab] = useState<'remote'|'bitchat'|'lora'>('remote');
  const [btConnected, setBtConnected] = useState(false);
  const [btConnecting, setBtConnecting] = useState(false);
  const [btStatus, setBtStatus] = useState('Not connected');
  const [btMessages, setBtMessages] = useState<MeshMessage[]>([]);
  const [btSendText, setBtSendText] = useState('');
  const [foundDevices, setFoundDevices] = useState<BleDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const btDeviceRef = useRef<any>(null);
  const bleClientRef = useRef<any>(null);
  const [autoVibe, setAutoVibe] = useState(true);
  const [loraMode, setLoraMode] = useState<'bluetooth'|'wifi'>('wifi');
  const [loraHost, setLoraHost] = useState('192.168.0.1');
  const [loraPort, setLoraPort] = useState('4403');
  const [loraConnected, setLoraConnected] = useState(false);
  const [loraConnecting, setLoraConnecting] = useState(false);
  const [loraStatus, setLoraStatus] = useState('Not connected');
  const [loraMessages, setLoraMessages] = useState<MeshMessage[]>([]);
  const [loraSendText, setLoraSendText] = useState('');
  const loraWsRef = useRef<WebSocket | null>(null);

  const handleIncoming = (data: any, source: string) => {
    const msg: MeshMessage = { from: data.from||data.fromId||source, text: data.text||data.payload?.text||data.message||JSON.stringify(data), time: new Date().toLocaleTimeString(), rssi: data.rxRssi };
    if(source==='bt') setBtMessages(prev=>[msg,...prev].slice(0,50));
    else setLoraMessages(prev=>[msg,...prev].slice(0,50));
    if(autoVibe&&msg.text) setText(msg.text);
  };

  const startScan = async () => {
    setScanning(true); setFoundDevices([]); setBtStatus('Scanning for devices...');
    try {
      const { BleClient } = await import('@capacitor-community/bluetooth-le');
      bleClientRef.current = BleClient;
      await BleClient.initialize({ androidNeverForLocation: false });
      const seen = new Set<string>();
      await BleClient.requestLEScan({ allowDuplicates: false }, (result) => {
        if(result.device && !seen.has(result.device.deviceId)) {
          seen.add(result.device.deviceId);
          setFoundDevices(prev => [...prev, {
            deviceId: result.device.deviceId,
            name: result.device.name || 'Unknown Device',
            rssi: result.rssi
          }].slice(0, 20));
        }
      });
      setTimeout(async () => {
        try { await BleClient.stopLEScan(); } catch(e) {}
        setScanning(false);
        setBtStatus(seen.size > 0 ? 'Select a device below' : 'No devices found - try again');
      }, 8000);
    } catch(e: any) {
      setScanning(false); setBtStatus('Scan failed: ' + (e.message||'Unknown error'));
    }
  };

  const stopScan = async () => {
    try { if(bleClientRef.current) await bleClientRef.current.stopLEScan(); } catch(e) {}
    setScanning(false); setBtStatus('Scan stopped');
  };

  const connectToDevice = async (device: BleDevice) => {
    setBtConnecting(true); setBtStatus('Connecting to ' + device.name + '...');
    try {
      await bleClientRef.current.connect(device.deviceId, () => {
        setBtConnected(false); btDeviceRef.current = null; setBtStatus('Disconnected');
      });
      btDeviceRef.current = device;
      setBtConnected(true); setBtConnecting(false); setFoundDevices([]);
      setBtStatus('Connected to ' + device.name);
    } catch(e: any) {
      setBtConnecting(false); setBtStatus('Connect failed: ' + (e.message||'Unknown error'));
    }
  };

  const disconnectBitChat = async () => {
    try { if(bleClientRef.current&&btDeviceRef.current) await bleClientRef.current.disconnect(btDeviceRef.current.deviceId); } catch(e) {}
    setBtConnected(false); btDeviceRef.current = null; setBtStatus('Disconnected');
  };

  const sendBtMessage = () => {
    if(!btSendText.trim()) return;
    setBtMessages(prev=>[{from:'Me',text:btSendText,time:new Date().toLocaleTimeString()},...prev]);
    setBtSendText('');
  };

  const connectLora = () => {
    setLoraConnecting(true); setLoraStatus('Connecting...');
    try {
      const ws = new WebSocket('ws://'+loraHost+':'+loraPort);
      ws.onopen=()=>{ setLoraConnected(true); setLoraConnecting(false); setLoraStatus('Connected to '+loraHost); loraWsRef.current=ws; };
      ws.onmessage=(e)=>{ try { handleIncoming(JSON.parse(e.data),'lora'); } catch { handleIncoming({text:e.data},'lora'); } };
      ws.onclose=()=>{ setLoraConnected(false); setLoraStatus('Disconnected'); };
      ws.onerror=()=>{ setLoraConnected(false); setLoraConnecting(false); setLoraStatus('Connection failed'); };
    } catch(e) { setLoraConnecting(false); setLoraStatus('Error'); }
  };

  const sendLoraMessage = () => {
    if(!loraSendText.trim()) return;
    if(loraWsRef.current?.readyState===WebSocket.OPEN) loraWsRef.current.send(JSON.stringify({type:'sendText',text:loraSendText}));
    setLoraMessages(prev=>[{from:'Me',text:loraSendText,time:new Date().toLocaleTimeString()},...prev]);
    setLoraSendText('');
  };

  const msgList = (msgs: MeshMessage[]) => msgs.length>0 && (
    <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
      <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Messages</span>
      {msgs.map((msg,idx)=>(
        <div key={idx} className={`p-3 rounded-xl border ${msg.from==='Me'?'bg-vibe-primary/10 border-vibe-primary/20':'bg-white/5 border-white/5'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono text-vibe-primary/60">{msg.from}</span>
            <span className="text-[9px] font-mono text-white/20">{msg.time}{msg.rssi?' · '+msg.rssi+'dBm':''}</span>
          </div>
          <p className="text-sm">{msg.text}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex bg-vibe-surface/50 p-1 rounded-xl border border-white/5 gap-1">
        {(['remote','bitchat','lora'] as const).map(t=>(
          <button key={t} onClick={()=>setSubTab(t)} className={`flex-1 py-2 px-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${subTab===t?'bg-white/10 text-white':'text-white/40 hover:text-white/60'}`}>
            {t==='remote'?'Remote':t==='bitchat'?'BitChat':'LoRa'}
          </button>
        ))}
      </div>

      {subTab==='remote' && (
        <div className="flex flex-col gap-4">
          <div className="bg-vibe-surface border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${wsConnected?'bg-emerald-500/20 text-emerald-500':'bg-red-500/20 text-red-500'}`}><Globe className="w-8 h-8"/></div>
            <div><h3 className="font-bold text-lg">Remote Control</h3><p className="text-xs text-white/40 mt-1">Connect multiple devices over internet</p></div>
            <div className="w-full bg-black/20 rounded-xl p-4 border border-white/5">
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Room ID</p>
              <p className="text-3xl font-bold tracking-[0.2em] text-vibe-primary">{roomId}</p>
              <input type="text" placeholder="Type new Room ID + Enter" className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none text-white/60 uppercase" onKeyDown={e=>{if(e.key==='Enter'){const v=(e.target as HTMLInputElement).value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');if(v.length>0){setRoomId(v);localStorage.setItem('vibe_room_id',v);if(wsRef.current?.readyState===WebSocket.OPEN){wsRef.current.send(JSON.stringify({type:'join',roomId:v}));}}}}} />
            </div>
            <div className="w-full text-left">
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">Webhook URL</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-black/20 rounded-lg p-2 text-[10px] font-mono text-white/60 truncate border border-white/5">https://morse-vibe.onrender.com/api/webhook/{roomId}</div>
                <button onClick={copyWebhook} className="p-2 bg-vibe-primary rounded-lg">{copied?<Check className="w-4 h-4"/>:<Copy className="w-4 h-4"/>}</button>
              </div>
            </div>
          </div>
          {lastReceivedText && (<div style={{background:'#7c3aed',border:'2px solid white',borderRadius:'12px',padding:'20px'}}><p style={{color:'white',fontSize:'10px',fontFamily:'monospace',marginBottom:'8px'}}>MESSAGE RECEIVED</p><p style={{color:'white',fontSize:'18px',fontWeight:'bold',wordBreak:'break-all'}}>{lastReceivedText}</p><button onClick={()=>setLastReceivedText(null)} style={{color:'rgba(255,255,255,0.5)',fontSize:'11px',marginTop:'8px',background:'none',border:'none',cursor:'pointer'}}>dismiss</button></div>)}
          <ImageDecoder receivedText={lastReceivedText}/>
          <QRDecoder receivedText={lastReceivedText}/>
          <MorseDecoder receivedText={lastReceivedText}/>
        </div>
      )}

      {subTab==='bitchat' && (
        <div className="flex flex-col gap-4">
          <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Bluetooth className="w-4 h-4 text-blue-400"/>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">BitChat — Phone to Phone</span>
              <div className={`ml-auto w-2 h-2 rounded-full ${btConnected?'bg-emerald-500':scanning?'bg-blue-500 animate-pulse':'bg-red-500/50'}`}/>
            </div>
            <p className="text-[9px] font-mono text-white/25">Direct Bluetooth between phones. No internet needed. Range ~30m.</p>
            <p className="text-[10px] font-mono text-white/40">{btStatus}</p>
            {!btConnected && !scanning && (
              <button onClick={startScan} className="w-full py-3 bg-blue-600 rounded-xl text-white text-xs font-bold uppercase tracking-widest">Scan for Devices</button>
            )}
            {scanning && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"/>
                  <span className="text-[10px] font-mono text-blue-400">Scanning... ({foundDevices.length} found)</span>
                  <button onClick={stopScan} className="ml-auto text-[10px] font-mono text-white/40 border border-white/20 rounded px-2 py-1">Stop</button>
                </div>
              </div>
            )}
            {foundDevices.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Select Device to Connect</p>
                {foundDevices.map(d=>(
                  <button key={d.deviceId} onClick={()=>connectToDevice(d)} disabled={btConnecting} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-50">
                    <div className="flex items-center gap-2">
                      <Bluetooth className="w-4 h-4 text-blue-400"/>
                      <div className="text-left">
                        <p className="text-xs font-bold">{d.name}</p>
                        <p className="text-[9px] font-mono text-white/30">{d.deviceId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.rssi && <span className="text-[9px] font-mono text-white/30">{d.rssi}dBm</span>}
                      <span className="text-[9px] font-mono text-blue-400">{btConnecting?'Connecting...':'Connect'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {btConnected && (
              <button onClick={disconnectBitChat} className="w-full py-3 bg-white/10 rounded-xl text-white text-xs font-bold uppercase tracking-widest">Disconnect from {btDeviceRef.current?.name}</button>
            )}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <p className="text-xs font-bold">Auto Vibe Received</p>
              <button onClick={()=>setAutoVibe(!autoVibe)} className={`w-12 h-6 rounded-full relative ${autoVibe?'bg-vibe-primary':'bg-white/10'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${autoVibe?'left-7':'left-1'}`}/>
              </button>
            </div>
          </div>
          {btConnected && (
            <div className="flex gap-2">
              <input type="text" value={btSendText} onChange={e=>setBtSendText(e.target.value)} placeholder="Send via Bluetooth..." className="flex-1 bg-vibe-surface border border-white/10 rounded-xl px-4 py-3 text-sm font-mono placeholder:text-white/20 focus:outline-none" onKeyDown={e=>e.key==='Enter'&&sendBtMessage()}/>
              <button onClick={sendBtMessage} disabled={!btSendText.trim()} className="p-3 bg-vibe-primary rounded-xl disabled:opacity-30"><Send className="w-5 h-5"/></button>
            </div>
          )}
          {msgList(btMessages)}
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-1">How it works</p>
            <p className="text-[9px] text-white/20 leading-relaxed">Tap Scan, wait for nearby devices to appear, tap one to connect. Both phones need Morse Vibe open. Messages send via Bluetooth LE.</p>
          </div>
        </div>
      )}

      {subTab==='lora' && (
        <div className="flex flex-col gap-4">
          <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-green-400"/>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">LoRa / Meshtastic</span>
              <div className={`ml-auto w-2 h-2 rounded-full ${loraConnected?'bg-emerald-500':loraConnecting?'bg-amber-500 animate-pulse':'bg-red-500/50'}`}/>
            </div>
            <p className="text-[9px] font-mono text-white/25">Connect to Meshtastic LoRa hardware. Range several km, works off-grid.</p>
            <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
              <button onClick={()=>setLoraMode('wifi')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1 ${loraMode==='wifi'?'bg-white/10 text-white':'text-white/40'}`}><Wifi className="w-3 h-3"/>WiFi</button>
              <button onClick={()=>setLoraMode('bluetooth')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1 ${loraMode==='bluetooth'?'bg-white/10 text-white':'text-white/40'}`}><Bluetooth className="w-3 h-3"/>Bluetooth</button>
            </div>
            {loraMode==='wifi' && (
              <div className="flex flex-col gap-2">
                <input type="text" value={loraHost} onChange={e=>setLoraHost(e.target.value)} placeholder="Device IP (e.g. 192.168.0.1)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono placeholder:text-white/20 focus:outline-none"/>
                <input type="text" value={loraPort} onChange={e=>setLoraPort(e.target.value)} placeholder="Port (default 4403)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono placeholder:text-white/20 focus:outline-none"/>
              </div>
            )}
            <p className="text-[10px] font-mono text-white/30">{loraStatus}</p>
            {!loraConnected ? (
              <button onClick={connectLora} disabled={loraConnecting} className="w-full py-3 bg-green-700 rounded-xl text-white text-xs font-bold uppercase tracking-widest disabled:opacity-30">{loraConnecting?'Connecting...':'Connect to Meshtastic'}</button>
            ) : (
              <button onClick={()=>{loraWsRef.current?.close();setLoraConnected(false);setLoraStatus('Disconnected');}} className="w-full py-3 bg-white/10 rounded-xl text-white text-xs font-bold uppercase tracking-widest">Disconnect</button>
            )}
          </div>
          {loraConnected && (
            <div className="flex gap-2">
              <input type="text" value={loraSendText} onChange={e=>setLoraSendText(e.target.value)} placeholder="Send via LoRa..." className="flex-1 bg-vibe-surface border border-white/10 rounded-xl px-4 py-3 text-sm font-mono placeholder:text-white/20 focus:outline-none" onKeyDown={e=>e.key==='Enter'&&sendLoraMessage()}/>
              <button onClick={sendLoraMessage} disabled={!loraSendText.trim()} className="p-3 bg-vibe-primary rounded-xl disabled:opacity-30"><Send className="w-5 h-5"/></button>
            </div>
          )}
          {msgList(loraMessages)}
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-1">Compatible Hardware</p>
            <p className="text-[9px] text-white/20 leading-relaxed">TTGO T-Beam · Heltec WiFi LoRa 32 · RAK4631 · Any device running Meshtastic firmware</p>
          </div>
        </div>
      )}
    </div>
  );
}
