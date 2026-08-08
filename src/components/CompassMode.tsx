import React, { useState, useEffect, useRef } from "react";
import { Navigation, MapPin } from "lucide-react";

export function CompassMode({ onHelp }: { onHelp?: () => void }) {
  const [heading, setHeading] = useState<number | null>(null);
  const [pitch, setPitch] = useState<number | null>(null);
  const [roll, setRoll] = useState<number | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headingRef = useRef<number>(0);
  const animRef = useRef<any>(null);
  const watchRef = useRef<number | null>(null);

  const getCardinal = (deg: number) => {
    const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
    return dirs[Math.round(deg / 22.5) % 16];
  };

  const drawCompass = (ctx: CanvasRenderingContext2D, w: number, h: number, hdg: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) / 2 - 10;
    const green = "rgba(0,255,70,";

    ctx.clearRect(0, 0, w, h);

    // Black background circle
    ctx.fillStyle = "#000a00";
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // Range rings
    [0.25, 0.5, 0.75, 1].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, R * r, 0, Math.PI * 2);
      ctx.strokeStyle = green + "0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Cross lines
    ctx.strokeStyle = green + "0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();

    // Tick marks — static ring, rotated by heading
    for (let i = 0; i < 360; i += 5) {
      const rad = ((i - hdg) * Math.PI) / 180;
      const isMajor = i % 90 === 0;
      const isMed = i % 45 === 0;
      const len = isMajor ? 14 : isMed ? 9 : 5;
      const x1 = cx + R * Math.sin(rad);
      const y1 = cy - R * Math.cos(rad);
      const x2 = cx + (R - len) * Math.sin(rad);
      const y2 = cy - (R - len) * Math.cos(rad);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isMajor ? green + "0.9)" : isMed ? green + "0.5)" : green + "0.2)";
      ctx.lineWidth = isMajor ? 2 : 1;
      ctx.stroke();
    }

    // Cardinal labels — rotate with heading
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    [["N", 0], ["E", 90], ["S", 180], ["W", 270]].forEach(([lbl, deg]) => {
      const rad = (((deg as number) - hdg) * Math.PI) / 180;
      const x = cx + (R - 22) * Math.sin(rad);
      const y = cy - (R - 22) * Math.cos(rad);
      ctx.fillStyle = lbl === "N" ? "rgba(220,30,30,1)" : green + "0.8)";
      ctx.fillText(lbl as string, x, y);
    });

    // Degree numbers
    ctx.font = "11px monospace";
    [30, 60, 120, 150, 210, 240, 300, 330].forEach(deg => {
      const rad = ((deg - hdg) * Math.PI) / 180;
      const x = cx + (R - 20) * Math.sin(rad);
      const y = cy - (R - 20) * Math.cos(rad);
      ctx.fillStyle = green + "0.35)";
      ctx.fillText(deg.toString(), x, y);
    });



    // North needle — fixed pointing up (always points to where N is)
    const northRad = (-hdg * Math.PI) / 180;
    const nx = cx + (R * 0.7) * Math.sin(northRad);
    const ny = cy - (R * 0.7) * Math.cos(northRad);
    // Red north needle
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = "rgba(220,30,30,0.95)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
    // Arrowhead
    ctx.beginPath();
    ctx.arc(nx, ny, 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(220,30,30,0.95)";
    ctx.fill();
    // South tail (white/dim)
    const sx = cx - (R * 0.4) * Math.sin(northRad);
    const sy = cy + (R * 0.4) * Math.cos(northRad);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(sx, sy);
    ctx.strokeStyle = green + "0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Fixed heading marker at top (triangle)
    ctx.beginPath();
    ctx.moveTo(cx, cy - R + 2);
    ctx.lineTo(cx - 6, cy - R + 12);
    ctx.lineTo(cx + 6, cy - R + 12);
    ctx.closePath();
    ctx.fillStyle = green + "0.8)";
    ctx.fill();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = green + "0.9)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#000a00";
    ctx.fill();
  };

  const startCompass = () => {
    setActive(true);
    setError(null);

    const handler = (e: DeviceOrientationEvent) => {
      const h = (e as any).webkitCompassHeading ?? (e.alpha !== null ? (360 - e.alpha!) % 360 : null);
      if (h !== null) { headingRef.current = h; setHeading(Math.round(h)); }
      if (e.beta !== null) setPitch(Math.round(e.beta));
      if (e.gamma !== null) setRoll(Math.round(e.gamma));
    };

    const DO = DeviceOrientationEvent as any;
    if (typeof DO.requestPermission === "function") {
      DO.requestPermission().then((r: string) => {
        if (r === "granted") window.addEventListener("deviceorientation", handler, true);
        else setError("Compass permission denied");
      });
    } else {
      window.addEventListener("deviceorientation", handler, true);
    }

    watchRef.current = navigator.geolocation.watchPosition(
      pos => { setLat(pos.coords.latitude); setLon(pos.coords.longitude); setAccuracy(Math.round(pos.coords.accuracy)); },
      err => setError("GPS: " + err.message),
      { enableHighAccuracy: true }
    );

    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (ctx) drawCompass(ctx, canvas.width, canvas.height, headingRef.current);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  };

  const stopCompass = () => {
    setActive(false);
    window.removeEventListener("deviceorientation", () => {}, true);
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };

  useEffect(() => () => stopCompass(), []);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-black border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-3">
        <div className="flex items-center justify-between w-full">
          <span className="text-[12px] font-mono uppercase tracking-wider" style={{color:"rgba(0,255,70,0.5)"}}>Compass</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${active ? "animate-pulse" : ""}`} style={{background: active ? "rgba(0,255,70,0.9)" : "rgba(255,255,255,0.2)"}} />
            <span className="text-[10px] font-mono uppercase" style={{color:"rgba(0,255,70,0.4)"}}>{active ? "ACTIVE" : "IDLE"}</span>
          </div>
        </div>

        <canvas ref={canvasRef} width={300} height={300} />

        <div className="flex flex-col items-center gap-1">
          <p className="text-5xl font-bold font-mono" style={{color:"rgba(0,255,70,0.9)"}}>
            {heading !== null ? `${heading}°` : "---°"}
          </p>
          <p className="text-xl font-mono" style={{color:"rgba(0,255,70,0.6)"}}>
            {heading !== null ? getCardinal(heading) : "--"}
          </p>
        </div>

        <button onClick={active ? stopCompass : startCompass}
          className="w-full py-3 rounded-xl font-bold text-base uppercase tracking-widest active:scale-95 transition-all"
          style={{background: active ? "rgba(180,0,0,0.6)" : "rgba(0,255,70,0.15)", border: "1px solid rgba(0,255,70,0.3)", color: active ? "white" : "rgba(0,255,70,0.9)"}}>
          <Navigation className="w-4 h-4 inline mr-2" />
          {active ? "Stop Compass" : "Start Compass"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          ["Pitch", pitch !== null ? `${pitch}°` : "--", "Forward/back tilt"],
          ["Roll", roll !== null ? `${roll}°` : "--", "Left/right tilt"],
          ["Latitude", lat !== null ? lat.toFixed(5) : "--", ""],
          ["Longitude", lon !== null ? lon.toFixed(5) : "--", ""],
        ].map(([label, value, sub]) => (
          <div key={label as string} className="bg-black border border-white/5 rounded-xl p-3">
            <p className="text-[10px] font-mono uppercase tracking-wider" style={{color:"rgba(0,255,70,0.4)"}}>{label}</p>
            <p className="text-xl font-bold font-mono mt-1" style={{color:"rgba(0,255,70,0.9)"}}>{value}</p>
            {sub && <p className="text-[10px] font-mono" style={{color:"rgba(0,255,70,0.3)"}}>{sub}</p>}
          </div>
        ))}
      </div>

      {accuracy !== null && (
        <div className="bg-black border border-white/5 rounded-xl p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{color:"rgba(0,255,70,0.5)"}} />
            <span className="text-[12px] font-mono" style={{color:"rgba(0,255,70,0.4)"}}>GPS Accuracy</span>
          </div>
          <span className="text-[12px] font-mono" style={{color: accuracy < 10 ? "rgba(0,255,70,0.9)" : accuracy < 30 ? "rgba(255,200,0,0.9)" : "rgba(255,60,60,0.9)"}}>
            {accuracy}m
          </span>
        </div>
      )}

      {error && <p className="text-red-400 text-[11px] font-mono text-center">{error}</p>}

      <div className="bg-black border rounded-xl p-4 flex flex-col gap-2" style={{borderColor:"rgba(0,255,70,0.2)"}}>
        <p className="text-[13px] font-bold" style={{color:"rgba(0,255,70,0.7)"}}>How to use</p>
        <p className="text-[13px] leading-relaxed" style={{color:"rgba(0,255,70,0.4)"}}>Red needle points North. Compass ring rotates with your heading. Hold phone flat for best accuracy. GPS accuracy improves outdoors.</p>
        <p className="text-[12px] font-mono" style={{color:"rgba(0,255,70,0.3)"}}>See the Help tab for full instructions.</p>
      </div>
    </div>
  );
}
