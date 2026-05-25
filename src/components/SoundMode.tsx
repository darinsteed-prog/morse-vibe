import React, { useState, useRef } from "react";
interface SoundModeProps { text: string; isTransmitting: boolean; }
export function SoundMode({ text, isTransmitting }: SoundModeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(600);
  const [wpm, setWpm] = useState(15);
  const stopRef = useRef(false);
  const timersRef = useRef<any[]>([]);
  const oscsRef = useRef<OscillatorNode[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);

  const stopSound = () => {
    stopRef.current = true;
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
    oscsRef.current.forEach(o => { try { o.stop(); o.disconnect(); } catch(e) {} });
    oscsRef.current = [];
    if (ctxRef.current) { try { ctxRef.current.close(); } catch(e) {} ctxRef.current = null; }
    setIsPlaying(false);
  };

  const addTimer = (fn: ()=>void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  };

  const playMorse = async () => {
    if (!text.trim()) return;
    stopSound();
    await new Promise(r => setTimeout(r, 80));
    stopRef.current = false;
    timersRef.current = [];
    oscsRef.current = [];
    setIsPlaying(true);
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    await ctx.resume();
    ctxRef.current = ctx;
    const dot = 1200 / wpm;
    const morseMap: Record<string,string> = {"A":".-","B":"-...","C":"-.-.","D":"-..","E":".","F":"..-.","G":"--.","H":"....","I":"..","J":".---","K":"-.-","L":".-..","M":"--","N":"-.","O":"---","P":".--.","Q":"--.-","R":".-.","S":"...","T":"-","U":"..-","V":"...-","W":".--","X":"-..-","Y":"-.--","Z":"--..","0":"-----","1":".----","2":"..---","3":"...--","4":"....-","5":".....","6":"-....","7":"--...","8":"---..","9":"----.",".":'.-.-.-',",":'--..--',"?":'..--..'}; 
    const symbols: Array<{type:'beep'|'gap', dur:number}> = [];
    for (const c of text.toUpperCase()) {
      if (c === " ") { symbols.push({type:'gap', dur:dot*7}); continue; }
      const m = morseMap[c]; if (!m) continue;
      for (let i = 0; i < m.length; i++) {
        symbols.push({type:'beep', dur: m[i]==='.'? dot : dot*3});
        if (i < m.length-1) symbols.push({type:'gap', dur:dot});
      }
      symbols.push({type:'gap', dur:dot*3});
    }
    let i = 0;
    const playBeep = (dur: number) => {
      if (stopRef.current || !ctxRef.current) return;
      const c = ctxRef.current;
      const g = c.createGain();
      g.connect(c.destination);
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = frequency;
      o.connect(g);
      oscsRef.current.push(o);
      const durSec = dur / 1000;
      const ramp = Math.min(0.008, durSec * 0.1);
      g.gain.setValueAtTime(0, c.currentTime);
      g.gain.linearRampToValueAtTime(0.7, c.currentTime + ramp);
      g.gain.setValueAtTime(0.7, c.currentTime + durSec - ramp);
      g.gain.linearRampToValueAtTime(0, c.currentTime + durSec);
      o.start(c.currentTime);
      o.stop(c.currentTime + durSec + 0.01);
      o.onended = () => { oscsRef.current = oscsRef.current.filter(x => x !== o); };
    };
    const next = () => {
      if (stopRef.current || i >= symbols.length) {
        if (!stopRef.current) addTimer(stopSound, 300);
        return;
      }
      const sym = symbols[i++];
      if (sym.type === 'beep') { playBeep(sym.dur); addTimer(next, sym.dur); }
      else { addTimer(next, sym.dur); }
    };
    next();
  };

  return (
    <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
      <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Sound Transmit</span>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between"><span className="text-[10px] font-mono text-white/40">Frequency</span><span className="text-[10px] font-mono text-vibe-primary">{frequency}Hz</span></div>
        <input type="range" min={300} max={1200} step={50} value={frequency} onChange={e => setFrequency(Number(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary" disabled={isPlaying} />
        <div className="flex justify-between"><span className="text-[10px] font-mono text-white/40">Speed</span><span className="text-[10px] font-mono text-vibe-primary">{wpm} WPM</span></div>
        <input type="range" min={5} max={30} step={1} value={wpm} onChange={e => setWpm(Number(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary" disabled={isPlaying} />
      </div>
      <div className="flex gap-2">
        <button onClick={playMorse} disabled={!text.trim() || isPlaying} className="flex-1 py-3 rounded-xl text-white text-xs font-bold uppercase tracking-widest bg-vibe-primary disabled:opacity-30">
          Play Sound
        </button>
        <button onClick={stopSound} disabled={!isPlaying} className="flex-1 py-3 rounded-xl text-white text-xs font-bold uppercase tracking-widest bg-red-500/80 disabled:opacity-30">
          Stop
        </button>
      </div>
      {isPlaying && <div className="flex justify-center gap-1">{[...Array(5)].map((_,i)=><div key={i} className="w-1 bg-vibe-primary rounded-full animate-bounce" style={{height:'12px',animationDelay:i*0.1+'s'}} />)}</div>}
      <p className="text-[9px] font-mono text-white/20 text-center">Type message in Keys tab first</p>
    </div>
  );
}
