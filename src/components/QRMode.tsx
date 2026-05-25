import React, { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode } from 'lucide-react';

interface QRModeProps {
  setText: (text: string) => void;
  isTransmitting: boolean;
}

export function QRMode({ setText, isTransmitting }: QRModeProps) {
  const [input, setInput] = useState('');
  const [generated, setGenerated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQR = async () => {
    if (!input.trim() || !canvasRef.current) return;
    await QRCode.toCanvas(canvasRef.current, input.trim(), {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
    setGenerated(true);
    setText('QR ' + input.trim());
  };

  return (
    <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
      <div className="flex items-center gap-2 text-white/40">
        <QrCode className="w-4 h-4" />
        <span className="text-[10px] font-mono uppercase tracking-wider">QR Transmit</span>
      </div>
      <input
        type="text"
        value={input}
        onChange={e => { setInput(e.target.value); setGenerated(false); setText(''); }}
        placeholder="Type URL or text..."
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono placeholder:text-white/20 focus:outline-none"
        disabled={isTransmitting}
      />
      <button
        onClick={generateQR}
        disabled={!input.trim() || isTransmitting}
        className="w-full py-3 bg-vibe-primary rounded-xl text-white text-xs font-bold uppercase tracking-widest disabled:opacity-30"
      >
        Generate QR Code
      </button>
      {generated && (
        <div className="flex justify-center">
          <canvas ref={canvasRef} className="rounded-xl border border-white/10" />
        </div>
      )}
      {!generated && <canvas ref={canvasRef} className="hidden" />}
      {generated && (
        <p className="text-[9px] font-mono text-vibe-primary/60 text-center">
          Ready — tap Start Vibe to transmit
        </p>
      )}
    </div>
  );
}