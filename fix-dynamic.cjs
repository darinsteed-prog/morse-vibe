const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Add peak tracker ref
src = src.replace(
  "  const toneHistoryRef = useRef<number[]>([]);",
  `  const toneHistoryRef = useRef<number[]>([]);
  const peakHistoryRef = useRef<number[]>([]);`
);

// Replace fixed threshold with dynamic one based on recent peak
src = src.replace(
  `    if (Date.now() < startTimeRef.current) { rafRef.current = requestAnimationFrame(analyse); return; }
    const isTone = level > 25;`,
  `    if (Date.now() < startTimeRef.current) { rafRef.current = requestAnimationFrame(analyse); return; }
    // Dynamic threshold: 40% of recent peak signal level
    const peakHist = peakHistoryRef.current;
    peakHist.push(level);
    if (peakHist.length > 30) peakHist.shift();
    const recentPeak = Math.max(...peakHist);
    const dynamicThreshold = Math.max(15, recentPeak * 0.4);
    const isTone = level > dynamicThreshold;`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Dynamic threshold added");
