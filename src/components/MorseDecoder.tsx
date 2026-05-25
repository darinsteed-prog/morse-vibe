import React from "react";
import { MORSE_TO_CHAR } from "../constants";
interface MorseDecoderProps { receivedText: string | null; }
function decodeMorse(morse: string): string {
  if (!morse) return "";
  if (morse.startsWith("IMG ") || morse.startsWith("QR ") || morse.startsWith("ENC:")) return "";
  // Split on / for word boundaries, spaces for letter boundaries
  return morse.split(" / ").map(word =>
    word.trim().split(" ").filter(s => s && s !== "/").map(symbol => MORSE_TO_CHAR[symbol] || "?").join("")
  ).join(" ").trim();
}
export function MorseDecoder({ receivedText }: MorseDecoderProps) {
  if (!receivedText) return null;
  const decoded = decodeMorse(receivedText);
  if (!decoded || decoded === "?") return null;
  return (
    <div className="bg-white/5 rounded-xl p-3 mt-2 border border-white/5">
      <span className="text-[9px] font-mono uppercase tracking-wider text-white/30">Decoded: </span>
      <span className="text-sm font-bold text-vibe-primary">{decoded}</span>
    </div>
  );
}