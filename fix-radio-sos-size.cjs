const fs = require("fs");
const file = "src/components/ReferenceMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Fix Radio section - morse text too small
src = src.replace(
  `                <span className="text-[10px] font-mono text-white/25">{morse}</span>`,
  `                <span className="font-mono text-white/60" style={{fontSize:"18px",letterSpacing:"0.1em"}}>{morse}</span>`
);

// Fix SOS section - morse text too small
src = src.replace(
  `              <p className="text-[11px] font-mono text-vibe-primary/70 break-all mt-1">{morse}</p>`,
  `              <p className="font-mono text-vibe-primary/80 break-all mt-1" style={{fontSize:"18px",letterSpacing:"0.1em"}}>{morse}</p>`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed Radio and SOS morse size");
