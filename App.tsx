/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Play, Square, Settings, History, Smartphone,
  Info, ChevronRight, Trash2, Eye, EyeOff, Globe, Copy, Check
} from 'lucide-react';
import { textToMorse, textToVibrationPattern, DEFAULT_SETTINGS, MorseSettings, MORSE_TO_CHAR } from './constants';
import { KeyboardMode } from './components/KeyboardMode';
import { TelegraphMode } from './components/TelegraphMode';
import { ImageMode } from './components/ImageMode';
import { ImageDecoder } from './components/ImageDecoder';
import { QRMode } from './components/QRMode';
import { QRDecoder } from './components/QRDecoder';

function SettingSlider({ label, value, min, max, step, onChange }: { label: string, value: number, min: number, max: number, step: number, onChange: (val: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-mono uppercase tracking-wider text-white/60">{label}</label>
        <span className="text-xs font-mono text-vibe-primary">{value}ms</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary" />
    </div>
  );
}

export default function App() {
  const [text, setText] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [currentMorse, setCurrentMorse] = useState('');
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('vibe_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<MorseSettings>(() => {
    const saved = localStorage.getItem('vibe_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SETTINGS, ...parsed, customPatterns: parsed.customPatterns || DEFAULT_SETTINGS.customPatterns };
    }
    return DEFAULT_SETTINGS;
  });
  const [vibrationSupported, setVibrationSupported] = useState(true);
  const [inputMode, setInputMode] = useState<'type' | 'tap' | 'image' | 'qr' | 'remote'>('type');
  const [tapSequence, setTapSequence] = useState('');
  const [isVisualActive, setIsVisualActive] = useState(false);
  const [roomId, setRoomId] = useState(() => {
    const saved = localStorage.getItem('vibe_room_id');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('vibe_room_id', newId);
    return newId;
  });
  const [wsConnected, setWsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastReceivedText, setLastReceivedText] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const transmissionRef = useRef<number | null>(null);
  const isTapping = useRef(false);
  const tapDownTime = useRef<number>(0);
  const letterTimeout = useRef<number | null>(null);
  const wordTimeout = useRef<number | null>(null);
  const visualIntervals = useRef<number[]>([]);

  useEffect(() => { localStorage.setItem('vibe_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('vibe_history', JSON.stringify(history)); }, [history]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    socket.onopen = () => { setWsConnected(true); socket.send(JSON.stringify({ type: 'join', roomId })); };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'remote_vibe') { setLastReceivedText(data.text); handleRemoteVibe(data.text); }
    };
    socket.onclose = () => setWsConnected(false);
    wsRef.current = socket;
    return () => socket.close();
  }, [roomId]);

  useEffect(() => {
    const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') clearInput(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate !== 'function') setVibrationSupported(false);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (letterTimeout.current) clearTimeout(letterTimeout.current);
      if (wordTimeout.current) clearTimeout(wordTimeout.current);
      if (transmissionRef.current) clearTimeout(transmissionRef.current);
      visualIntervals.current.forEach(id => clearTimeout(id));
      vibrateSafe(0);
    };
  }, []);

  const vibrateSafe = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        if (pattern === 0) { navigator.vibrate(0); }
        else { navigator.vibrate(Array.isArray(pattern) ? pattern.slice(0, 99) : pattern); }
      } catch (e) { console.warn('Vibration error:', e); }
    }
  };

  const stopTransmission = () => {
    vibrateSafe(0);
    if (transmissionRef.current) clearTimeout(transmissionRef.current);
    visualIntervals.current.forEach(id => clearTimeout(id));
    visualIntervals.current = [];
    setIsVisualActive(false);
    setIsTransmitting(false);
  };

  const clearInput = () => {
    setText(''); setTapSequence('');
    if (letterTimeout.current) clearTimeout(letterTimeout.current);
    if (wordTimeout.current) clearTimeout(wordTimeout.current);
    if (isTapping.current) { isTapping.current = false; vibrateSafe(0); }
    stopTransmission();
  };

  const switchMode = (mode: 'type' | 'tap' | 'image' | 'qr' | 'remote') => {
    setInputMode(mode); setTapSequence('');
    if (letterTimeout.current) clearTimeout(letterTimeout.current);
    if (wordTimeout.current) clearTimeout(wordTimeout.current);
    if (isTapping.current) { isTapping.current = false; vibrateSafe(0); }
    stopTransmission();
  };

  const handleTransmit = () => {
    if (!text.trim()) return;
    const morse = textToMorse(text);
    if (!morse) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'vibe', text }));
    setCurrentMorse(morse);
    setIsTransmitting(true);
    if (!history.includes(text)) setHistory(prev => [text, ...prev].slice(0, 10));
    const pattern = textToVibrationPattern(text, settings);
    vibrateSafe(pattern);
    if (settings.visualFlash) {
      let elapsed = 0;
      pattern.forEach((duration, index) => {
        if (index % 2 === 0) {
          const startId = window.setTimeout(() => setIsVisualActive(true), elapsed);
          const endId = window.setTimeout(() => setIsVisualActive(false), elapsed + duration);
          visualIntervals.current.push(startId, endId);
        }
        elapsed += duration;
      });
    }
    const totalDuration = pattern.reduce((a, b) => a + b, 0);
    transmissionRef.current = window.setTimeout(() => { setIsTransmitting(false); setIsVisualActive(false); }, totalDuration);
  };

  const handleRemoteVibe = (remoteText: string) => {
    if (isTransmitting) return;
    setIsTransmitting(true);
    const pattern = textToVibrationPattern(remoteText, settings);
    vibrateSafe(pattern);
    if (settings.visualFlash) {
      let elapsed = 0;
      pattern.forEach((duration, index) => {
        if (index % 2 === 0) {
          const startId = window.setTimeout(() => setIsVisualActive(true), elapsed);
          const endId = window.setTimeout(() => setIsVisualActive(false), elapsed + duration);
          visualIntervals.current.push(startId, endId);
        }
        elapsed += duration;
      });
    }
    const totalDuration = pattern.reduce((a, b) => a + b, 0);
    transmissionRef.current = window.setTimeout(() => { setIsTransmitting(false); setIsVisualActive(false); }, totalDuration);
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(`${window.location.origin}/api/webhook/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    e.preventDefault();
    if (isTapping.current) return;
    isTapping.current = true;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    vibrateSafe(50);
    setIsVisualActive(true);
    tapDownTime.current = Date.now();
    if (letterTimeout.current) clearTimeout(letterTimeout.current);
    if (wordTimeout.current) clearTimeout(wordTimeout.current);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    e.preventDefault();
    if (!isTapping.current) return;
    isTapping.current = false;
    try { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
    setIsVisualActive(false);
    const duration = Date.now() - tapDownTime.current;
    const symbol = duration < (settings.dotDuration + settings.dashDuration) / 2 ? '.' : '-';
    setTapSequence(prev => prev + symbol);
    if (letterTimeout.current) clearTimeout(letterTimeout.current);
    if (wordTimeout.current) clearTimeout(wordTimeout.current);
    letterTimeout.current = window.setTimeout(() => {
      setTapSequence(currentSeq => {
        if (currentSeq) { const char = MORSE_TO_CHAR[currentSeq]; if (char) setText(prevText => prevText + char); }
        return '';
      });
      wordTimeout.current = window.setTimeout(() => {
        setText(prevText => (!prevText.endsWith(' ') && prevText.length > 0) ? prevText + ' ' : prevText);
      }, settings.wordSpace - settings.letterSpace);
    }, settings.letterSpace);
  };

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto p-6 relative transition-colors duration-75 ${isVisualActive ? 'bg-vibe-primary/20' : 'bg-vibe-bg'}`}>
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-vibe-primary rounded-lg flex items-center justify-center shadow-lg shadow-vibe-primary/20">
            <Zap className="text-white w-6 h-6" fill="currentColor" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight leading-none">MORSE VIBE</h1>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">Tactile Transmitter</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-white/5 transition-colors"><Settings className="w-5 h-5 text-white/60" /></button>
          <button onClick={() => setShowHistory(true)} className="p-2 rounded-full hover:bg-white/5 transition-colors"><History className="w-5 h-5 text-white/60" /></button>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-4">
        <div className="flex bg-vibe-surface/50 p-1 rounded-xl border border-white/5">
          {(['type','tap','image','qr','remote'] as const).map(mode => (
            <button key={mode} onClick={() => switchMode(mode)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${inputMode === mode ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
              {mode === 'type' ? 'Keys' : mode === 'tap' ? 'Tap' : mode === 'image' ? 'Img' : mode === 'qr' ? 'QR' : 'Remote'}
            </button>
          ))}
        </div>

        {inputMode === 'type' ? (
          <KeyboardMode text={text} setText={setText} isTransmitting={isTransmitting} clearInput={clearInput} />
        ) : inputMode === 'tap' ? (
          <TelegraphMode text={text} tapSequence={tapSequence} isTransmitting={isTransmitting} handlePointerDown={handlePointerDown} handlePointerUp={handlePointerUp} clearInput={clearInput} />
        ) : inputMode === 'image' ? (
          <ImageMode setText={setText} isTransmitting={isTransmitting} />
        ) : inputMode === 'qr' ? (
          <QRMode setText={setText} isTransmitting={isTransmitting} />
        ) : (
          <div className="flex flex-col gap-4 flex-1">
            <div className="bg-vibe-surface border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${wsConnected ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                <Globe className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Remote Control</h3>
                <p className="text-xs text-white/40 mt-1">Connect multiple devices or use BitChat</p>
              </div>
              <div className="w-full bg-black/20 rounded-xl p-4 border border-white/5">
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Room ID</p>
                <p className="text-3xl font-bold tracking-[0.2em] text-vibe-primary">{roomId}</p>
              </div>
              <div className="w-full text-left">
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">Webhook URL</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-black/20 rounded-lg p-2 text-[10px] font-mono text-white/60 truncate border border-white/5">{window.location.origin}/api/webhook/{roomId}</div>
                  <button onClick={copyWebhook} className="p-2 bg-vibe-primary rounded-lg hover:bg-vibe-primary/80 transition-colors">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-left w-full border border-white/5">
                <p className="text-xs font-bold mb-1">How to use:</p>
                <ol className="text-[10px] text-white/40 space-y-1 list-decimal list-inside">
                  <li>Open this app on your other device and join room <b>{roomId}</b></li>
                  <li>Transmit from this device via any mode</li>
                  <li>The other device vibrates and decodes instantly</li>
                </ol>
                <p className="text-[9px] text-vibe-primary/60 mt-3 italic leading-tight">Note: Some browsers require you to tap the screen once before allowing remote vibrations.</p>
              </div>
            </div>
            <ImageDecoder receivedText={lastReceivedText} />
            <QRDecoder receivedText={lastReceivedText} />
          </div>
        )}

        <AnimatePresence>
          {text && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="bg-vibe-surface/50 border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-white/40">
                <span className="text-[10px] font-mono uppercase tracking-wider">Morse Translation</span>
              </div>
              <div className="font-mono text-lg break-all tracking-widest text-vibe-primary/80">{textToMorse(text)}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {!vibrationSupported && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3 items-start">
            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/70 leading-relaxed">Vibration API not detected. This device might not support tactile feedback in the browser.</p>
          </div>
        )}
      </main>

      <div className="mt-8 mb-4">
        <button onClick={isTransmitting ? stopTransmission : handleTransmit} disabled={!text.trim() && !isTransmitting}
          className={`w-full py-6 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${isTransmitting ? 'bg-white text-vibe-bg' : 'bg-vibe-primary text-white disabled:opacity-30 disabled:grayscale'}`}>
          {isTransmitting ? (<><Square className="w-6 h-6" fill="currentColor" /><span className="font-bold text-lg uppercase tracking-widest">Stop Transmission</span></>) : (<><Play className="w-6 h-6" fill="currentColor" /><span className="font-bold text-lg uppercase tracking-widest">Start Vibe</span></>)}
        </button>
      </div>

      <AnimatePresence>
        {isTransmitting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
            <div className="w-64 h-64 rounded-full border-4 border-vibe-primary/20 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border-4 border-vibe-primary/40 flex items-center justify-center animate-vibe">
                <div className="w-32 h-32 rounded-full bg-vibe-primary flex items-center justify-center shadow-[0_0_50px_rgba(255,68,68,0.5)]">
                  <Smartphone className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-vibe-surface border-t border-white/10 rounded-t-3xl p-6 z-50 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg uppercase tracking-widest flex items-center gap-2"><Settings className="w-5 h-5" />Signal Settings</h2>
                <button onClick={() => setSettings(DEFAULT_SETTINGS)} className="text-[10px] font-mono text-white/40 hover:text-vibe-primary transition-colors uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/10">Reset Defaults</button>
              </div>
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    {settings.visualFlash ? <Eye className="w-5 h-5 text-vibe-primary" /> : <EyeOff className="w-5 h-5 text-white/40" />}
                    <div><p className="text-sm font-bold">Visual Flash</p><p className="text-[10px] text-white/40 uppercase font-mono">Sync screen with vibe</p></div>
                  </div>
                  <button onClick={() => setSettings({...settings, visualFlash: !settings.visualFlash})} className={`w-12 h-6 rounded-full transition-colors relative ${settings.visualFlash ? 'bg-vibe-primary' : 'bg-white/10'}`}>
                    <motion.div animate={{ x: settings.visualFlash ? 24 : 4 }} className="w-4 h-4 bg-white rounded-full absolute top-1" />
                  </button>
                </div>
                <div className="h-px bg-white/5" />
                <SettingSlider label="Dot Duration" value={settings.dotDuration} min={20} max={300} step={10} onChange={(v) => setSettings({...settings, dotDuration: v})} />
                <SettingSlider label="Dash Duration" value={settings.dashDuration} min={50} max={1000} step={10} onChange={(v) => setSettings({...settings, dashDuration: v})} />
                <SettingSlider label="Symbol Space" value={settings.symbolSpace} min={20} max={300} step={10} onChange={(v) => setSettings({...settings, symbolSpace: v})} />
                <SettingSlider label="Letter Space" value={settings.letterSpace} min={100} max={1000} step={10} onChange={(v) => setSettings({...settings, letterSpace: v})} />
                <SettingSlider label="Word Space" value={settings.wordSpace} min={200} max={2000} step={10} onChange={(v) => setSettings({...settings, wordSpace: v})} />
                <div className="h-px bg-white/5" />
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-white/60">Haptic Diagnostic</h3>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${vibrationSupported ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>{vibrationSupported ? 'API SUPPORTED' : 'API NOT SUPPORTED'}</span>
                  </div>
                  <button onClick={() => vibrateSafe([100, 50, 100])} disabled={!vibrationSupported} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30">Test Vibration Pattern</button>
                </div>
                <div className="h-px bg-white/5" />
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-white/60 mb-4">Custom Patterns</h3>
                  <div className="flex flex-col gap-3">
                    {(Object.entries(settings.customPatterns || {}) as [string, number[]][]).map(([key, pattern]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                        <div><p className="text-sm font-bold">{key}</p><p className="text-[10px] text-white/40 font-mono truncate max-w-[150px]">{pattern.join(', ')}</p></div>
                        <button onClick={() => { const np = {...settings.customPatterns}; delete np[key]; setSettings({...settings, customPatterns: np}); }} className="p-2 text-white/20 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button onClick={() => {
                      const key = window.prompt('Enter character or word:');
                      if (!key) return;
                      const patternStr = window.prompt('Enter vibration pattern (comma separated ms, e.g. 100,50,100):');
                      if (!patternStr) return;
                      const pattern = patternStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                      if (!pattern.length) return;
                      setSettings({...settings, customPatterns: {...settings.customPatterns, [key.toUpperCase()]: pattern}});
                    }} className="w-full py-3 border border-dashed border-white/10 rounded-lg text-xs text-white/40 hover:text-white/60 hover:border-white/20 transition-all">+ Add Custom Pattern</button>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full mt-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-widest transition-colors">Done</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistory(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-vibe-surface border-t border-white/10 rounded-t-3xl p-6 z-50 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg uppercase tracking-widest flex items-center gap-2"><History className="w-5 h-5" />Recent</h2>
                <button onClick={() => setHistory([])} className="p-2 text-white/40 hover:text-vibe-primary transition-colors"><Trash2 className="w-5 h-5" /></button>
              </div>
              {history.length === 0 ? (
                <div className="py-12 text-center text-white/20 font-mono text-sm">No transmission history</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {history.map((item, idx) => (
                    <button key={idx} onClick={() => { setText(item); setShowHistory(false); }} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left group">
                      <span className="font-medium truncate mr-4">{item}</span>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-vibe-primary transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className="mt-auto pt-8 text-center">
        <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">Optimized for Wearable Browsers</p>
      </footer>
    </div>
  );
}function SettingSlider({ label, value, min, max, step, onChange }: { label: string, value: number, min: number, max: number, step: number, onChange: (val: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-mono uppercase tracking-wider text-white/60">{label}</label>
        <span className="text-xs font-mono text-vibe-primary">{value}ms</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary" />
    </div>
  );
}

export default function App() {
  const [text, setText] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [currentMorse, setCurrentMorse] = useState('');
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('vibe_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<MorseSettings>(() => {
    const saved = localStorage.getItem('vibe_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SETTINGS, ...parsed, customPatterns: parsed.customPatterns || DEFAULT_SETTINGS.customPatterns };
    }
    return DEFAULT_SETTINGS;
  });
  const [vibrationSupported, setVibrationSupported] = useState(true);
  const [inputMode, setInputMode] = useState<'type' | 'tap' | 'image' | 'qr' | 'mesh' | 'remote'>('type');
  const [tapSequence, setTapSequence] = useState('');
  const [isVisualActive, setIsVisualActive] = useState(false);
  const [roomId, setRoomId] = useState(() => {
    const saved = localStorage.getItem('vibe_room_id');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('vibe_room_id', newId);
    return newId;
  });
  const [wsConnected, setWsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastReceivedText, setLastReceivedText] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState(() => localStorage.getItem('vibe_enc_key') || '');
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const transmissionRef = useRef<number | null>(null);
  const isTapping = useRef(false);
  const tapDownTime = useRef<number>(0);
  const letterTimeout = useRef<number | null>(null);
  const wordTimeout = useRef<number | null>(null);
  const visualIntervals = useRef<number[]>([]);

  useEffect(() => { localStorage.setItem('vibe_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('vibe_history', JSON.stringify(history)); }, [history]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    socket.onopen = () => { setWsConnected(true); socket.send(JSON.stringify({ type: 'join', roomId })); };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'remote_vibe') {
        const decrypted = encryptionEnabled ? decrypt(data.text, encryptionKey) : data.text;
        setLastReceivedText(decrypted);
        handleRemoteVibe(decrypted);
      }
    };
    socket.onclose = () => setWsConnected(false);
    wsRef.current = socket;
    return () => socket.close();
  }, [roomId]);

  useEffect(() => {
    const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') clearInput(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate !== 'function') setVibrationSupported(false);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (letterTimeout.current) clearTimeout(letterTimeout.current);
      if (wordTimeout.current) clearTimeout(wordTimeout.current);
      if (transmissionRef.current) clearTimeout(transmissionRef.current);
      visualIntervals.current.forEach(id => clearTimeout(id));
      vibrateSafe(0);
    };
  }, []);

  const vibrateSafe = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        if (pattern === 0) { navigator.vibrate(0); }
        else { navigator.vibrate(Array.isArray(pattern) ? pattern.slice(0, 99) : pattern); }
      } catch (e) { console.warn('Vibration error:', e); }
    }
  };

  const stopTransmission = () => {
    vibrateSafe(0);
    if (transmissionRef.current) clearTimeout(transmissionRef.current);
    visualIntervals.current.forEach(id => clearTimeout(id));
    visualIntervals.current = [];
    setIsVisualActive(false);
    setIsTransmitting(false);
  };

  const clearInput = () => {
    setText(''); setTapSequence('');
    if (letterTimeout.current) clearTimeout(letterTimeout.current);
    if (wordTimeout.current) clearTimeout(wordTimeout.current);
    if (isTapping.current) { isTapping.current = false; vibrateSafe(0); }
    stopTransmission();
  };

  const switchMode = (mode: 'type' | 'tap' | 'image' | 'qr' | 'mesh' | 'remote') => {
    setInputMode(mode); setTapSequence('');
    if (letterTimeout.current) clearTimeout(letterTimeout.current);
    if (wordTimeout.current) clearTimeout(wordTimeout.current);
    if (isTapping.current) { isTapping.current = false; vibrateSafe(0); }
    stopTransmission();
  };

  const handleTransmit = () => {
    if (!text.trim()) return;
    const morse = textToMorse(text);
    if (!morse) return;
    const transmitText = encryptionEnabled ? encrypt(text, encryptionKey) : text;
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'vibe', text: transmitText }));
    setCurrentMorse(morse);
    setIsTransmitting(true);
    if (!history.includes(text)) setHistory(prev => [text, ...prev].slice(0, 10));
    const pattern = textToVibrationPattern(text, settings);
    vibrateSafe(pattern);
    if (settings.visualFlash) {
      let elapsed = 0;
      pattern.forEach((duration, index) => {
        if (index % 2 === 0) {
          const startId = window.setTimeout(() => setIsVisualActive(true), elapsed);
          const endId = window.setTimeout(() => setIsVisualActive(false), elapsed + duration);
          visualIntervals.current.push(startId, endId);
        }
        elapsed += duration;
      });
    }
    const totalDuration = pattern.reduce((a, b) => a + b, 0);
    transmissionRef.current = window.setTimeout(() => { setIsTransmitting(false); setIsVisualActive(false); }, totalDuration);
  };

  const handleRemoteVibe = (remoteText: string) => {
    if (isTransmitting) return;
    setIsTransmitting(true);
    const pattern = textToVibrationPattern(remoteText, settings);
    vibrateSafe(pattern);
    if (settings.visualFlash) {
      let elapsed = 0;
      pattern.forEach((duration, index) => {
        if (index % 2 === 0) {
          const startId = window.setTimeout(() => setIsVisualActive(true), elapsed);
          const endId = window.setTimeout(() => setIsVisualActive(false), elapsed + duration);
          visualIntervals.current.push(startId, endId);
        }
        elapsed += duration;
      });
    }
    const totalDuration = pattern.reduce((a, b) => a + b, 0);
    transmissionRef.current = window.setTimeout(() => { setIsTransmitting(false); setIsVisualActive(false); }, totalDuration);
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(`${window.location.origin}/api/webhook/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    e.preventDefault();
    if (isTapping.current) return;
    isTapping.current = true;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    vibrateSafe(50);
    setIsVisualActive(true);
    tapDownTime.current = Date.now();
    if (letterTimeout.current) clearTimeout(letterTimeout.current);
    if (wordTimeout.current) clearTimeout(wordTimeout.current);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    e.preventDefault();
    if (!isTapping.current) return;
    isTapping.current = false;
    try { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
    setIsVisualActive(false);
    const duration = Date.now() - tapDownTime.current;
    const symbol = duration < (settings.dotDuration + settings.dashDuration) / 2 ? '.' : '-';
    setTapSequence(prev => prev + symbol);
    if (letterTimeout.current) clearTimeout(letterTimeout.current);
    if (wordTimeout.current) clearTimeout(wordTimeout.current);
    letterTimeout.current = window.setTimeout(() => {
      setTapSequence(currentSeq => {
        if (currentSeq) { const char = MORSE_TO_CHAR[currentSeq]; if (char) setText(prevText => prevText + char); }
        return '';
      });
      wordTimeout.current = window.setTimeout(() => {
        setText(prevText => (!prevText.endsWith(' ') && prevText.length > 0) ? prevText + ' ' : prevText);
      }, settings.wordSpace - settings.letterSpace);
    }, settings.letterSpace);
  };

  const modes = ['type', 'tap', 'image', 'qr', 'mesh', 'remote'] as const;
  const modeLabels: Record<string, string> = { type: 'Keys', tap: 'Tap', image: 'Img', qr: 'QR', mesh: 'Mesh', remote: 'Remote' };

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto p-6 relative transition-colors duration-75 ${isVisualActive ? 'bg-vibe-primary/20' : 'bg-vibe-bg'}`}>
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-vibe-primary rounded-lg flex items-center justify-center shadow-lg shadow-vibe-primary/20">
            <Zap className="text-white w-6 h-6" fill="currentColor" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight leading-none">MORSE VIBE</h1>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">Tactile Transmitter</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-white/5 transition-colors"><Settings className="w-5 h-5 text-white/60" /></button>
          <button onClick={() => setShowHistory(true)} className="p-2 rounded-full hover:bg-white/5 transition-colors"><History className="w-5 h-5 text-white/60" /></button>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-4">
        <div className="flex bg-vibe-surface/50 p-1 rounded-xl border border-white/5 overflow-x-auto">
          {modes.map(mode => (
            <button key={mode} onClick={() => switchMode(mode)}
              className={`flex-1 py-2 px-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${inputMode === mode ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
              {modeLabels[mode]}
            </button>
          ))}
        </div>

        {inputMode === 'type' ? (
          <KeyboardMode text={text} setText={setText} isTransmitting={isTransmitting} clearInput={clearInput} />
        ) : inputMode === 'tap' ? (
          <TelegraphMode text={text} tapSequence={tapSequence} isTransmitting={isTransmitting} handlePointerDown={handlePointerDown} handlePointerUp={handlePointerUp} clearInput={clearInput} />
        ) : inputMode === 'image' ? (
          <ImageMode setText={setText} isTransmitting={isTransmitting} />
        ) : inputMode === 'qr' ? (
          <QRMode setText={setText} isTransmitting={isTransmitting} />
        ) : inputMode === 'mesh' ? (
          <MeshMode setText={setText} isTransmitting={isTransmitting} vibrateSafe={vibrateSafe} />
        ) : (
          <div className="flex flex-col gap-4 flex-1">
            <div className="bg-vibe-surface border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${wsConnected ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                <Globe className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Remote Control</h3>
                <p className="text-xs text-white/40 mt-1">Connect multiple devices or use BitChat</p>
              </div>
              <div className="w-full bg-black/20 rounded-xl p-4 border border-white/5">
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Room ID</p>
                <p className="text-3xl font-bold tracking-[0.2em] text-vibe-primary">{roomId}</p>
              </div>
              <div className="w-full text-left">
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">Webhook URL</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-black/20 rounded-lg p-2 text-[10px] font-mono text-white/60 truncate border border-white/5">{window.location.origin}/api/webhook/{roomId}</div>
                  <button onClick={copyWebhook} className="p-2 bg-vibe-primary rounded-lg hover:bg-vibe-primary/80 transition-colors">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-left w-full border border-white/5">
                <p className="text-xs font-bold mb-1">How to use:</p>
                <ol className="text-[10px] text-white/40 space-y-1 list-decimal list-inside">
                  <li>Open this app on your other device and join room <b>{roomId}</b></li>
                  <li>Transmit from this device via any mode</li>
                  <li>The other device vibrates and decodes instantly</li>
                </ol>
                <p className="text-[9px] text-vibe-primary/60 mt-3 italic leading-tight">Note: Some browsers require you to tap the screen once before allowing remote vibrations.</p>
              </div>
            </div>
            <ImageDecoder receivedText={lastReceivedText} />
            <QRDecoder receivedText={lastReceivedText} />
          </div>
        )}

        <AnimatePresence>
          {text && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="bg-vibe-surface/50 border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-white/40">
                <span className="text-[10px] font-mono uppercase tracking-wider">Morse Translation</span>
              </div>
              <div className="font-mono text-lg break-all tracking-widest text-vibe-primary/80">{textToMorse(text)}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {!vibrationSupported && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3 items-start">
            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/70 leading-relaxed">Vibration API not detected.</p>
          </div>
        )}
      </main>

      <div className="mt-8 mb-4">
        <button onClick={isTransmitting ? stopTransmission : handleTransmit} disabled={!text.trim() && !isTransmitting}
          className={`w-full py-6 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${isTransmitting ? 'bg-white text-vibe-bg' : 'bg-vibe-primary text-white disabled:opacity-30 disabled:grayscale'}`}>
          {isTransmitting ? (<><Square className="w-6 h-6" fill="currentColor" /><span className="font-bold text-lg uppercase tracking-widest">Stop Transmission</span></>) : (<><Play className="w-6 h-6" fill="currentColor" /><span className="font-bold text-lg uppercase tracking-widest">Start Vibe</span></>)}
        </button>
      </div>

      <AnimatePresence>
        {isTransmitting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
            <div className="w-64 h-64 rounded-full border-4 border-vibe-primary/20 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border-4 border-vibe-primary/40 flex items-center justify-center animate-vibe">
                <div className="w-32 h-32 rounded-full bg-vibe-primary flex items-center justify-center shadow-[0_0_50px_rgba(255,68,68,0.5)]">
                  <Smartphone className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-vibe-surface border-t border-white/10 rounded-t-3xl p-6 z-50 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg uppercase tracking-widest flex items-center gap-2"><Settings className="w-5 h-5" />Signal Settings</h2>
                <button onClick={() => setSettings(DEFAULT_SETTINGS)} className="text-[10px] font-mono text-white/40 hover:text-vibe-primary transition-colors uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/10">Reset Defaults</button>
              </div>
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    {settings.visualFlash ? <Eye className="w-5 h-5 text-vibe-primary" /> : <EyeOff className="w-5 h-5 text-white/40" />}
                    <div><p className="text-sm font-bold">Visual Flash</p><p className="text-[10px] text-white/40 uppercase font-mono">Sync screen with vibe</p></div>
                  </div>
                  <button onClick={() => setSettings({...settings, visualFlash: !settings.visualFlash})} className={`w-12 h-6 rounded-full transition-colors relative ${settings.visualFlash ? 'bg-vibe-primary' : 'bg-white/10'}`}>
                    <motion.div animate={{ x: settings.visualFlash ? 24 : 4 }} className="w-4 h-4 bg-white rounded-full absolute top-1" />
                  </button>
                </div>
                <div className="h-px bg-white/5" />
                <SettingSlider label="Dot Duration" value={settings.dotDuration} min={20} max={300} step={10} onChange={(v) => setSettings({...settings, dotDuration: v})} />
                <SettingSlider label="Dash Duration" value={settings.dashDuration} min={50} max={1000} step={10} onChange={(v) => setSettings({...settings, dashDuration: v})} />
                <SettingSlider label="Symbol Space" value={settings.symbolSpace} min={20} max={300} step={10} onChange={(v) => setSettings({...settings, symbolSpace: v})} />
                <SettingSlider label="Letter Space" value={settings.letterSpace} min={100} max={1000} step={10} onChange={(v) => setSettings({...settings, letterSpace: v})} />
                <SettingSlider label="Word Space" value={settings.wordSpace} min={200} max={2000} step={10} onChange={(v) => setSettings({...settings, wordSpace: v})} />
                <div className="h-px bg-white/5" />
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-white/60">Haptic Diagnostic</h3>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${vibrationSupported ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>{vibrationSupported ? 'API SUPPORTED' : 'API NOT SUPPORTED'}</span>
                  </div>
                  <button onClick={() => vibrateSafe([100, 50, 100])} disabled={!vibrationSupported} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30">Test Vibration Pattern</button>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-white/60">Encryption</h3>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <p className="text-sm font-bold">AES-256 Encryption</p>
                      <p className="text-[10px] text-white/40 uppercase font-mono">End to end encrypted</p>
                    </div>
                    <button onClick={() => setEncryptionEnabled(!encryptionEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${encryptionEnabled ? 'bg-vibe-primary' : 'bg-white/10'}`}>
                      <motion.div animate={{ x: encryptionEnabled ? 24 : 4 }} className="w-4 h-4 bg-white rounded-full absolute top-1" />
                    </button>
                  </div>
                  {encryptionEnabled && (
                    <div className="flex flex-col gap-2">
                      <input type="text" value={encryptionKey} onChange={e => { setEncryptionKey(e.target.value); localStorage.setItem('vibe_enc_key', e.target.value); }} placeholder="Enter secret key..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono placeholder:text-white/20 focus:outline-none" />
                      <button onClick={() => { const k = generateKey(); setEncryptionKey(k); localStorage.setItem('vibe_enc_key', k); }} className="w-full py-2 border border-dashed border-white/10 rounded-lg text-xs text-white/40 hover:text-white/60 transition-all">Generate Random Key</button>
                      <p className="text-[9px] text-white/20 leading-relaxed">Both devices must use the same key. Share the key securely before communicating.</p>
                    </div>
                  )}
                </div>
                <div className="h-px bg-white/5" />
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-white/60 mb-4">Custom Patterns</h3>
                  <div className="flex flex-col gap-3">
                    {(Object.entries(settings.customPatterns || {}) as [string, number[]][]).map(([key, pattern]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                        <div><p className="text-sm font-bold">{key}</p><p className="text-[10px] text-white/40 font-mono truncate max-w-[150px]">{pattern.join(', ')}</p></div>
                        <button onClick={() => { const np = {...settings.customPatterns}; delete np[key]; setSettings({...settings, customPatterns: np}); }} className="p-2 text-white/20 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button onClick={() => {
                      const key = window.prompt('Enter character or word:');
                      if (!key) return;
                      const patternStr = window.prompt('Enter vibration pattern (comma separated ms, e.g. 100,50,100):');
                      if (!patternStr) return;
                      const pattern = patternStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                      if (!pattern.length) return;
                      setSettings({...settings, customPatterns: {...settings.customPatterns, [key.toUpperCase()]: pattern}});
                    }} className="w-full py-3 border border-dashed border-white/10 rounded-lg text-xs text-white/40 hover:text-white/60 hover:border-white/20 transition-all">+ Add Custom Pattern</button>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full mt-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-widest transition-colors">Done</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistory(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-vibe-surface border-t border-white/10 rounded-t-3xl p-6 z-50 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg uppercase tracking-widest flex items-center gap-2"><History className="w-5 h-5" />Recent</h2>
                <button onClick={() => setHistory([])} className="p-2 text-white/40 hover:text-vibe-primary transition-colors"><Trash2 className="w-5 h-5" /></button>
              </div>
              {history.length === 0 ? (
                <div className="py-12 text-center text-white/20 font-mono text-sm">No transmission history</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {history.map((item, idx) => (
                    <button key={idx} onClick={() => { setText(item); setShowHistory(false); }} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left group">
                      <span className="font-medium truncate mr-4">{item}</span>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-vibe-primary transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className="mt-auto pt-8 text-center">
        <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">Optimized for Wearable Browsers</p>
      </footer>
    </div>
  );
}