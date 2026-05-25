import React from 'react';
import { MORSE_TO_CHAR } from '../constants';

interface MorseDecoderProps {
  receivedText: string | null;
}

function decodeMorse(morse: string): string {
  if (!morse) return '';
  if (morse.startsWith('IMG ') || morse.startsWith('QR ') || morse.startsWith('ENC:')) return '';
  
  return morse
    .split(' / ')
    .map(word =>
      word.split(' ')
        .map(symbol => MORSE_TO_CHAR[symbol] || '?')
        .join('')
    )
    .join(' ');
}

export function MorseDecoder({ receivedText }: MorseDecoderProps) {
  if (!receivedText) return null;
  
  const morse = receivedText;
  const decoded = decodeMorse(morse);
  
  if (!decoded) return null;

  return (
    <div className="bg-vibe-surface/50 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
      <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">Decoded Message</span>
      <p className="text-lg font-bold text-white">{decoded}</p>
      <p className="text-[9px] font-mono text-white/20 break-all">{morse}</p>
    </div>
  );
}