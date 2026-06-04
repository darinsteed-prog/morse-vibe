const fs = require("fs");
const file = "src/components/FlashMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Remove receive tab button and content - keep only send
src = src.replace(
  `        <div className="flex gap-1">
          <button onClick={() => { stopReceiving(); setMode('send'); }}
            className={\`flex-1 py-2 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-colors \${mode==='send'?'bg-white/10 text-white':'text-white/40'}\`}>Send</button>
          <button onClick={() => { stopFlash(); setMode('receive'); }}
            className={\`flex-1 py-2 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-colors \${mode==='receive'?'bg-white/10 text-white':'text-white/40'}\`}>Receive</button>
        </div>`,
  ``
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Removed receive tab button");
