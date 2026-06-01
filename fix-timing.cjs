const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Show last tone duration on screen for debugging
src = src.replace(
  `const [error, setError] = useState<string|null>(null);`,
  `const [error, setError] = useState<string|null>(null);
  const [lastDuration, setLastDuration] = useState<number>(0);
  const [dotThreshold, setDotThreshold] = useState<number>(0);`
);

// Record duration when tone ends
src = src.replace(
  `if (duration >= getMinDuration()) {
        processSymbol(duration > getDot() * 1.8);
      }`,
  `setLastDuration(duration);
        setDotThreshold(Math.round(getDot() * 1.8));
        if (duration >= getMinDuration()) {
          processSymbol(duration > getDot() * 1.8);
        }`
);

// Show debug info above decoded box
src = src.replace(
  `<div className="bg-black/30 border border-white/5 rounded-xl p-3 min-h-[80px]`,
  `{lastDuration > 0 && <div className="bg-black/20 border border-white/5 rounded-xl p-2 flex justify-between">
        <span className="text-[10px] font-mono text-white/30">Last tone: {lastDuration}ms</span>
        <span className="text-[10px] font-mono text-white/30">Dot/dash boundary: {dotThreshold}ms</span>
        <span className="text-[10px] font-mono text-white/30">= {lastDuration > dotThreshold ? "DASH" : "DOT"}</span>
      </div>}
      <div className="bg-black/30 border border-white/5 rounded-xl p-3 min-h-[80px]`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added timing debug display");
