const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Replace fixed dot/dash boundary with auto-calibrating one
// Track recent tone durations and use median to set boundary dynamically
src = src.replace(
  `  const wpmRef = useRef(15);
  const thresholdRef = useRef(25);
  const targetFreqRef = useRef(700);`,
  `  const wpmRef = useRef(15);
  const thresholdRef = useRef(15);
  const targetFreqRef = useRef(700);
  const toneDurationsRef = useRef<number[]>([]);`
);

// Replace the tone-end processing block
src = src.replace(
  `      const duration = now - toneStartRef.current;
      // Ignore anything shorter than 40% of a dot — kills barks, clicks, passing cars
      if (duration >= getMinDuration()) {
        processSymbol(duration > getDot() * 1.8);
      }`,
  `      const duration = now - toneStartRef.current;
      if (duration < 20) return; // ignore clicks under 20ms
      // Auto-calibrate: keep last 10 tone durations
      const durs = toneDurationsRef.current;
      durs.push(duration);
      if (durs.length > 10) durs.shift();
      // Use median to find dot/dash boundary
      let boundary = getDot() * 1.8; // fallback
      if (durs.length >= 3) {
        const sorted = [...durs].sort((a,b) => a-b);
        const shortest = sorted[0];
        const longest = sorted[sorted.length-1];
        // boundary is midpoint between shortest and longest seen
        boundary = (shortest + longest) / 2;
        // sanity check — if all similar length, use fixed ratio
        if (longest / shortest < 1.5) boundary = sorted[Math.floor(sorted.length/2)] * 1.8;
      }
      processSymbol(duration > boundary);`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added auto-calibrating dot/dash detection");
