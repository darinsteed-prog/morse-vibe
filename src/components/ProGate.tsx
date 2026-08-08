import React from "react";
import { Zap, Lock } from "lucide-react";
import { usePro } from "../pro";

interface ProGateProps {
  feature: string;
  description: string;
  children: React.ReactNode;
}

export function ProGate({ feature, description, children }: ProGateProps) {
  const { isPro, purchase, restore } = usePro();

  if (isPro) return <>{children}</>;

  return (
    <div className="bg-vibe-surface border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 bg-vibe-primary/20 rounded-full flex items-center justify-center">
        <Lock className="w-8 h-8 text-vibe-primary" />
      </div>
      <div>
        <p className="font-bold text-xl text-white">{feature}</p>
        <p className="text-[13px] text-white/50 mt-1">{description}</p>
      </div>
      <div className="bg-vibe-primary/10 border border-vibe-primary/20 rounded-xl p-3 w-full">
        <p className="text-[12px] font-mono text-vibe-primary/70">Morse Vibe Pro — One-time purchase</p>
        <p className="text-2xl font-bold text-white mt-1">$1.99</p>
        <p className="text-[11px] text-white/30">Unlocks Air Radar, Remote & Nearby tabs</p>
      </div>
      <button onTouchEnd={(e) => { e.preventDefault(); purchase(); }}
        className="w-full py-4 bg-vibe-primary rounded-xl font-bold text-lg uppercase tracking-widest text-white flex items-center justify-center gap-2 active:scale-95 transition-all">
        <Zap className="w-5 h-5" fill="currentColor" /> Unlock Pro
      </button>
      <button onTouchEnd={(e) => { e.preventDefault(); restore(); }} className="text-[12px] font-mono text-white/30 hover:text-white/50">
        Restore previous purchase
      </button>
    </div>
  );
}
