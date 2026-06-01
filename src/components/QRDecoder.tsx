import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Camera, X } from 'lucide-react';

interface QRDecoderProps {
  receivedText: string | null;
}

export function QRDecoder({ receivedText }: QRDecoderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const qrText = receivedText && receivedText.startsWith('QR ')
    ? receivedText.slice(3).trim()
    : null;

  useEffect(() => {
    if (!qrText || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, qrText, {
      width: 220, margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
  }, [qrText]);

  const startScan = async () => {
    setError(null); setScanResult(null); setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if(videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scanFrame();
      }
    } catch(e: any) {
      setError('Camera error: ' + (e.message||'Could not access camera'));
      setScanning(false);
    }
  };

  const scanFrame = async () => {
    if(!videoRef.current || !scanCanvasRef.current) return;
    const video = videoRef.current;
    const canvas = scanCanvasRef.current;
    if(video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    try {
      const { BarcodeDetector } = window as any;
      if(BarcodeDetector) {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        const codes = await detector.detect(canvas);
        if(codes.length > 0) {
          setScanResult(codes[0].rawValue);
          stopScan();
          return;
        }
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
    <div className="flex flex-col gap-3">
      <div className="bg-vibe-surface/50 border border-vibe-primary/20 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-vibe-primary/60">
            <Camera className="w-4 h-4" />
            <span className="text-[12px] font-mono uppercase tracking-wider">QR Scanner</span>
          </div>
          {scanning && <button onClick={stopScan} className="p-1 rounded-full bg-white/10"><X className="w-4 h-4"/></button>}
        </div>
        {!scanning && !scanResult && (
          <button onClick={startScan} className="w-full py-3 bg-vibe-primary rounded-xl text-white text-base font-bold uppercase tracking-widest">
            Open Camera to Scan QR
          </button>
        )}
        {error && <p className="text-[12px] font-mono text-red-400">{error}</p>}
        {scanning && (
          <div className="relative rounded-xl overflow-hidden" style={{aspectRatio:'4/3'}}>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted/>
            <canvas ref={scanCanvasRef} className="hidden"/>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-vibe-primary rounded-xl opacity-70"/>
            </div>
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <p className="text-[12px] font-mono text-white/60 bg-black/40 px-2 py-1 rounded mx-auto w-fit">Point at QR code</p>
            </div>
          </div>
        )}
        {scanResult && (
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-mono text-vibe-primary/60 uppercase tracking-wider">Scanned Result</p>
            <p className="text-base font-mono text-white break-all bg-white/5 rounded-xl p-3 border border-white/10">{scanResult}</p>
            <div className="flex gap-2">
              <button onClick={()=>{navigator.clipboard.writeText(scanResult);}} className="flex-1 py-2 bg-white/10 rounded-xl text-base font-bold uppercase tracking-widest">Copy</button>
              <button onClick={()=>{setScanResult(null);}} className="flex-1 py-2 bg-white/10 rounded-xl text-base font-bold uppercase tracking-widest">Clear</button>
              <button onClick={startScan} className="flex-1 py-2 bg-vibe-primary rounded-xl text-base font-bold uppercase tracking-widest">Scan Again</button>
            </div>
          </div>
        )}
      </div>
      {qrText && (
        <div className="bg-vibe-surface/50 border border-vibe-primary/20 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-vibe-primary/60">
            <QrCode className="w-4 h-4" />
            <span className="text-[12px] font-mono uppercase tracking-wider">QR Code Received</span>
          </div>
          <div className="flex justify-center">
            <canvas ref={canvasRef} className="rounded-xl border border-white/10" />
          </div>
          <p className="text-[11px] font-mono text-vibe-primary/40 text-center uppercase tracking-wider">Scan with your camera</p>
        </div>
      )}
    </div>
  );
}
