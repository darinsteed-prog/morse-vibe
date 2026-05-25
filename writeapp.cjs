const fs = require('fs');

const content = `import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Play, Square, Settings, History, Globe, Copy, Check, ChevronRight, Trash2, Plane } from 'lucide-react';
import { textToMorse, textToVibrationPattern, DEFAULT_SETTINGS, MORSE_TO_CHAR } from './constants';
import { KeyboardMode } from './components/KeyboardMode';
import { TelegraphMode } from './components/TelegraphMode';
import { ImageMode } from './components/ImageMode';
import { ImageDecoder } from './components/ImageDecoder';
import { QRMode } from './components/QRMode';
import { QRDecoder } from './components/QRDecoder';
import { MorseDecoder } from './components/MorseDecoder';
import { SoundMode } from './components/SoundMode';
import { FlashMode } from './components/FlashMode';
import { encrypt, decrypt, generateKey } from './crypto';

function ATCMode() {
  const [flights, setFlights] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [lastUpdated, setLastUpdated] = React.useState(null);
  const fetchFlights = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await window.Capacitor.Plugins.CapacitorHttp.get({ url: 'https://api.adsb.lol/v2/lat/53.3/lon/-6.3/dist/250' });
      const parsed = (data.ac || [])
        .filter(a => a.flight && !a.gnd)
        .map(a => ({
          icao: a.hex,
          callsign: (a.flight || '').trim(),
          altitude: a.alt_baro != null ? Math.round(a.alt_baro * 0.3048) : null,
          velocity: a.gs != null ? Math.round(a.gs) : null,
          heading: a.track != null ? Math.round(a.track) : null,
        }))
        .sort((a,b) => (b.altitude||0)-(a.altitude||0));
      setFlights(parsed); setLastUpdated(new Date().toLocaleTimeString());
    } catch(e) { setError(e.message); } finally { setLoading(false); }
  };
  React.useEffect(() => { fetchFlights(); }, []);
  const headingArrow = (h) => { if(h==null) return '?'; return ['N','NE','E','SE','S','SW','W','NW'][Math.round(h/45)%8]; };
  return (
    <div className="flex flex-col gap-3 flex-1">
      <div className="flex items-center justify-between">
        <div><p className="text-xs font-mono text-white/40 uppercase tracking-widest">Air Traffic</p>{lastUpdated && <p className="text-[10px] text-white/20 font-mono">Updated {lastUpdated}</p>}</div>
        <button onClick={fetchFlights} disabled={loading} className="px-3 py-1.5 bg-vibe-primary/20 border border-vibe-primary/40 rounded-lg text-xs font-bold text-vibe-primary uppercase tracking-widest disabled:opacity-40">{loading ? 'Loading...' : 'Refresh'}</button>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs text-red-400 font-mono">{error}</div>}
      {!loading && !error && flights.length === 0 && <div className="flex-1 flex items-center justify-center text-white/20 font-mono text-sm">No flights found</div>}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[60vh]">
        {flights.map(f => (
          <div key={f.icao} className="bg-vibe-surface border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-vibe-primary/10 flex items-center justify-center flex-shrink-0"><Plane className="w-4 h-4 text-vibe-primary" /></div>
            <div className="flex-1 min-w-0"><p className="font-bold text-sm tracking-widest truncate">{f.callsign}</p><p className="text-[10px] font-mono text-white/30">{f.icao}</p></div>
            <div className="text-right flex-shrink-0"><p className="text-xs font-mono text-white/70">{f.altitude!=null?f.altitude+' m':'---'}</p><p className="text-[10px] font-mono text-white/30">{f.velocity!=null?f.velocity+' kt':''}{f.heading!=null?' · '+headingArrow(f.heading):''}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [text, setText] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [currentMorse, setCurrentMorse] = useState('');
  const [history, setHistory] = useState(() => { const saved = localStorage.getItem('vibe_history'); return saved ? JSON.parse(saved) : []; });
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(() => { const saved = localStorage.getItem('vibe_settings'); if (saved) { const parsed = JSON.parse(saved); return { ...DEFAULT_SETTINGS, ...parsed, customPatterns: parsed.customPatterns || DEFAULT_SETTINGS.customPatterns }; } return DEFAULT_SETTINGS; });
  const [vibrationSupported, setVibrationSupported] = useState(true);
  const [inputMode, setInputMode] = useState('type');
  const [tapSequence, setTapSequence] = useState('');
  const [isVisualActive, setIsVisualActive] = useState(false);
  const [roomId, setRoomId] = useState(() => { const saved = localStorage.getItem('vibe_room_id'); if (saved) return saved; const newId = Math.random().toString(36).substring(2, 8).toUpperCase(); localStorage.setItem('vibe_room_id', newId); return newId; });
  const [wsConnected, setWsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastReceivedText, setLastReceivedText] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(() => localStorage.getItem('vibe_enc_key') || '');
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const wsRef = useRef(null);
  const transmissionRef = useRef(null);
  const isTapping = useRef(false);
  const tapDownTime = useRef(0);
  const letterTimeout = useRef(null);
  const wordTimeout = useRef(null);
  const visualIntervals = useRef([]);
  useEffect(() => { localStorage.setItem('vibe_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('vibe_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'; const socket = new WebSocket(protocol + '//' + window.location.host); socket.onopen = () => { setWsConnected(true); socket.send(JSON.stringify({ type: 'join', roomId })); }; socket.onmessage = (event) => { const data = JSON.parse(event.data); if (data.type === 'remote_vibe') { const decrypted = encryptionEnabled ? decrypt(data.text, encryptionKey) : data.text; setLastReceivedText(decrypted); handleRemoteVibe(decrypted); } }; socket.onclose = () => setWsConnected(false); wsRef.current = socket; return () => socket.close(); }, [roomId]);
  useEffect(() => { const fn = () => { if (document.visibilityState === 'hidden') clearInput(); }; document.addEventListener('visibilitychange', fn); if (typeof navigator !== 'undefined' && typeof navigator.vibrate !== 'function') setVibrationSupported(false); return () => { document.removeEventListener('visibilitychange', fn); if (letterTimeout.current) clearTimeout(letterTimeout.current); if (wordTimeout.current) clearTimeout(wordTimeout.current); if (transmissionRef.current) clearTimeout(transmissionRef.current); visualIntervals.current.forEach(id => clearTimeout(id)); vibrateSafe(0); }; }, []);
  const vibrateSafe = (pattern) => { if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') { try { if (pattern === 0) { navigator.vibrate(0); } else { navigator.vibrate(Array.isArray(pattern) ? pattern.slice(0, 99) : pattern); } } catch (e) { console.warn('Vibration error:', e); } } };
  const stopTransmission = () => { vibrateSafe(0); if (transmissionRef.current) clearTimeout(transmissionRef.current); visualIntervals.current.forEach(id => clearTimeout(id)); visualIntervals.current = []; setIsVisualActive(false); setIsTransmitting(false); };
  const clearInput = () => { setText(''); setTapSequence(''); if (letterTimeout.current) clearTimeout(letterTimeout.current); if (wordTimeout.current) clearTimeout(wordTimeout.current); if (isTapping.current) { isTapping.current = false; vibrateSafe(0); } stopTransmission(); };
  const switchMode = (mode: any) => { setInputMode(mode); setTapSequence(''); if (letterTimeout.current) clearTimeout(letterTimeout.current); if (wordTimeout.current) clearTimeout(wordTimeout.current); if (isTapping.current) { isTapping.current = false; vibrateSafe(0); } stopTransmission(); };
  const handleTransmit = () => { if (!text.trim()) return; const morse = textToMorse(text); if (!morse) return; const transmitText = encryptionEnabled ? encrypt(text, encryptionKey) : text; if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'vibe', text: transmitText })); setCurrentMorse(morse); setIsTransmitting(true); if (!history.includes(text)) setHistory(prev => [text, ...prev].slice(0, 10)); const pattern = textToVibrationPattern(text, settings); vibrateSafe(pattern); if (settings.visualFlash) { let elapsed = 0; pattern.forEach((duration, index) => { if (index % 2 === 0) { const startId = window.setTimeout(() => setIsVisualActive(true), elapsed); const endId = window.setTimeout(() => setIsVisualActive(false), elapsed + duration); visualIntervals.current.push(startId, endId); } elapsed += duration; }); } const totalDuration = pattern.reduce((a, b) => a + b, 0); transmissionRef.current = window.setTimeout(() => { setIsTransmitting(false); setIsVisualActive(false); }, totalDuration); };
  const handleRemoteVibe = (remoteText) => { if (isTransmitting) return; setIsTransmitting(true); const pattern = textToVibrationPattern(remoteText, settings); vibrateSafe(pattern); if (settings.visualFlash) { let elapsed = 0; pattern.forEach((duration, index) => { if (index % 2 === 0) { const startId = window.setTimeout(() => setIsVisualActive(true), elapsed); const endId = window.setTimeout(() => setIsVisualActive(false), elapsed + duration); visualIntervals.current.push(startId, endId); } elapsed += duration; }); } const totalDuration = pattern.reduce((a, b) => a + b, 0); transmissionRef.current = window.setTimeout(() => { setIsTransmitting(false); setIsVisualActive(false); }, totalDuration); };
  const copyWebhook = () => { navigator.clipboard.writeText(window.location.origin + '/api/webhook/' + roomId); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handlePointerDown = (e) => { if (!e.isPrimary) return; e.preventDefault(); if (isTapping.current) return; isTapping.current = true; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {} vibrateSafe(50); setIsVisualActive(true); tapDownTime.current = Date.now(); if (letterTimeout.current) clearTimeout(letterTimeout.current); if (wordTimeout.current) clearTimeout(wordTimeout.current); };
  const handlePointerUp = (e) => { if (!e.isPrimary) return; e.preventDefault(); if (!isTapping.current) return; isTapping.current = false; try { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {} setIsVisualActive(false); const duration = Date.now() - tapDownTime.current; const symbol = duration < (settings.dotDuration + settings.dashDuration) / 2 ? '.' : '-'; setTapSequence(prev => prev + symbol); if (letterTimeout.current) clearTimeout(letterTimeout.current); if (wordTimeout.current) clearTimeout(wordTimeout.current); letterTimeout.current = window.setTimeout(() => { setTapSequence(currentSeq => { if (currentSeq) { const char = MORSE_TO_CHAR[currentSeq]; if (char) setText(prevText => prevText + char); } return ''; }); wordTimeout.current = window.setTimeout(() => { setText(prevText => (!prevText.endsWith(' ') && prevText.length > 0) ? prevText + ' ' : prevText); }, settings.wordSpace - settings.letterSpace); }, settings.letterSpace); };
  const modes = ['type', 'tap', 'img', 'qr', 'sound', 'flash', 'remote', 'atc'];
  const modeLabels = { type: 'Keys', tap: 'Tap', img: 'Img', qr: 'QR', sound: 'Sound', flash: 'Flash', remote: 'Remote', atc: 'Air' };
  return (
    <div className={\`min-h-screen flex flex-col max-w-md mx-auto p-6 relative transition-colors duration-75 \${isVisualActive ? 'bg-vibe-primary/20' : 'bg-vibe-bg'}\`}>
      <header className='flex justify-between items-center mb-8'>
        <div className='flex items-center gap-2'>
          <div className='w-10 h-10 bg-vibe-primary rounded-lg flex items-center justify-center shadow-lg shadow-vibe-primary/20'><Zap className='text-white w-6 h-6' fill='currentColor' /></div>
          <div><h1 className='font-bold text-xl tracking-tight leading-none'>MORSE VIBE</h1><p className='text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1'>Tactile Transmitter</p></div>
        </div>
        <div className='flex gap-2'>
          <button onClick={() => setShowSettings(true)} className='p-2 rounded-full hover:bg-white/5 transition-colors'><Settings className='w-5 h-5 text-white/60' /></button>
          <button onClick={() => setShowHistory(true)} className='p-2 rounded-full hover:bg-white/5 transition-colors'><History className='w-5 h-5 text-white/60' /></button>
        </div>
      </header>
      <main className='flex-1 flex flex-col gap-4'>
        <div className='flex bg-vibe-surface/50 p-1 rounded-xl border border-white/5 overflow-x-auto gap-1'>
          {modes.map(mode => (<button key={mode} onClick={() => switchMode(mode)} className={\`py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap flex-shrink-0 \${inputMode === mode ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}\`}>{modeLabels[mode]}</button>))}
        </div>
        {inputMode === 'type' ? (<KeyboardMode text={text} setText={setText} isTransmitting={isTransmitting} clearInput={clearInput} />) : inputMode === 'tap' ? (<TelegraphMode text={text} tapSequence={tapSequence} isTransmitting={isTransmitting} handlePointerDown={handlePointerDown} handlePointerUp={handlePointerUp} clearInput={clearInput} />) : inputMode === 'img' ? (<ImageMode setText={setText} isTransmitting={isTransmitting} />) : inputMode === 'qr' ? (<QRMode setText={setText} isTransmitting={isTransmitting} />) : inputMode === 'sound' ? (<SoundMode text={text} isTransmitting={isTransmitting} />) : inputMode === 'flash' ? (<FlashMode text={text} isTransmitting={isTransmitting} />) : inputMode === 'atc' ? (<ATCMode />) : (
          <div className='flex flex-col gap-4 flex-1'>
            <div className='bg-vibe-surface border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center gap-4'>
              <div className={\`w-16 h-16 rounded-full flex items-center justify-center \${wsConnected ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}\`}><Globe className='w-8 h-8' /></div>
              <div><h3 className='font-bold text-lg'>Remote Control</h3><p className='text-xs text-white/40 mt-1'>Connect multiple devices</p></div>
              <div className='w-full bg-black/20 rounded-xl p-4 border border-white/5'><p className='text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1'>Room ID</p><p className='text-3xl font-bold tracking-[0.2em] text-vibe-primary'>{roomId}</p></div>
              <div className='w-full text-left'><p className='text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2'>Webhook URL</p><div className='flex gap-2'><div className='flex-1 bg-black/20 rounded-lg p-2 text-[10px] font-mono text-white/60 truncate border border-white/5'>{window.location.origin}/api/webhook/{roomId}</div><button onClick={copyWebhook} className='p-2 bg-vibe-primary rounded-lg'>{copied ? <Check className='w-4 h-4' /> : <Copy className='w-4 h-4' />}</button></div></div>
            </div>
            <ImageDecoder receivedText={lastReceivedText} />
            <QRDecoder receivedText={lastReceivedText} />
            <MorseDecoder receivedText={lastReceivedText} />
          </div>
        )}
        <AnimatePresence>{text && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className='bg-vibe-surface/50 border border-white/5 rounded-xl p-4'><span className='text-[10px] font-mono uppercase tracking-wider text-white/40'>Morse Translation</span><div className='font-mono text-lg break-all tracking-widest text-vibe-primary/80'>{textToMorse(text)}</div><MorseDecoder receivedText={textToMorse(text)} /></motion.div>)}</AnimatePresence>
      </main>
      <div className='mt-8 mb-4'><button onClick={isTransmitting ? stopTransmission : handleTransmit} disabled={!text.trim() && !isTransmitting} className={\`w-full py-6 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl \${isTransmitting ? 'bg-white text-vibe-bg' : 'bg-vibe-primary text-white disabled:opacity-30 disabled:grayscale'}\`}>{isTransmitting ? (<><Square className='w-6 h-6' fill='currentColor' /><span className='font-bold text-lg uppercase tracking-widest'>Stop Transmission</span></>) : (<><Play className='w-6 h-6' fill='currentColor' /><span className='font-bold text-lg uppercase tracking-widest'>Start Vibe</span></>)}</button></div>
      <footer className='mt-auto pt-8 text-center'><p className='text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]'>Optimised for Wearable Browsers</p></footer>
      <AnimatePresence>
        {showSettings && (<><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" /><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-vibe-surface border-t border-white/10 rounded-t-3xl p-6 z-50 max-h-[85vh] overflow-y-auto"><div className="flex justify-between items-center mb-6"><h2 className="font-bold text-lg uppercase tracking-widest">Signal Settings</h2><button onClick={() => setSettings(DEFAULT_SETTINGS)} className="text-[10px] font-mono text-white/40 px-3 py-1.5 rounded-full border border-white/10">Reset</button></div><div className="flex flex-col gap-6"><div className="flex items-center justify-between p-4 bg-white/5 rounded-xl"><div><p className="text-sm font-bold">Visual Flash</p></div><button onClick={() => setSettings({...settings, visualFlash: !settings.visualFlash})} className={settings.visualFlash ? "w-12 h-6 rounded-full bg-vibe-primary relative" : "w-12 h-6 rounded-full bg-white/10 relative"}><motion.div animate={{ x: settings.visualFlash ? 24 : 4 }} className="w-4 h-4 bg-white rounded-full absolute top-1" /></button></div><div className="flex flex-col gap-4"><h3 className="text-xs font-mono uppercase tracking-wider text-white/60">Encryption</h3><div className="flex items-center justify-between p-4 bg-white/5 rounded-xl"><div><p className="text-sm font-bold">AES-256 Encryption</p></div><button onClick={() => setEncryptionEnabled(!encryptionEnabled)} className={encryptionEnabled ? "w-12 h-6 rounded-full bg-vibe-primary relative" : "w-12 h-6 rounded-full bg-white/10 relative"}><motion.div animate={{ x: encryptionEnabled ? 24 : 4 }} className="w-4 h-4 bg-white rounded-full absolute top-1" /></button></div>{encryptionEnabled && (<div className="flex flex-col gap-2"><input type="text" value={encryptionKey} onChange={e => { setEncryptionKey(e.target.value); localStorage.setItem("vibe_enc_key", e.target.value); }} placeholder="Enter secret key..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none" /><button onClick={() => { const k = generateKey(); setEncryptionKey(k); localStorage.setItem("vibe_enc_key", k); }} className="w-full py-2 border border-dashed border-white/10 rounded-lg text-xs text-white/40">Generate Random Key</button></div>)}</div></div><button onClick={() => setShowSettings(false)} className="w-full mt-8 py-4 rounded-xl bg-white/10 text-white font-bold uppercase tracking-widest">Done</button></motion.div></>)}
      </AnimatePresence>
      <AnimatePresence>
        {showHistory && (<><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistory(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" /><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-vibe-surface border-t border-white/10 rounded-t-3xl p-6 z-50 max-h-[70vh] overflow-y-auto"><div className="flex justify-between items-center mb-6"><h2 className="font-bold text-lg uppercase tracking-widest">Recent</h2><button onClick={() => setHistory([])} className="p-2 text-white/40 hover:text-vibe-primary"><Trash2 className="w-5 h-5" /></button></div>{history.length === 0 ? (<div className="py-12 text-center text-white/20 font-mono text-sm">No history</div>) : (<div className="flex flex-col gap-3">{history.map((item, idx) => (<button key={idx} onClick={() => { setText(item); setShowHistory(false); }} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 text-left"><span className="font-medium truncate mr-4">{item}</span><ChevronRight className="w-4 h-4 text-white/20" /></button>))}</div>)}</motion.div></>)}
      </AnimatePresence>
    </div>
  );
}
`;

fs.writeFileSync('src/App.tsx', content);
console.log('Done!');
