import React, { useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

interface KeyboardModeProps {
  text: string;
  setText: (text: string) => void;
  isTransmitting: boolean;
  clearInput: () => void;
}

export function KeyboardMode({ text, setText, isTransmitting, clearInput }: KeyboardModeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_CHARS = 200;
  const isNearLimit = text.length > MAX_CHARS * 0.8;
  const isAtLimit = text.length >= MAX_CHARS;

  useEffect(() => {
    if (!isTransmitting && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isTransmitting]);

  return (
    <div className="flex flex-col gap-2 flex-1">
      <div className="bg-vibe-surface border border-white/8 rounded-2xl p-5 shadow-xl flex flex-col relative overflow-hidden">
        {/* Subtle gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vibe-primary/40 to-transparent" />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) setText(e.target.value);
          }}
          placeholder="Type your message..."
          className="w-full bg-transparent border-none text-2xl font-sans font-semibold placeholder:text-white/10 resize-none h-28 leading-relaxed"
          disabled={isTransmitting}
          style={{ fontFamily: 'Syne, sans-serif' }}
        />

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
          <span className={`text-base font-mono transition-colors ${
            isAtLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-white/20'
          }`}>
            {text.length}/{MAX_CHARS}
          </span>
          <div className="flex items-center gap-3">
            {isAtLimit && (
              <span className="text-[12px] font-mono text-red-400 uppercase tracking-wider">limit reached</span>
            )}
            {text && !isTransmitting && (
              <button
                onClick={clearInput}
                className="flex items-center gap-1.5 text-[11px] font-mono text-white/30 hover:text-vibe-primary transition-colors uppercase tracking-wider"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
