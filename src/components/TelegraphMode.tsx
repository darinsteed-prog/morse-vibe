import React from 'react';
import { Trash2 } from 'lucide-react';

interface TelegraphModeProps {
  text: string;
  tapSequence: string;
  isTransmitting: boolean;
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  clearInput: () => void;
}

export function TelegraphMode({
  text,
  tapSequence,
  isTransmitting,
  handlePointerDown,
  handlePointerUp,
  clearInput,
}: TelegraphModeProps) {
  return (
    <div className="flex flex-col gap-3 flex-1">
      {/* Decoded text display */}
      <div className="bg-vibe-surface border border-white/8 rounded-2xl p-4 relative overflow-hidden min-h-[80px]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vibe-primary/40 to-transparent" />
        <div className="flex justify-between items-start mb-1">
          <span className="text-[12px] font-mono text-white/30 uppercase tracking-widest">Decoded</span>
          {text && (
            <button
              onClick={clearInput}
              className="flex items-center gap-1 text-[11px] font-mono text-white/30 hover:text-vibe-primary transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className="text-2xl font-semibold text-white/90 break-words leading-relaxed mt-1">
          {text || <span className="text-white/15 font-normal">tap to compose...</span>}
        </p>
      </div>

      {/* Current tap sequence */}
      <div className="flex items-center justify-center h-10">
        {tapSequence ? (
          <span className="font-mono text-2xl tracking-[0.3em] text-vibe-primary/80 animate-slide-up">
            {tapSequence}
          </span>
        ) : (
          <span className="text-[12px] font-mono text-white/20 uppercase tracking-widest">
            short = dot · long = dash
          </span>
        )}
      </div>

      {/* Telegraph button */}
      <div
        onPointerDown={isTransmitting ? undefined : handlePointerDown}
        onPointerUp={isTransmitting ? undefined : handlePointerUp}
        onPointerLeave={isTransmitting ? undefined : handlePointerUp}
        onPointerCancel={isTransmitting ? undefined : handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        className={`
          flex-1 min-h-[160px] rounded-2xl flex flex-col items-center justify-center
          select-none touch-none relative overflow-hidden
          border transition-all duration-75
          ${isTransmitting
            ? 'opacity-40 cursor-not-allowed border-white/5 bg-vibe-surface'
            : 'cursor-pointer border-vibe-primary/20 bg-vibe-surface active:bg-vibe-primary/10 active:border-vibe-primary/40 active:scale-[0.99]'
          }
        `}
        style={{ transition: 'transform 75ms, background 75ms, border-color 75ms' }}
      >
        {/* Background dot grid */}
        <div className="absolute inset-0 dot-bg opacity-60" />

        {/* Centre icon */}
        <div className="relative z-10 flex flex-col items-center gap-3 pointer-events-none">
          <div className="w-16 h-16 rounded-full border-2 border-vibe-primary/30 flex items-center justify-center bg-vibe-primary/5">
            <div className="w-8 h-8 rounded-full bg-vibe-primary/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-vibe-primary/60" />
            </div>
          </div>
          <span className="text-[11px] font-mono text-white/30 uppercase tracking-[0.2em]">
            Press & Hold
          </span>
        </div>
      </div>
    </div>
  );
}
