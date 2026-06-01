import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Camera, X } from 'lucide-react';
interface QRModeProps {
  setText: (text: string) => void;
  isTransmitting: boolean;
}
export function QRMode({ setText, isTransmitting }: QRModeProps) {
  const [tab, setTab] = useState<'generate'|'scan'>('generate');
  const [input, setInput] = useState('');
  const [generated, setGenerated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);

  const generateQR = async () => {
    if (!input.trim() || !canvasRef.current) return;
    await QRCode.toCanvas(canvasRef.current, input.trim(), { width: 200, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
    setGenerated(true);
    setText('QR ' + input.trim());
  };

  const startScan = async () => {
    setCamError(null); setScanResult(null); setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if(videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); requestAnimationFrame(scanFrame); }
    } catch(e: any) { setCamError('Camera error: ' + (e.message||'Could not access camera')); setScanning(false); }
  };

  const scanFrame = async () => {
    if(!videoRef.current || !scanCanvasRef.current) return;
    const video = videoRef.current;
    const canvas = scanCanvasRef.current;
    if(video.readyState !== video.HAVE_ENOUGH_DATA) { animRef.current = requestAnimationFrame(scanFrame); return; }
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    try {
      const { BarcodeDetector } = window as any;
      if(BarcodeDetector) {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        const codes = await detector.detect(canvas);
        if(codes.length > 0) { setScanResult(codes[0].rawValue); stopScan(); return; }
      }
    } catch(e) {}
    animRef.current = requestAnimationFrame(scanFrame);
  };

  const stopScan = () => {
    if(animRef.current) cancelAnimationFrame(animRef.current);
    if(streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current = null; }
    setScanning(false);
  };

  useEffect(() => () => stopScan(), []);

  return (
    <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
      <div className="flex gap-1">
        {(['generate','scan'] as const).map(t=>(
          <button key={t} onClick={()=>{setTab(t);stopScan();}} className={`flex-1 py-2 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-colors ${tab===t?'bg-white/10 text-white':'text-white/40 hover:text-white/60'}`}>
            {t==='generate'?'Generate QR':'Scan QR'}
          </button>
        ))}
      </div>

      {tab==='generate' && (
        <>
          <div className="flex items-center gap-2 text-white/40">
            <QrCode className="w-4 h-4" />
            <span className="text-[12px] font-mono uppercase tracking-wider">QR Transmit</span>
          </div>
          <input type="text" value={input} onChange={e=>{setInput(e.target.value);setGenerated(false);setText('');}} placeholder="Type URL or text..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base font-mono placeholder:text-white/20 focus:outline-none" disabled={isTransmitting} />
          <button onClick={generateQR} disabled={!input.trim()||isTransmitting} className="w-full py-3 bg-vibe-primary rounded-xl text-white text-base font-bold uppercase tracking-widest disabled:opacity-30">Generate QR Code</button>
          <canvas ref={canvasRef} className={generated?'rounded-xl border border-white/10 mx-auto':'hidden'}/>
          {generated && <p className="text-[11px] font-mono text-vibe-primary/60 text-center">Ready — tap Start Vibe to transmit</p>}
        </>
      )}

      {tab==='scan' && (
        <>
          <div className="flex items-center gap-2 text-white/40">
            <Camera className="w-4 h-4" />
            <span className="text-[12px] font-mono uppercase tracking-wider">Scan QR Code</span>
          </div>
          {camError && <p className="text-[12px] font-mono text-red-400">{camError}</p>}
          {!scanning && !scanResult && (
            <button onClick={startScan} className="w-full py-3 bg-vibe-primary rounded-xl text-white text-base font-bold uppercase tracking-widest">Open Camera</button>
          )}
          {scanning && (
            <div className="flex flex-col gap-2">
              <div className="relative rounded-xl overflow-hidden" style={{aspectRatio:'4/3'}}>
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted/>
                <canvas ref={scanCanvasRef} className="hidden"/>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-vibe-primary rounded-xl opacity-70"/>
                </div>
                <p className="absolute bottom-2 left-0 right-0 text-center text-[12px] font-mono text-white/60">Point at QR code</p>
              </div>
              <button onClick={stopScan} className="w-full py-2 bg-white/10 rounded-xl text-base font-bold uppercase tracking-widest">Cancel</button>
            </div>
          )}
          {scanResult && (
            <div className="flex flex-col gap-3">
              <p className="text-[12px] font-mono text-vibe-primary/60 uppercase tracking-wider">Scanned</p>
              <p className="text-base font-mono text-white break-all bg-white/5 rounded-xl p-3 border border-white/10">{scanResult}</p>
              <div className="flex gap-2">
                <button onClick={()=>navigator.clipboard.writeText(scanResult)} className="flex-1 py-2 bg-white/10 rounded-xl text-base font-bold uppercase tracking-widest">Copy</button>
                <button onClick={()=>{setText(scanResult);setInput(scanResult);setTab('generate');}} className="flex-1 py-2 bg-vibe-primary rounded-xl text-base font-bold uppercase tracking-widest">Use Text</button>
                <button onClick={()=>{setScanResult(null);startScan();}} className="flex-1 py-2 bg-white/10 rounded-xl text-base font-bold uppercase tracking-widest">Scan Again</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
