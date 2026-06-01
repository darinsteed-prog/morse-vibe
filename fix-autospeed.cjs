const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Add auto-speed refs
src = src.replace(
  "  const wpmRef = useRef(18);",
  `  const wpmRef = useRef(18);
  const toneHistoryRef = useRef<number[]>([]);`
);

// Replace processSymbol with auto-calibrating version
src = src.replace(
  `  const processSymbol = useCallback((dur: number) => {
    const dot = getDot();
    const isLong = dur > dot * 1.8;
    addLog((isLong ? "DASH" : "DOT ") + " " + dur + "ms");
    symbolsRef.current += isLong ? "-" : ".";
    setCurrentSymbols(symbolsRef.current);
    if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
    letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 8);
  }, [commitLetter]);`,
  `  const processSymbol = useCallback((dur: number) => {
    // Auto-detect speed from incoming tones
    const hist = toneHistoryRef.current;
    hist.push(dur);
    if (hist.length > 20) hist.shift();
    
    // Find natural boundary between dots and dashes
    // Sort durations and find the biggest gap
    let dotDur = getDot();
    if (hist.length >= 4) {
      const sorted = [...hist].sort((a, b) => a - b);
      // Find biggest gap in sorted durations - that splits dots from dashes
      let biggestGap = 0;
      let splitIdx = 0;
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i + 1] - sorted[i];
        if (gap > biggestGap) { biggestGap = gap; splitIdx = i; }
      }
      if (biggestGap > 30 && splitIdx > 0) {
        // Dots are everything up to splitIdx, dashes after
        const dots = sorted.slice(0, splitIdx + 1);
        dotDur = dots.reduce((a, b) => a + b, 0) / dots.length;
        const newWpm = Math.round(1200 / dotDur);
        if (newWpm >= 5 && newWpm <= 50) {
          wpmRef.current = newWpm;
          setWpm(newWpm);
        }
      }
    }
    
    const boundary = dotDur * 2.0;
    const isLong = dur > boundary;
    addLog((isLong ? "DASH" : "DOT ") + " " + dur + "ms (auto=" + Math.round(dotDur) + "ms)");
    symbolsRef.current += isLong ? "-" : ".";
    setCurrentSymbols(symbolsRef.current);
    if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
    letterTimerRef.current = setTimeout(() => { commitLetter(); }, dotDur * 8);
  }, [commitLetter]);`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added auto-speed detection");
