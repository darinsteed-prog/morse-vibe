import React, { useEffect, useRef } from 'react';
import { ImageIcon } from 'lucide-react';

const GRID_SIZE = 32;

interface ImageDecoderProps {
  receivedText: string | null;
}

function decodeImageText(text: string): ImageData | null {
  if (!text || !text.startsWith('IMG ')) return null;
  try {
    const rows = text.slice(4).trim().split(' ');
    if (rows.length !== GRID_SIZE) return null;
    const pixels = new Uint8ClampedArray(GRID_SIZE * GRID_SIZE * 4);
    rows.forEach((row, rowIdx) => {
      const bits = (parseInt(row.slice(0,2),16).toString(2).padStart(8,'0') + parseInt(row.slice(2,4),16).toString(2).padStart(8,'0'));
      for (let col = 0; col < GRID_SIZE; col++) {
        const i = (rowIdx * GRID_SIZE + col) * 4;
        const v = bits[col] === '1' ? 0 : 255;
        pixels[i] = pixels[i+1] = pixels[i+2] = v;
        pixels[i+3] = 255;
      }
    });
    return new ImageData(pixels, GRID_SIZE, GRID_SIZE);
  } catch { return null; }
}

export function ImageDecoder({ receivedText }: ImageDecoderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageData = receivedText ? decodeImageText(receivedText) : null;
  useEffect(() => {
    if (!canvasRef.current || !imageData) return;
    canvasRef.current.getContext('2d')?.putImageData(imageData, 0, 0);
  }, [imageData]);
  if (!imageData) return null;
  return (
    <div className="bg-vibe-surface/50 border border-vibe-primary/20 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-vibe-primary/60">
        <ImageIcon className="w-4 h-4" />
        <span className="text-[10px] font-mono uppercase tracking-wider">Image Received</span>
      </div>
      <canvas ref={canvasRef} width={GRID_SIZE} height={GRID_SIZE} className="rounded border border-white/10" style={{ imageRendering: 'pixelated', width: 128, height: 128 }} />
    </div>
  );
}