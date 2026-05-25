import React, { useState, useRef } from "react";
interface FlashModeProps { text: string; isTransmitting: boolean; }
export function FlashMode({ text, isTransmitting }: FlashModeProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [wpm, setWpm] = useState(10);
  const [screenOn, setScreenOn] = useState(false);
  const stopRef = useRef(false);
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
  const flashMorse = async () => {
    if (!text.trim()) return;
    stopRef.current = false;
    setIsFlashing(true);
    const dot = 1200 / wpm;
    const morseMap: Record<string,string> = {"A":".-","B":"-...","C":"-.-.","D":"-..","E":".","F":"..-.","G":"--.","H":"....","I":"..","J":".---","K":"-.-","L":".-..","M":"--","N":"-.","O":"---","P":".--.","Q":"--.-","R":".-.","S":"...","T":"-","U":"..-","V":"...-","W":".--","X":"-..-","Y":"-.--","Z":"--..","0":"-----","1":".----","2":"..---","3":"...--","4":"....-","5":".....","6":"-....","7":"--...","8":"---..","9":"----."}
    const morse = text.toUpperCase().split("").map(c => c === " " ? "/" : (morseMap[c] || "")).filter(Boolean).join(" ");
    for (const char of morse) {
      if (stopRef.current) break;
      if (char === ".") { setScreenOn(true); await sleep(dot); setScreenOn(false); await sleep(dot); }
      else if (char === "-") { setScreenOn(true); await sleep(dot*3); setScreenOn(false); await sleep(dot); }
      else if (char === " ") { await sleep(dot*2); }
      else if (char === "/") { await sleep(dot*6); }
    }
    setScreenOn(false);
    setIsFlashing(false);
  };
  const stopFlash = () => { stopRef.current = true; setScreenOn(false); setIsFlashing(false); };
  return (
    <>
      {screenOn && (
        <div className="fixed inset-0 bg-white z-[9999]" style={{pointerEvents: "none"}} />
      )}
      <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Screen Flash Transmit</span>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-[10px] font-mono text-white/40">Speed</span>
            <span className="text-[10px] font-mono text-vibe-primary">{wpm} WPM</span>
          </div>
          <input type="range" min={3} max={15} step={1} value={wpm} onChange={e => setWpm(Number(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary" />
        </div>
        <button onClick={isFlashing ? stopFlash : flashMorse} disabled={!text.trim() && !isFlashing} className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-30 ${isFlashing ? "bg-red-500 text-white" : "bg-vibe-primary text-white"}`}>
          {isFlashing ? "TAP TO STOP" : "Flash Morse"}
        </button>
        <p className="text-[9px] font-mono text-white/20 text-center">Full screen flashes white in Morse pattern.</p>
      </div>
    </>
  );
}