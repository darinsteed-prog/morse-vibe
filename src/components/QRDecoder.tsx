import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode } from 'lucide-react';

interface QRDecoderProps {
  receivedText: string | null;
}

export function QRDecoder({ receivedText }: QRDecoderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrText = receivedText && receivedText.startsWith('QR ')
    ? receivedText.slice(3).trim()
    : null;

  useEffect(() => {
    if (!qrText || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, qrText, {
      width: 220,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
  }, [qrText]);

  if (!qrText) return null;

  return (
    <div className="bg-vibe-surface/50 border border-vibe-primary/20 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-vibe-primary/60">
        <QrCode className="w-4 h-4" />
        <span className="text-[10px] font-mono uppercase tracking-wider">QR Code Received</span>
      </div>
      <div className="flex justify-center">
        <canvas ref={canvasRef} className="rounded-xl border border-white/10" />
      </div>
      <p className="text-[9px] font-mono text-vibe-primary/40 text-center uppercase tracking-wider">
        Scan with your camera
      </p>
    </div>
  );
}