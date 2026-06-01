import React, { useRef, useState } from 'react';
import { ImageIcon, AlertTriangle } from 'lucide-react';
import QRCode from 'qrcode';

interface ImageModeProps {
  setText: (text: string) => void;
  isTransmitting: boolean;
}

const GRID = 48;

function processImage(img: HTMLImageElement, contrast: number, brightness: number): { morseText: string; previewUrl: string; } {
  const canvas = document.createElement('canvas');
  canvas.width = GRID; canvas.height = GRID;
  const ctx = canvas.getContext('2d')!;
  ctx.filter = `contrast(${contrast}%) brightness(${brightness}%)`;
  ctx.drawImage(img, 0, 0, GRID, GRID);
  const { data } = ctx.getImageData(0, 0, GRID, GRID);
  const lumas: number[] = [];
  for (let i = 0; i < GRID * GRID; i++) {
    const r = data[i*4], g = data[i*4+1], b = data[i*4+2];
    lumas.push(0.299*r + 0.587*g + 0.114*b);
  }
  let min = 255, max = 0;
  lumas.forEach(l => { if(l<min) min=l; if(l>max) max=l; });
  const range = max - min || 1;
  const nibbles: number[] = lumas.map(l => Math.round(((l-min)/range)*15));
  const bytes: string[] = [];
  for (let i = 0; i < nibbles.length; i += 2) {
    const byte = (nibbles[i] << 4) | (nibbles[i+1] ?? 0);
    bytes.push(byte.toString(16).padStart(2,'0'));
  }
  const rowLen = GRID / 2;
  const rows: string[] = [];
  for (let r = 0; r < GRID; r++) rows.push(bytes.slice(r * rowLen, (r+1) * rowLen).join(''));
  const morseText = 'IMG' + GRID + ' ' + rows.join(' ');
  const prev = document.createElement('canvas');
  prev.width = GRID; prev.height = GRID;
  const pctx = prev.getContext('2d')!;
  const pimg = pctx.createImageData(GRID, GRID);
  nibbles.forEach((n, i) => {
    const v = Math.round((n/15)*255);
    pimg.data[i*4]=v; pimg.data[i*4+1]=v; pimg.data[i*4+2]=v; pimg.data[i*4+3]=255;
  });
  pctx.putImageData(pimg, 0, 0);
  return { morseText, previewUrl: prev.toDataURL() };
}

export function ImageMode({ setText, isTransmitting }: ImageModeProps) {
  const fileRef = useRef<HTMLInputElement>(null); const cameraRef = useRef<HTMLInputElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [encodedPreview, setEncodedPreview] = useState<string | null>(null);
  const [charCount, setCharCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [contrast, setContrast] = useState(120);
  const [brightness, setBrightness] = useState(100);
  const [tab, setTab] = useState<'morse'|'qr'|'both'>('morse');
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [morseText, setMorseText] = useState('');

  const reprocess = (img: HTMLImageElement, c: number, b: number) => {
    const { morseText: mt, previewUrl } = processImage(img, c, b);
    setEncodedPreview(previewUrl);
    setCharCount(mt.length);
    setMorseText(mt);
    setText(mt);
    setQrGenerated(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    setLoading(true); setError(null); setQrGenerated(false);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      reprocess(img, contrast, brightness);
      setLoading(false);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { setError('Could not load image.'); setLoading(false); };
    img.src = url;
    e.target.value = '';
  };

  const handleContrast = (v: number) => { setContrast(v); if(imgRef.current) reprocess(imgRef.current, v, brightness); };
  const handleBrightness = (v: number) => { setBrightness(v); if(imgRef.current) reprocess(imgRef.current, contrast, v); };

  const generateQR = async () => {
    if (!morseText || !qrCanvasRef.current) return;
    setQrLoading(true); setError(null);
    try {
      await QRCode.toCanvas(qrCanvasRef.current, morseText, {
        width: 260, margin: 2, errorCorrectionLevel: 'L',
        color: { dark: '#000000', light: '#ffffff' }
      });
      setQrGenerated(true);
    } catch(e: any) {
      setError('QR too large � increase contrast to reduce data size.');
    }
    setQrLoading(false);
  };

  const showQR = tab === 'qr' || tab === 'both';

  return (
    <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
      <div className="flex items-center gap-2 text-white/40">
        <ImageIcon className="w-4 h-4" />
        <span className="text-[12px] font-mono uppercase tracking-wider">Image Transmit � 48x48 � 16-shade</span>
      </div>
      <div className="flex gap-1">
        {(['morse','qr','both'] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-2 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-colors ${tab===t?'bg-white/10 text-white':'text-white/40 hover:text-white/60'}`}>
            {t==='morse'?'Morse':t==='qr'?'QR':'Both'}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => fileRef.current?.click()} disabled={isTransmitting || loading}
          className="flex-1 py-4 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-vibe-primary/40 hover:bg-vibe-primary/5 transition-all disabled:opacity-30">
          <ImageIcon className="w-6 h-6 text-white/20" />
          <span className="text-[12px] font-mono text-white/40 uppercase tracking-wider">{loading?'Processing...':'Gallery'}</span>
        </button>
        <button onClick={() => cameraRef.current?.click()} disabled={isTransmitting || loading}
          className="flex-1 py-4 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-vibe-primary/40 hover:bg-vibe-primary/5 transition-all disabled:opacity-30">
          <ImageIcon className="w-6 h-6 text-white/20" />
          <span className="text-[12px] font-mono text-white/40 uppercase tracking-wider">{loading?'Processing...':'Camera'}</span>
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      {error && <div className="flex items-center gap-2 text-amber-400 text-base font-mono"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}
      {encodedPreview && (
        <>
          <div className="flex gap-4 items-start">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-white/30 uppercase">Preview</span>
              <img src={encodedPreview} alt="Encoded" className="w-20 h-20 rounded border border-white/10" style={{imageRendering:'pixelated'}} />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-[12px] font-mono text-vibe-primary/70">{charCount} chars � 48�48 � 4-bit</p>
              <p className="text-[11px] font-mono text-white/25">
                {tab==='morse'?'Vibrate morse to transmit':tab==='qr'?'Show QR for instant scan':'Vibrate morse + show QR simultaneously'}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between"><span className="text-[11px] font-mono text-white/30">Contrast</span><span className="text-[11px] font-mono text-vibe-primary">{contrast}%</span></div>
            <input type="range" min={50} max={300} step={5} value={contrast} onChange={e=>handleContrast(+e.target.value)} className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary" />
            <div className="flex justify-between"><span className="text-[11px] font-mono text-white/30">Brightness</span><span className="text-[11px] font-mono text-vibe-primary">{brightness}%</span></div>
            <input type="range" min={50} max={200} step={5} value={brightness} onChange={e=>handleBrightness(+e.target.value)} className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary" />
          </div>
          <canvas ref={qrCanvasRef} style={{display: qrGenerated && showQR ? 'block' : 'none'}} className="rounded-xl border-4 border-white mx-auto" />
          {showQR && (
            <>
              <button onClick={generateQR} disabled={qrLoading||!morseText} className="w-full py-3 bg-vibe-primary rounded-xl text-white text-base font-bold uppercase tracking-widest disabled:opacity-30">
                {qrLoading?'Generating...':qrGenerated?'Regenerate QR':'Generate QR Code'}
              </button>
              {qrGenerated && (
                <p className="text-[11px] font-mono text-vibe-primary/60 text-center">
                  {tab==='both'?'Show QR while morse vibrates':'Show this QR to receiver to scan'}
                </p>
              )}
            </>
          )}
          {tab==='morse' && <p className="text-[11px] font-mono text-white/30 text-center">Tap Start Vibe below to transmit</p>}
          {tab==='both' && qrGenerated && isTransmitting && (
            <div className="bg-vibe-primary/10 border border-vibe-primary/30 rounded-xl p-3 text-center">
              <p className="text-[12px] font-mono text-vibe-primary font-bold">TRANSMITTING � Morse + QR active</p>
            </div>
          )}
        </>
      )}
      {!encodedPreview && (
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-1">Modes</p>
          <ul className="text-[11px] text-white/25 space-y-0.5 leading-relaxed">
            <li>� Morse � transmit via vibration only</li>
            <li>� QR � show scannable QR code only</li>
            <li>� Both � vibrate morse AND show QR at same time</li>
          </ul>
        </div>
      )}
    </div>
  );
}
