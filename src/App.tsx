/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap, Play, Square, Settings, History, Smartphone,
  Info, ChevronRight, Trash2, Eye, EyeOff, Globe,
  Copy, Check, Wifi, WifiOff, AlertTriangle, Plus, X,
} from 'lucide-react';
import {
  textToMorse, textToVibrationPattern,
  DEFAULT_SETTINGS, MorseSettings, MORSE_TO_CHAR,
} from './constants';
import { KeyboardMode } from './components/KeyboardMode';
import { TelegraphMode } from './components/TelegraphMode';
import {
  vibratePattern, vibrateTap, vibrateStop,
  vibrateSuccess, hapticsSupported, isNative,
} from './haptics';

// ── Helpers ────────────────────────────────────────────────────────────────

function SettingSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-mono uppercase tracking-wider text-white/50">{label}</label>
        <span className="text-xs font-mono text-vibe-primary tabular-nums">{value}ms</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="w-full cursor-pointer" />
    </div>
  );
}

function MorseDisplay({ text }: { text: string }) {
  const morse = textToMorse(text);
  if (!morse) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
      className="bg-vibe-surface/60 border border-white/6 rounded-xl px-4 py-3 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vibe-primary/30 to-transparent" />
      <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest block mb-1.5">Morse</span>
      <p className="font-mono text-base break-all tracking-widest text-vibe-primary/70 leading-relaxed">{morse}</p>
    </motion.div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [text, setText] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [history, setHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('vibe_history') ?? '[]'); } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<MorseSettings>(() => {
    try {
      const saved = localStorage.getItem('vibe_settings');
      if (saved) {
        const p = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...p, customPatterns: p.customPatterns ?? DEFAULT_SETTINGS.customPatterns };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });
  const [vibrationSupported] = useState(hapticsSupported);
  const [inputMode, setInputMode] = useState<'type' | 'tap' | 'remote'>('type');
  const [tapSequence, setTapSequence] = useState('');
  const [isVisualActive, setIsVisualActive] = useState(false);
  const [truncationWarning, setTruncationWarning] = useState(false);

  // Remote / WebSocket
  const [roomId] = useState(() => {
    const saved = localStorage.getItem('vibe_room_id');
    if (saved) return saved;
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('vibe_room_id', id);
    return id;
  });
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [copied, setCopied] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Custom pattern form
  const [showAddPattern, setShowAddPattern] = useState(false);
  const [newPatternKey, setNewPatternKey] = useState('');
  const [newPatternVal, setNewPatternVal] = useState('');
  const [patternError, setPatternError] = useState('');

  // Refs
  const stopPatternRef = useRef<(() => void) | null>(null);
  const transmissionRef = useRef<number | null>(null);
  const isTapping = useRef(false);
  const tapDownTime = useRef(0);
  const letterTimeout = useRef<number | null>(null);
  const wordTimeout = useRef<number | null>(null);
  const visualIntervals = useRef<number[]>([]);

  // ── Persist settings / history ──

  useEffect(() => {
    try { localStorage.setItem('vibe_settings', JSON.stringify(settings)); } catch {}
  }, [settings]);

  useEffect(() => {
    try { localStorage.setItem('vibe_history', JSON.stringify(history)); } catch {}
  }, [history]);

  // ── WebSocket ──

  useEffect(() => {
    let socket: WebSocket;
    let reconnectTimer: number;

    const connect = () => {
      setWsStatus('connecting');
      try {
        // On native, connect to your deployed server URL.
        // On web dev, connect to the same host (proxied by Vite).
        const serverUrl = import.meta.env.VITE_SERVER_URL;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = serverUrl
          ? serverUrl.replace(/^http/, 'ws')
          : `${protocol}//${window.location.host}`;

        socket = new WebSocket(url);
        socket.onopen = () => {
          setWsStatus('connected');
          socket.send(JSON.stringify({ type: 'join', roomId }));
        };
        socket.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'remote_vibe') handleRemoteVibe(data.text);
          } catch {}
        };
        socket.onclose = () => {
          setWsStatus('disconnected');
          reconnectTimer = window.setTimeout(connect, 3000);
        };
        socket.onerror = () => setWsStatus('disconnected');
        wsRef.current = socket;
      } catch {
        setWsStatus('disconnected');
        reconnectTimer = window.setTimeout(connect, 3000);
      }
    };

    connect();
    return () => { clearTimeout(reconnectTimer); socket?.close(); };
  }, [roomId]);

  useEffect(() => {
    const handleVisibility = () => { if (document.visibilityState === 'hidden') clearInput(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (letterTimeout.current) clearTimeout(letterTimeout.current);
      if (wordTimeout.current) clearTimeout(wordTimeout.current);
      if (transmissionRef.current) clearTimeout(transmissionRef.current);
      visualIntervals.current.forEach(clearTimeout);
      vibrateStop();
    };
  }, []);

  // ── Visual flash helper ──

  const runVisualFlash = (pattern: number[]) => {
    if (!settings.visualFlash) return;
    let elapsed = 0;
    pattern.forEach((duration, index) => {
      if (index % 2 === 0) {
        const onId = window.setTimeout(() => setIsVisualActive(true), elapsed);
        const offId = window.setTimeout(() => setIsVisualActive(false), elapsed + duration);
        visualIntervals.current.push(onId, offId);
      }
      elapsed += duration;
    });
  };

  // ── Stop ──

  const stopTransmission = () => {
    stopPatternRef.current?.();
    stopPatternRef.current = null;
    vibrateStop();
    if (transmissionRef.current) clearTimeout(transmissionRef.current);
    visualIntervals.current.forEach(clearTimeout);
    visualIntervals.current = [];
    setIsVisualActive(false);
    setIsTransmitting(false);
  };

  const clearInput = () => {
    setText('');
    setTapSequence('');
    setTruncationWarning(false);
    if (letterTimeout.current) clearTimeout(letterTimeout.current);
    if (wordTimeout.current) clearTimeout(wordTimeout.current);
    if (isTapping.current) { isTapping.current = false; vibrateStop(); }
    stopTransmission();
  };

  const switchMode = (mode: 'type' | 'tap' | 'remote') => {
    setInputMode(mode);
    clearInput();
  };

  // ── Transmit ──

  const runTransmission = async (sourceText: string) => {
    const pattern = textToVibrationPattern(sourceText, settings);

    // Warn if pattern was truncated (web only — native handles any length)
    if (!isNative && pattern.length > 99) setTruncationWarning(true);

    setIsTransmitting(true);
    runVisualFlash(pattern);

    const cancel = await vibratePattern(pattern);
    stopPatternRef.current = cancel;

    const total = pattern.reduce((a, b) => a + b, 0);
    transmissionRef.current = window.setTimeout(async () => {
      setIsTransmitting(false);
      setIsVisualActive(false);
      stopPatternRef.current = null;
      await vibrateSuccess();
    }, total);
  };

  const handleTransmit = () => {
    if (!text.trim()) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'vibe', text }));
    }
    if (!history.includes(text)) {
      setHistory((prev) => [text, ...prev].slice(0, 15));
    }
    runTransmission(text);
  };

  const handleRemoteVibe = (remoteText: string) => {
    if (isTransmitting) return;
    runTransmission(remoteText);
  };

  // ── Telegraph tap handlers ──

  const handlePointerDown = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    e.preventDefault();
    if (isTapping.current) return;
    isTapping.current = true;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    await vibrateTap();
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
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId))
        e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setIsVisualActive(false);

    const duration = Date.now() - tapDownTime.current;
    const threshold = (settings.dotDuration + settings.dashDuration) / 2;
    setTapSequence((prev) => prev + (duration < threshold ? '.' : '-'));

    if (letterTimeout.current) clearTimeout(letterTimeout.current);
    if (wordTimeout.current) clearTimeout(wordTimeout.current);

    letterTimeout.current = window.setTimeout(() => {
      setTapSequence((seq) => {
        if (seq) {
          const char = MORSE_TO_CHAR[seq];
          if (char) setText((t) => t + char);
        }
        return '';
      });
      wordTimeout.current = window.setTimeout(() => {
        setText((t) => (!t.endsWith(' ') && t.length > 0 ? t + ' ' : t));
      }, settings.wordSpace - settings.letterSpace);
    }, settings.letterSpace);
  };

  // ── Custom pattern helpers ──

  const handleAddPattern = () => {
    setPatternError('');
    if (!newPatternKey.trim()) { setPatternError('Enter a character or word.'); return; }
    const nums = newPatternVal.split(',').map((n) => parseInt(n.trim())).filter((n) => !isNaN(n) && n > 0);
    if (nums.length === 0) { setPatternError('Enter comma-separated ms values, e.g. 100,50,200'); return; }
    setSettings((s) => ({
      ...s,
      customPatterns: { ...s.customPatterns, [newPatternKey.trim().toUpperCase()]: nums },
    }));
    setNewPatternKey('');
    setNewPatternVal('');
    setShowAddPattern(false);
  };

  const copyWebhook = () => {
    const serverUrl = import.meta.env.VITE_SERVER_URL ?? window.location.origin;
    navigator.clipboard.writeText(`${serverUrl}/api/webhook/${roomId}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Render ──

  const wsConnected = wsStatus === 'connected';

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto px-5 pb-8 pt-6 relative transition-colors duration-75 ${isVisualActive ? 'bg-vibe-primary/10' : 'bg-vibe-bg'}`}
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>

      {/* Background dot grid */}
      <div className="fixed inset-0 dot-bg pointer-events-none opacity-50" />

      {/* ── Header ── */}
      <header className="flex justify-between items-center mb-7 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-vibe-primary rounded-xl flex items-center justify-center shadow-lg shadow-vibe-primary/25">
            <Zap className="text-white w-5 h-5" fill="currentColor" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight leading-none">MORSE VIBE</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {wsStatus === 'connected'
                ? <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                : wsStatus === 'connecting'
                ? <Wifi className="w-2.5 h-2.5 text-amber-400 animate-status" />
                : <WifiOff className="w-2.5 h-2.5 text-red-400" />}
              <span className={`text-[9px] font-mono uppercase tracking-widest ${
                wsStatus === 'connected' ? 'text-emerald-400' :
                wsStatus === 'connecting' ? 'text-amber-400' : 'text-red-400'}`}>
                {wsStatus === 'connected' ? (isNative ? 'Native · Live' : 'Live') :
                 wsStatus === 'connecting' ? 'Connecting…' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowHistory(true)} className="p-2.5 rounded-xl hover:bg-white/5 transition-colors relative">
            <History className="w-5 h-5 text-white/50" />
            {history.length > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-vibe-primary" />}
          </button>
          <button onClick={() => setShowSettings(true)} className="p-2.5 rounded-xl hover:bg-white/5 transition-colors">
            <Settings className="w-5 h-5 text-white/50" />
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col gap-3 relative z-10">
        {/* Mode tabs */}
        <div className="grid grid-cols-3 bg-vibe-surface/70 p-1 rounded-xl border border-white/6 gap-1">
          {(['type', 'tap', 'remote'] as const).map((mode) => (
            <button key={mode} onClick={() => switchMode(mode)}
              className={`py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${
                inputMode === mode ? 'bg-vibe-primary text-white shadow-lg shadow-vibe-primary/30' : 'text-white/35 hover:text-white/60'}`}>
              {mode === 'type' ? 'Keys' : mode === 'tap' ? 'Tap' : 'Remote'}
            </button>
          ))}
        </div>

        {inputMode === 'type' && (
          <KeyboardMode text={text} setText={setText} isTransmitting={isTransmitting} clearInput={clearInput} />
        )}
        {inputMode === 'tap' && (
          <TelegraphMode text={text} tapSequence={tapSequence} isTransmitting={isTransmitting}
            handlePointerDown={handlePointerDown} handlePointerUp={handlePointerUp} clearInput={clearInput} />
        )}
        {inputMode === 'remote' && (
          <div className="flex flex-col gap-3 flex-1">
            <div className="bg-vibe-surface border border-white/8 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vibe-primary/40 to-transparent" />
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${wsConnected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Remote Control</h3>
                  <p className="text-[10px] text-white/35 font-mono mt-0.5">Sync across devices via WebSocket</p>
                </div>
              </div>
              <div className="bg-black/25 rounded-xl p-4 border border-white/5 mb-4 text-center">
                <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">Room ID</p>
                <p className="text-3xl font-bold tracking-[0.25em] text-vibe-primary font-mono">{roomId}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Webhook URL</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-black/20 rounded-lg px-3 py-2 text-[10px] font-mono text-white/50 truncate border border-white/5">
                    {(import.meta.env.VITE_SERVER_URL ?? window.location.origin)}/api/webhook/{roomId}
                  </div>
                  <button onClick={copyWebhook}
                    className={`px-3 rounded-lg transition-all text-white ${copied ? 'bg-emerald-600' : 'bg-vibe-primary hover:bg-vibe-primary/80'}`}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-vibe-surface/50 border border-white/5 rounded-xl p-4">
              <p className="text-xs font-semibold mb-2 text-white/60">How to sync</p>
              <ol className="space-y-1.5">
                {[`Open this app on your other device and join room ${roomId}`,
                  'Transmit from this device via Keys or Tap mode',
                  'The other device vibrates the Morse code instantly'].map((step, i) => (
                  <li key={i} className="flex gap-2 text-[11px] text-white/35 leading-relaxed">
                    <span className="font-mono text-vibe-primary/60 shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        <AnimatePresence>{text && <MorseDisplay text={text} />}</AnimatePresence>

        {/* Warnings */}
        <AnimatePresence>
          {truncationWarning && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-200/70 leading-relaxed">
                Message too long — vibration truncated. Try a shorter message.
              </p>
            </motion.div>
          )}
          {!vibrationSupported && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-start gap-2.5 bg-white/5 border border-white/8 rounded-xl p-3">
              <Info className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
              <p className="text-[11px] text-white/40 leading-relaxed">
                Haptics not available in this browser. Install the app for native vibration.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Transmit button ── */}
      <div className="mt-5 relative z-10">
        <button
          onClick={isTransmitting ? stopTransmission : handleTransmit}
          disabled={!text.trim() && !isTransmitting}
          className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl font-bold text-base uppercase tracking-widest ${
            isTransmitting ? 'bg-white text-vibe-bg animate-glow'
            : 'bg-vibe-primary text-white disabled:opacity-25 disabled:grayscale disabled:cursor-not-allowed shadow-vibe-primary/30'}`}>
          {isTransmitting
            ? <><Square className="w-5 h-5" fill="currentColor" /> Stop</>
            : <><Play className="w-5 h-5" fill="currentColor" /> Transmit</>}
        </button>
      </div>

      {/* ── Transmission overlay ── */}
      <AnimatePresence>
        {isTransmitting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-48 h-48 rounded-full border border-vibe-primary/20 animate-ring" />
              <div className="absolute w-36 h-36 rounded-full border border-vibe-primary/30 animate-ring" style={{ animationDelay: '0.4s' }} />
              <div className="w-24 h-24 rounded-full bg-vibe-primary flex items-center justify-center shadow-[0_0_60px_rgba(255,59,59,0.5)] animate-vibe">
                <Smartphone className="w-10 h-10 text-white" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Settings drawer ── */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 bg-vibe-surface border-t border-white/8 rounded-t-3xl p-6 z-50 max-h-[88vh] overflow-y-auto"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
              <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg uppercase tracking-widest flex items-center gap-2">
                  <Settings className="w-5 h-5 text-vibe-primary" /> Settings
                </h2>
                <button onClick={() => setSettings(DEFAULT_SETTINGS)}
                  className="text-[10px] font-mono text-white/35 hover:text-vibe-primary transition-colors uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/10 hover:border-vibe-primary/40">
                  Reset
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {/* Platform badge */}
                <div className="flex items-center justify-between p-3 bg-white/4 rounded-xl border border-white/5">
                  <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Haptics engine</span>
                  <span className={`text-[9px] font-mono px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                    isNative ? 'bg-vibe-primary/20 text-vibe-primary' : 'bg-white/8 text-white/40'}`}>
                    {isNative ? 'Native' : 'Web API'}
                  </span>
                </div>

                {/* Visual flash */}
                <div className="flex items-center justify-between p-4 bg-white/4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    {settings.visualFlash ? <Eye className="w-4 h-4 text-vibe-primary" /> : <EyeOff className="w-4 h-4 text-white/30" />}
                    <div>
                      <p className="text-sm font-semibold">Visual Flash</p>
                      <p className="text-[10px] text-white/35 font-mono mt-0.5">Screen syncs with vibrations</p>
                    </div>
                  </div>
                  <button onClick={() => setSettings((s) => ({ ...s, visualFlash: !s.visualFlash }))}
                    className={`w-11 h-6 rounded-full transition-colors relative ${settings.visualFlash ? 'bg-vibe-primary' : 'bg-white/10'}`}>
                    <motion.div animate={{ x: settings.visualFlash ? 22 : 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="w-4 h-4 bg-white rounded-full absolute top-1 shadow" />
                  </button>
                </div>

                <div className="h-px bg-white/5" />
                <SettingSlider label="Dot Duration" value={settings.dotDuration} min={20} max={300} step={10} onChange={(v) => setSettings((s) => ({ ...s, dotDuration: v }))} />
                <SettingSlider label="Dash Duration" value={settings.dashDuration} min={50} max={1000} step={10} onChange={(v) => setSettings((s) => ({ ...s, dashDuration: v }))} />
                <SettingSlider label="Symbol Space" value={settings.symbolSpace} min={20} max={300} step={10} onChange={(v) => setSettings((s) => ({ ...s, symbolSpace: v }))} />
                <SettingSlider label="Letter Space" value={settings.letterSpace} min={100} max={1000} step={10} onChange={(v) => setSettings((s) => ({ ...s, letterSpace: v }))} />
                <SettingSlider label="Word Space" value={settings.wordSpace} min={200} max={2000} step={10} onChange={(v) => setSettings((s) => ({ ...s, wordSpace: v }))} />

                <div className="h-px bg-white/5" />
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono uppercase tracking-wider text-white/40">Haptic Diagnostic</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${vibrationSupported ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      {vibrationSupported ? 'Supported' : 'Not Supported'}
                    </span>
                  </div>
                  <button onClick={() => vibratePattern([100, 50, 100, 50, 200])} disabled={!vibrationSupported}
                    className="w-full py-3 bg-white/4 hover:bg-white/8 border border-white/8 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30">
                    Test Vibration
                  </button>
                </div>

                <div className="h-px bg-white/5" />
                {/* Custom patterns */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-white/40">Custom Patterns</h3>
                    <button onClick={() => { setShowAddPattern((v) => !v); setPatternError(''); }}
                      className="flex items-center gap-1 text-[10px] font-mono text-vibe-primary/70 hover:text-vibe-primary transition-colors uppercase tracking-wider">
                      {showAddPattern ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      {showAddPattern ? 'Cancel' : 'Add'}
                    </button>
                  </div>
                  <AnimatePresence>
                    {showAddPattern && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="bg-black/20 rounded-xl p-4 border border-white/8 mb-3 flex flex-col gap-3">
                          <div>
                            <label className="text-[9px] font-mono text-white/35 uppercase tracking-widest block mb-1.5">Character / Word</label>
                            <input type="text" value={newPatternKey} onChange={(e) => setNewPatternKey(e.target.value)}
                              placeholder="e.g. SOS or A"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-white/20 outline-none focus:border-vibe-primary/50" />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/35 uppercase tracking-widest block mb-1.5">Pattern (ms, comma-separated)</label>
                            <input type="text" value={newPatternVal} onChange={(e) => setNewPatternVal(e.target.value)}
                              placeholder="100, 50, 200, 50, 100"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-white/20 outline-none focus:border-vibe-primary/50" />
                          </div>
                          {patternError && <p className="text-[10px] text-red-400 font-mono">{patternError}</p>}
                          <button onClick={handleAddPattern}
                            className="w-full py-2.5 bg-vibe-primary text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-vibe-primary/80 transition-colors">
                            Save Pattern
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex flex-col gap-2">
                    {Object.entries(settings.customPatterns ?? {}).length === 0 && !showAddPattern && (
                      <p className="text-[10px] font-mono text-white/20 text-center py-4">No custom patterns yet</p>
                    )}
                    {Object.entries(settings.customPatterns ?? {}).map(([key, pattern]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-white/4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-vibe-primary font-mono">{key}</span>
                          <span className="text-[10px] text-white/30 font-mono truncate max-w-[130px]">[{(pattern as number[]).join(', ')}]</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => vibratePattern(pattern as number[])}
                            className="text-[9px] font-mono text-white/30 hover:text-vibe-primary transition-colors uppercase tracking-wider px-2 py-1 rounded border border-white/8 hover:border-vibe-primary/30">
                            Test
                          </button>
                          <button onClick={() => { const np = { ...settings.customPatterns }; delete np[key]; setSettings({ ...settings, customPatterns: np }); }}
                            className="p-1.5 text-white/20 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)}
                className="w-full mt-8 py-4 rounded-2xl bg-white/6 hover:bg-white/10 text-white font-bold uppercase tracking-widest transition-colors text-sm">
                Done
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── History drawer ── */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 bg-vibe-surface border-t border-white/8 rounded-t-3xl p-6 z-50 max-h-[70vh] overflow-y-auto"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
              <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-5">
                <h2 className="font-bold text-lg uppercase tracking-widest flex items-center gap-2">
                  <History className="w-5 h-5 text-vibe-primary" /> History
                </h2>
                {history.length > 0 && (
                  <button onClick={() => setHistory([])} className="p-2 text-white/30 hover:text-vibe-primary transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <div className="py-14 text-center text-white/20 font-mono text-sm">No transmissions yet</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {history.map((item, idx) => (
                    <button key={idx} onClick={() => { setText(item); setShowHistory(false); switchMode('type'); }}
                      className="flex items-center justify-between p-4 bg-white/4 rounded-xl hover:bg-white/7 transition-colors text-left group">
                      <div>
                        <p className="font-medium text-sm truncate mr-4">{item}</p>
                        <p className="text-[10px] font-mono text-white/25 mt-0.5 truncate">
                          {textToMorse(item).substring(0, 40)}{textToMorse(item).length > 40 ? '…' : ''}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-vibe-primary transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
