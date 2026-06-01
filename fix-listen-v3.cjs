const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Add rawLog state
src = src.replace(
  `  const [error, setError] = useState<string|null>(null);`,
  `  const [error, setError] = useState<string|null>(null);\n  const [rawLog, setRawLog] = useState<string[]>([]);`
);

// Replace tone-end block with logging version
const oldBlock = `      const duration = now - toneStartRef.current;
      if (duration < 20) return;
      const dot = getDot();
      const isLong = duration > dot * 1.8;
      setRawLog(prev => [\`\${isLong?"-":"."} \${duration}ms (boundary:\${Math.round(dot*1.8)}ms)\`, ...prev].slice(0,6));
      processSymbol(isLong);`;

const newBlock = `      const duration = now - toneStartRef.current;
      if (duration < 20) return;
      const dot = getDot();
      const isLong = duration > dot * 1.8;
      const sym = isLong ? "-" : ".";
      const logEntry = sym + " " + duration + "ms (dot=" + Math.round(dot) + "ms boundary=" + Math.round(dot*1.8) + "ms)";
      setRawLog(prev => [logEntry, ...prev].slice(0, 6));
      processSymbol(isLong);`;

// Find and replace the old tone block
const oldSimple = `      const duration = now - toneStartRef.current;
      if (duration < 20) return;
      const dot = getDot();
      const isLong = duration > dot * 1.8;`;

if(src.includes(oldSimple)){
  src = src.replace(oldSimple, 
    `      const duration = now - toneStartRef.current;
      if (duration < 20) return;
      const dot = getDot();
      const isLong = duration > dot * 1.8;
      const logEntry = (isLong ? "-" : ".") + " " + duration + "ms (dot=" + Math.round(dot) + "ms boundary=" + Math.round(dot*1.8) + "ms)";
      setRawLog(prev => [logEntry, ...prev].slice(0, 6));`
  );
  console.log("✔ Added tone logger");
} else {
  console.log("✖ Block not found - searching...");
  const idx = src.indexOf("duration < 20");
  console.log("Context:", src.substring(idx-50, idx+200));
}

// Add raw log display before error
src = src.replace(
  `      {error && <p className="text-red-400 text-[11px] font-mono text-center">{error}</p>}`,
  `      {rawLog.length > 0 && (
        <div className="bg-black/20 rounded-xl p-2 flex flex-col gap-0.5">
          <span className="text-[10px] font-mono text-white/20 uppercase">Raw tones</span>
          {rawLog.map((l,i)=><span key={i} className="text-[11px] font-mono text-white/50">{l}</span>)}
        </div>
      )}
      {error && <p className="text-red-400 text-[11px] font-mono text-center">{error}</p>}`
);

fs.writeFileSync(file, src, "utf8");
console.log("Done");
