const fs = require("fs");

const working = `import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, RotateCcw } from "lucide-react";

const MORSE_TO_CHAR: Record<string, string> = {
  ".-":"A","-...":"B","-.-.":"C","-..":"D",".":"E","..-.":"F","--.":"G",
  "....":"H","..":"I",".---":"J","-.-":"K",".-..":"L","--":"M","-.":"N",
  "---":"O",".--.":"P","--.-":"Q",".-.":"R","...":"S","-":"T","..-":"U",
  "...-":"V",".--":"W","-..-":"X","-.--":"Y","--..":"Z",
  "-----":"0",".----":"1","..---":"2","...--":"3","....-":"4",
  ".....":"5","-....":"6","--...":"7","---..":"8","----.":"9",
  ".-.-.-":".","--..--":",","..--..":'?',"-.-.--":"!",".--.-.":"@"
};

interface ListenModeProps {}

export function ListenMode({}: ListenModeProps) {
  const [listening, setListening] = useState(false);
  const [decodedText, setDecodedText] = useState("");
  const [currentSymbols, setCurrentSymbols] = useState("");
  const [signalLevel, setSignalLevel] = useState(0);
  const [toneActive, setToneActive] = useState(false);
  const [threshold, setThreshold] = useState(12);
  const [wpm, setWpm] = useState(20);
  const [status, setStatus] = useState("TAP MIC TO START");
  const [error, setError] = useState<string|null>(null);

  const audioCtxRef = useRef<AudioContext|null>(null);
  const analyserRef = useRef<AnalyserNode|null>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const rafRef = useRef<number>(0);
  const toneStartRef = useRef<number>(0);
  const isToneRef = useRef(false);
  const symbolsRef = useRef("");
  const letterTimerRef = useRef<any>(null);
  const wordTimerRef = useRef<any>(null);
  const wpmRef = useRef(20);
  const thresholdRef = useRef(12);

  useEffect(() => { wpmRef.current = wpm; }, [wpm]);
  useEffect(() => { thresholdRef.current = threshold; }, [threshold]);

  const getDot = () => 1200 / wpmRef.current;

  const commitLetter = useCallback(() => {
    if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
    const sym = symbolsRef.current;
    if (!sym) return;
    const char = MORSE_TO_CHAR[sym] ?? "?";
    symbolsRef.current = "";
    setCurrentSymbols("");
    setDecodedText(prev => prev + char);
    wordTimerRef.current = setTimeout(() => {
      setDecodedText(prev => prev.endsWith(" ") ? prev : prev + " ");
    }, getDot() * 12);
  }, []);

  const processSymbol = useCallback((isLong: boolean) => {
    const sym = isLong ? "-" : ".";
    symbolsRef.current += sym;
    setCurrentSymbols(symbolsRef.current);
    if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
    letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 3);
  }, [commitLetter]);

  const analyse = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] > peak) peak = data[i];
    }
    const level = Math.round((peak / 255) * 100);
    setSignalLevel(Math.min(level, 100));
    const now = Date.now();
    const isTone = level > thresholdRef.current;
    if (isTone && !isToneRef.current) {
      isToneRef.current = true;
      toneStartRef.current = now;
      setToneActive(true);
      if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
      if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
    } else if (!isTone && isToneRef.current) {
      isToneRef.current = false;
      setToneActive(false);
      const duration = now - toneStartRef.current;
      if (duration < 20) { rafRef.current = requestAnimationFrame(analyse); return; }
      const dot = getDot();
      processSymbol(duration > dot * 1.8);
    }
    rafRef.current = requestAnimationFrame(analyse);
  }, [processSymbol]);

  const startListening = async () => {
    setError(null);
    setDecodedText("");
    setCurrentSymbols("");
    symbolsRef.current = "";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false
      });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      await ctx.resume();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.1;
      source.connect(analyser);
      analyserRef.current = analyser;
      setListening(true);
      setStatus("LISTENING...");
      rafRef.current = requestAnimationFrame(analyse);
    } catch (e: any) {
      setError(e.message?.includes("denied") ? "Microphone permission denied" : "Could not access microphone");
    }
  };

  const stopListening = () => {
    cancelAnimationFrame(rafRef.current);
    if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    try { audioCtxRef.current?.close(); } catch(e) {}
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    isToneRef.current = false;
    setListening(false);
    setToneActive(false);
    setSignalLevel(0);
    setStatus("TAP MIC TO START");
  };

  const reset = () => {
    symbolsRef.current = "";
    setCurrentSymbols("");
    setDecodedText("");
    if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
  };

  useEffect(() => () => stopListening(), []);

  const bars = 20;
  const activeBars = Math.round((signalLevel / 100) * bars);
  const thresholdBar = Math.round((threshold / 100) * bars);

  return (
    <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-mono uppercase tracking-wider text-white/40">Mic Decoder</span>
        <div className="flex items-center gap-2">
          <div className={\`w-2 h-2 rounded-full \${listening ? (toneActive ? "bg-vibe-primary animate-pulse" : "bg-vibe-primary/40") : "bg-white/20"}\`} />
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{status}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] font-mono text-white/30">
          <span>SIGNAL</span><span>{signalLevel}%</span>
        </div>
        <div className="flex gap-[2px] h-5 items-end">
          {Array.from({length: bars}).map((_, i) => (
            <div key={i} className="flex-1 rounded-sm transition-all duration-75"
              style={{
                height: \`\${40 + (i / bars) * 60}%\`,
                background: i < activeBars
                  ? i >= thresholdBar ? "rgba(139,92,246,1)" : "rgba(255,255,255,0.3)"
                  : "rgba(255,255,255,0.06)",
              }}
            />
          ))}
        </div>
        <div className="relative h-2">
          <div className="absolute top-0 w-[2px] h-3 bg-red-400/70 rounded" style={{ left: \`\${threshold}%\` }} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <span className="text-[12px] font-mono text-white/40">Sensitivity (red line)</span>
          <span className="text-[12px] font-mono text-vibe-primary">{threshold}%</span>
        </div>
        <input type="range" min={5} max={40} step={1} value={threshold}
          onChange={e => { setThreshold(Number(e.target.value)); thresholdRef.current = Number(e.target.value); }}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary" />
        <div className="flex justify-between">
          <span className="text-[12px] font-mono text-white/40">Speed</span>
          <span className="text-[12px] font-mono text-vibe-primary">{wpm} WPM</span>
        </div>
        <input type="range" min={5} max={40} step={1} value={wpm}
          onChange={e => { setWpm(Number(e.target.value)); wpmRef.current = Number(e.target.value); }}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary"
          disabled={listening} />
      </div>
      <div className="bg-black/30 border border-white/5 rounded-xl p-3 min-h-[80px] flex flex-col gap-1">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-mono text-white/20 uppercase tracking-wider">Decoded</span>
          <button onClick={reset} className="text-white/20 hover:text-white/50 transition-colors">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
        <p className="font-mono text-base text-white/90 break-all leading-relaxed min-h-[1.5em]">
          {decodedText || <span className="text-white/20">—</span>}
        </p>
        {currentSymbols && (
          <p className="text-[11px] font-mono text-vibe-primary/60 tracking-widest">{currentSymbols}</p>
        )}
      </div>
      <button onClick={listening ? stopListening : startListening}
        className={\`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-base uppercase tracking-widest transition-all active:scale-95 \${listening ? "bg-red-500/80 text-white" : "bg-vibe-primary text-white"}\`}>
        {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        {listening ? "Stop Listening" : "Start Listening"}
      </button>
      {error && <p className="text-red-400 text-[11px] font-mono text-center">{error}</p>}
      <p className="text-[11px] font-mono text-white/20 text-center">
        Hold phone near speaker · slide Sensitivity up if picking up noise
      </p>
    </div>
  );
}`;

fs.writeFileSync("src/components/ListenMode.tsx", working, "utf8");
console.log("✔ Reverted to working version");
