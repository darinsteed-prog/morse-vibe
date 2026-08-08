import React, { useState, useRef, useEffect } from "react";
import { RotateCcw, Copy, Check } from "lucide-react";
import QRCode from "qrcode";
import { dataToFrames, parseFramesReducer, areFramesComplete, framesToData } from "qrloop";

export function OpticalMode({ onHelp }: { onHelp?: () => void }) {
  const [mode, setMode] = useState<"send" | "receive">("send");

  // Send
  const [sendText, setSendText] = useState("");
  const [sending, setSending] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [fps, setFps] = useState(4);
  const framesRef = useRef<string[]>([]);
  const frameIdxRef = useRef(0);
  const intervalRef = useRef<any>(null);

  // Receive
  const [scanning, setScanning] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [receivedText, setReceivedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<any>(null);
  const framesCollected = useRef<string[]>([]);
  const framesState = useRef<any>(null);

  const startSending = async () => {
    if (!sendText.trim()) return;
    const frames = dataToFrames(sendText.trim(), 200, 2);
    framesRef.current = frames;
    setTotalFrames(frames.length);
    frameIdxRef.current = 0;
    setSending(true);
    const showNext = async () => {
      const idx = frameIdxRef.current % frames.length;
      frameIdxRef.current++;
      setCurrentFrame(idx + 1);
      try {
        const url = await QRCode.toDataURL(frames[idx], { width: 300, margin: 1, errorCorrectionLevel: "M" });
        setQrDataUrl(url);
      } catch (e) {}
    };
    await showNext();
    intervalRef.current = setInterval(showNext, 1000 / fps);
  };

  const stopSending = () => {
    clearInterval(intervalRef.current);
    setSending(false);
    setQrDataUrl("");
    setCurrentFrame(0);
  };

  const startReceiving = async () => {
    setCamError(null);
    setReceivedText("");
    setFrameCount(0);
    framesCollected.current = [];
    framesState.current = null;
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (animRef.current) { cancelAnimationFrame(animRef.current); }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        requestAnimationFrame(scanFrame);
      }
    } catch (e: any) {
      setCamError("Camera error: " + (e.message || "Could not access camera"));
    }
  };

  const scanFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    let detected: string | null = null;
    try {
      const { BarcodeDetector } = window as any;
      if (BarcodeDetector) {
        const detector = new BarcodeDetector({ formats: ["qr_code"] });
        const codes = await detector.detect(canvas);
        if (codes.length > 0) { detected = codes[0].rawValue; setFrameCount(prev => { if(prev === 0) alert("BarcodeDetector found: " + detected?.substring(0,20)); return prev; }); }
      } else {
        setFrameCount(prev => { if(prev === 0) alert("No BarcodeDetector available"); return prev; });
      }
    } catch (e: any) { setFrameCount(prev => { if(prev === 0) alert("BarcodeDetector error: " + e.message); return prev; }); }

    if (!detected) {
      try {
        const jsQR = (await import("jsqr")).default;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data) detected = code.data;
      } catch (e) {}
    }

    if (detected) {
      try {
        framesState.current = parseFramesReducer(framesState.current, detected);
        if (!framesCollected.current.includes(detected)) {
          framesCollected.current.push(detected);
          setFrameCount(framesCollected.current.length);
        }
        if (areFramesComplete(framesState.current)) {
          const data = framesToData(framesState.current);
          setReceivedText(data.toString());
          stopReceiving();
          return;
        }
      } catch (e) {}
    }

    animRef.current = requestAnimationFrame(scanFrame);
  };

  const stopReceiving = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setScanning(false);
  };

  useEffect(() => () => { stopSending(); stopReceiving(); }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Always render video and canvas so refs are available */}
      <video ref={videoRef} className={scanning ? "w-full rounded-2xl border border-white/10" : "hidden"} playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex bg-vibe-surface/50 p-1 rounded-xl border border-white/5 gap-1">
        <button onClick={() => { stopReceiving(); setMode("send"); }}
          className={`flex-1 py-2 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-colors ${mode === "send" ? "bg-white/10 text-white" : "text-white/40"}`}>
          Send
        </button>
        <button onClick={() => { stopSending(); setMode("receive"); }}
          className={`flex-1 py-2 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-colors ${mode === "receive" ? "bg-white/10 text-white" : "text-white/40"}`}>
          Receive
        </button>
      </div>

      {mode === "send" && (
        <div className="flex flex-col gap-4">
          <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <span className="text-[12px] font-mono uppercase tracking-wider text-white/40">Optical Send</span>
            <p className="text-[11px] font-mono text-white/30">Displays animated QR codes. Receiver points camera at screen. No internet or Bluetooth needed.</p>
            <textarea value={sendText} onChange={e => setSendText(e.target.value)}
              placeholder="Type message to send optically..." rows={3} disabled={sending}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-base font-mono text-white/90 placeholder:text-white/20 focus:outline-none resize-none disabled:opacity-50" />
            <button onClick={async () => {
              try { const t = await navigator.clipboard.readText(); setSendText(t); }
              catch(e) { alert("Long press in the text box above and select Paste"); }
            }} className="w-full py-2 rounded-xl border border-white/10 text-[12px] font-mono text-white/40 hover:text-white/60">
              Paste from clipboard
            </button>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-[12px] font-mono text-white/40">Frame Rate</span>
                <span className="text-[12px] font-mono text-vibe-primary">{fps} fps</span>
              </div>
              <input type="range" min={1} max={8} step={1} value={fps}
                onChange={e => setFps(Number(e.target.value))} disabled={sending}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary" />
              <div className="flex justify-between text-[10px] font-mono text-white/20">
                <span>1 slow</span><span>4 normal</span><span>8 fast</span>
              </div>
            </div>
            {!sending
              ? <button onClick={startSending} disabled={!sendText.trim()}
                  className="w-full py-3 bg-vibe-primary rounded-xl font-bold text-base uppercase tracking-widest text-white disabled:opacity-30 active:scale-95">
                  Start Optical Send
                </button>
              : <button onClick={stopSending}
                  className="w-full py-3 bg-red-500/80 rounded-xl font-bold text-base uppercase tracking-widest text-white active:scale-95">
                  Stop
                </button>
            }
            <div className="bg-vibe-primary/10 border border-vibe-primary/20 rounded-xl p-4 flex flex-col gap-2">
              <p className="text-[13px] font-bold text-white/70">How it works</p>
              <p className="text-[13px] text-white/50 leading-relaxed">Displays animated QR codes on screen. Receiver points camera at screen to capture data. Uses fountain codes — missed or blurry frames recovered automatically.</p>
              <p className="text-[12px] font-mono text-vibe-primary/60">See the Help tab for full instructions and tips.</p>
            </div>
          </div>

          {sending && qrDataUrl && (
            <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-3">
              <img src={qrDataUrl} alt="QR frame" className="w-64 h-64" />
              <p className="text-[12px] font-mono text-black/60">Frame {currentFrame} of {totalFrames} at {fps}fps</p>
              <div className="w-48 h-1.5 bg-black/10 rounded-full">
                <div className="h-1.5 bg-vibe-primary rounded-full transition-all" style={{ width: `${(currentFrame / totalFrames) * 100}%` }} />
              </div>
              <p className="text-[10px] font-mono text-black/40">Keep showing until receiver confirms</p>
            </div>
          )}
        </div>
      )}

      {mode === "receive" && (
        <div className="flex flex-col gap-4">
          <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <span className="text-[12px] font-mono uppercase tracking-wider text-white/40">Optical Receive</span>
            <p className="text-[11px] font-mono text-white/30">Point camera at the animated QR codes. Missed frames recovered automatically.</p>
            {scanning && (
              <div className="flex justify-between text-[11px] font-mono text-white/40">
                <span>Scanning...</span>
                <span>{frameCount} frames captured</span>
              </div>
            )}
            {!scanning
              ? <button onClick={startReceiving}
                  className="w-full py-3 bg-vibe-primary rounded-xl font-bold text-base uppercase tracking-widest text-white flex items-center justify-center gap-2 active:scale-95">
                  Start Camera
                </button>
              : <button onClick={stopReceiving}
                  className="w-full py-3 bg-red-500/80 rounded-xl font-bold text-base uppercase tracking-widest text-white active:scale-95">
                  Stop Camera
                </button>
            }
            {camError && <p className="text-red-400 text-[11px] font-mono">{camError}</p>}
          </div>

          {scanning && (
            <div className="absolute bottom-2 right-2 bg-black/60 rounded-full px-3 py-1 flex items-center gap-2">
              <div className="w-2 h-2 bg-vibe-primary rounded-full animate-pulse" />
              <span className="text-[11px] font-mono text-white/80">{frameCount} frames</span>
            </div>
          )}

          {receivedText && (
            <div className="bg-vibe-surface border border-green-500/20 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-mono text-green-400/70 uppercase tracking-wider">Received</span>
                <button onClick={() => { navigator.clipboard.writeText(receivedText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex items-center gap-1 text-[11px] font-mono text-white/40">
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="font-mono text-base text-white/90 break-all">{receivedText}</p>
              <button onClick={() => { navigator.clipboard.writeText(receivedText); alert("Copied - paste in Keys tab to transmit as morse"); }}
                className="w-full py-2 rounded-xl bg-vibe-primary/20 border border-vibe-primary/30 text-[12px] font-mono text-vibe-primary/80">
                Send to Keys tab (copy to clipboard)
              </button>
              <button onClick={() => { setReceivedText(""); setFrameCount(0); framesCollected.current = []; framesState.current = null; }}
                className="flex items-center justify-center gap-1 py-2 rounded-xl border border-white/10 text-[12px] font-mono text-white/30">
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            </div>
          )}

          <div className="bg-vibe-primary/10 border border-vibe-primary/20 rounded-xl p-4 flex flex-col gap-2">
            <p className="text-[13px] font-bold text-white/70">How it works</p>
            <p className="text-[13px] text-white/50 leading-relaxed">Uses fountain codes — same error correction as satellite communications. Missed or blurry frames are recovered automatically.</p>
            <p className="text-[12px] font-mono text-vibe-primary/60 mt-1">See the Help tab for full instructions and tips.</p>
          </div>
        </div>
      )}
    </div>
  );
}
