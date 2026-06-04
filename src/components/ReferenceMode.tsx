import React, { useState } from "react";

const MORSE_ALPHABET = [["A",".-"],["B","-..."],["C","-.-."],["D","-.."],["E","."],["F","..-."],["G","--."],["H","...."],["I",".."],["J",".---"],["K","-.-"],["L",".-.."],["M","--"],["N","-."],["O","---"],["P",".--."],["Q","--.-"],["R",".-."],["S","..."],["T","-"],["U","..-"],["V","...-"],["W",".--"],["X","-..-"],["Y","-.--"],["Z","--.."]];
const MORSE_NUMBERS = [["0","-----"],["1",".----"],["2","..---"],["3","...--"],["4","....-"],["5","....."],["6","-...."],["7","--..."],["8","---.."],["9","----."]];
const PROSIGNS = [["SOS","...---...","Emergency distress"],["AR",".-.-.","End of message"],["AS",".-...","Wait / stand by"],["BK","-...-.-","Break — invite reply"],["CQ","-.-. --.-","Calling any station"],["DE","-.. .","This is / from"],["K","-.-","Go ahead / over"],["QRZ","--.- .-. --..","Who is calling?"],["QSL","--.- ... .-..","Acknowledged"],["QTH","--.- - ....","My location is"],["R",".-.","Received / roger"],["SK","...-.-","End of contact"],["73","--... ...--","Best regards"]];
const SURVIVAL = [["HELP",".... . .-.. .--."],["SOS","... --- ..."],["MAYDAY","-- .- -.-- -.. .- -.--"],["NORTH","-.  ---  .-.  -  ...."],["SOUTH","...  ---  ..-  -  ...."],["EAST",".  .-  ...  -"],["WEST",".--  .  ...  -"]];
const WPM = [{wpm:5,dot:"240ms",desc:"Beginner"},{wpm:10,dot:"120ms",desc:"Learning"},{wpm:18,dot:"67ms",desc:"Normal"},{wpm:25,dot:"48ms",desc:"Experienced"},{wpm:35,dot:"34ms",desc:"Expert"}];

export function ReferenceMode() {
  const [section, setSection] = useState<"az"|"radio"|"sos"|"timing">("az");
  const [search, setSearch] = useState("");

  const dot = (m: string, size=32) => m.split("").map((c,i) => <span key={i} style={{color: c==="."?"rgba(139,92,246,0.9)":c==="-"?"rgba(255,200,50,0.9)":"rgba(255,255,255,0.15)", fontSize: size+"px", lineHeight:"1"}}>{c==="."?"·":c==="-"?"−":c}</span>);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex bg-vibe-surface/50 p-1 rounded-xl border border-white/5 gap-1">
        {(["az","radio","sos","timing"] as const).map(s => (
          <button key={s} onClick={() => setSection(s)} className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors ${section===s?"bg-white/10 text-white":"text-white/40"}`}>
            {s==="az"?"A-Z":s==="radio"?"Radio":s==="sos"?"SOS":"Timing"}
          </button>
        ))}
      </div>

      {section==="az" && (
        <div className="flex flex-col gap-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-base font-mono text-white/90 placeholder:text-white/20 focus:outline-none"/>
          <div className="grid grid-cols-2 gap-2">
            {MORSE_ALPHABET.filter(([l])=>!search||l.includes(search.toUpperCase())).map(([l,m])=>(
              <div key={l} className="bg-vibe-surface border border-white/5 rounded-xl p-3 flex items-center justify-between">
                <span className="text-2xl font-bold text-white w-8">{l}</span>
                <span className="text-4xl tracking-widest">{dot(m, 36)}</span>
                <span className="text-[10px] font-mono text-white/25">{m}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] font-mono text-white/30 uppercase tracking-wider mt-1">Numbers</p>
          <div className="grid grid-cols-2 gap-2">
            {MORSE_NUMBERS.map(([n,m])=>(
              <div key={n} className="bg-vibe-surface border border-white/5 rounded-xl p-3 flex items-center justify-between">
                <span className="text-2xl font-bold text-white w-8">{n}</span>
                <span className="text-3xl tracking-widest">{dot(m)}</span>
                <span className="text-[10px] font-mono text-white/25">{m}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {section==="radio" && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-mono text-white/30">Standard ham radio prosigns and Q-codes</p>
          {PROSIGNS.map(([code,morse,meaning])=>(
            <div key={code} className="bg-vibe-surface border border-white/5 rounded-xl p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-base font-bold text-white font-mono">{code}</span>
                <span className="font-mono text-white/60" style={{fontSize:"18px",letterSpacing:"0.1em"}}>{morse}</span>
              </div>
              <span className="text-[12px] text-white/50">{meaning}</span>
            </div>
          ))}
        </div>
      )}

      {section==="sos" && (
        <div className="flex flex-col gap-2">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
            <p className="text-[12px] font-mono text-red-400/80 font-bold mb-2">SOS — International Distress</p>
            <p className="text-3xl font-mono tracking-widest text-red-400">···−−−···</p>
            <p className="text-[11px] text-white/30 mt-2">Three dots · three dashes · three dots · no spaces</p>
          </div>
          {SURVIVAL.map(([phrase,morse])=>(
            <div key={phrase} className="bg-vibe-surface border border-white/5 rounded-xl p-3">
              <p className="text-base font-bold text-white">{phrase}</p>
              <p className="font-mono text-vibe-primary/80 break-all mt-1" style={{fontSize:"18px",letterSpacing:"0.1em"}}>{morse}</p>
            </div>
          ))}
        </div>
      )}

      {section==="timing" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-mono text-white/40 uppercase tracking-wider">Timing Rules</p>
            {[["Dot (·)","1 unit","shortest signal"],["Dash (−)","3 units","3x longer than dot"],["Symbol gap","1 unit","between dots/dashes"],["Letter gap","3 units","between letters"],["Word gap","7 units","between words"]].map(([n,d,e])=>(
              <div key={n} className="bg-vibe-surface border border-white/5 rounded-xl p-3 flex justify-between items-center">
                <div><p className="text-base font-bold text-white">{n}</p><p className="text-[11px] font-mono text-white/30">{e}</p></div>
                <span className="text-[12px] font-mono text-vibe-primary bg-vibe-primary/10 px-2 py-1 rounded-lg">{d}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-mono text-white/40 uppercase tracking-wider">Speed Reference</p>
            {WPM.map(({wpm,dot,desc})=>(
              <div key={wpm} className="bg-vibe-surface border border-white/5 rounded-xl p-3 flex justify-between items-center">
                <div><p className="text-base font-bold text-white">{wpm} WPM</p><p className="text-[11px] font-mono text-white/30">{desc}</p></div>
                <span className="text-[12px] font-mono text-vibe-primary">{dot} dot</span>
              </div>
            ))}
          </div>
          <div className="bg-vibe-surface border border-white/5 rounded-xl p-4">
            <p className="text-[12px] font-mono text-white/40 uppercase tracking-wider mb-2">Reading by Ear</p>
            <p className="text-[12px] text-white/50 mb-1">Say <span className="text-vibe-primary font-mono">dit</span> for dots, <span className="text-yellow-400 font-mono">dah</span> for dashes</p>
            <p className="text-[12px] text-white/50 mb-1">A (.-) = <span className="text-vibe-primary font-mono">dit</span>-<span className="text-yellow-400 font-mono">dah</span></p>
            <p className="text-[12px] text-white/50">SOS = <span className="text-vibe-primary font-mono">dit dit dit</span> <span className="text-yellow-400 font-mono">dah dah dah</span> <span className="text-vibe-primary font-mono">dit dit dit</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
