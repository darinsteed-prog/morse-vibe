import React, { useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface SoundModeProps {
  text: string;
  isTransmitting: boolean;
}

export function SoundMode({ text, isTransmitting }: SoundModeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(600);
  const [wpm, setWpm] = useState(15);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef(false);

  const getDotDuration = () => (1200 / wpm) / 1000;

  const playMorse = async (morseText: string) => {
    if (!morseText.trim()) return;
    stopRef.current = false;
    setIsPlaying(true);

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const dot = getDotDuration();
    const dash = dot * 3;
    const symbolSpace = dot;
    const letterSpace = dot * 3;
    const wordSpace = dot * 7;

    let time = ctx.currentTime + 0.1;

    const beep = (duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = frequency;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      osc.start(time);
      osc.stop(time + duration);
      time += duration + symbolSpace;
    };

    const morse = morseText.toUpperCase();
    for (const char of morse) {
      if (stopRef.current) break;
      if (char === '.') { beep(dot); }
      else if (char === '-') { beep(dash); }
      else if (char === ' ') { time += letterSpace; }
      else if (char === '/') { time += wordSpace; }
    }

    const totalTime = (time - ctx.currentTime) * 1000;
    setTimeout(() => {
      if (!stopRef.current) {
        setIsPlaying(false);
        ctx.close();
      }
    }, totalTime + 500);
  };

  const stopSound = () => {
    stopRef.current = true;
    audioCtxRef.current?.close();
    setIsPlaying(false);
  };

  return (
    <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
      <div className="flex items-center gap-2 text-white/40">
        <Volume2 className="w-4 h-4" />
        <span className="text-[10px] font-mono uppercase tracking-wider">Sound Transmit</span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-[10px] font-mono text-white/40 uppercase">Frequency</span>
            <span className="text-[10px] font-mono text-vibe-primary">{frequency}Hz</span>
          </div>
          <input type="range" min={400} max={1000} step={50} value={frequency}
            onChange={e => setFrequency(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-[10px] font-mono text-white/40 uppercase">Speed (WPM)</span>
            <span className="text-[10px] font-mono text-vibe-primary">{wpm} WPM</span>
          </div>
          <input type="range" min={5} max={30} step={1} value={wpm}
            onChange={e => setWpm(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary" />
        </div>
      </div>

      <button
        onClick={isPlaying ? stopSound : () => playMorse(text)}
        disabled={!text.trim() && !isPlaying}
        className={`w-full py-3 rounded-xl text-white text-xs font-bold uppercase tracking-widest disabled:opacity-30 transition-all ${isPlaying ? 'bg-white text-vibe-bg' : 'bg-vibe-primary'}`}
      >
        {isPlaying ? (
          <span className="flex items-center justify-center gap-2"><VolumeX className="w-4 h-4" /> Stop Sound</span>
        ) : (
          <span className="flex items-center justify-center gap-2"><Volume2 className="w-4 h-4" /> Play Sound</span>
        )}
      </button>

      <p className="text-[9px] font-mono text-white/20 text-center">
        Transmits current message as Morse audio beeps
      </p>
    </div>
  );
}