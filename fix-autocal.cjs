const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Replace fixed threshold with auto-calibration on start
src = src.replace(
  `      setListening(true);
      rafRef.current = requestAnimationFrame(analyse);`,
  `      setListening(true);
      // Auto-calibrate: sample noise floor for 1 second
      const calData = new Uint8Array(analyser.frequencyBinCount);
      const calSamples: number[] = [];
      const calStart = Date.now();
      await new Promise<void>(resolve => {
        const calLoop = () => {
          analyser.getByteFrequencyData(calData);
          let peak = 0;
          for (let i = 0; i < calData.length; i++) if (calData[i] > peak) peak = calData[i];
          calSamples.push((peak / 255) * 100);
          if (Date.now() - calStart < 1000) requestAnimationFrame(calLoop);
          else resolve();
        };
        requestAnimationFrame(calLoop);
      });
      const noiseMax = Math.max(...calSamples);
      thresholdRef.current = Math.max(8, noiseMax + 6);
      rafRef.current = requestAnimationFrame(analyse);`
);

// Add thresholdRef
src = src.replace(
  `  const wpmRef = useRef(18);`,
  `  const wpmRef = useRef(18);
  const thresholdRef = useRef(12);`
);

// Use thresholdRef instead of hardcoded 12
src = src.replace(
  `    const isTone = level > 12; // fixed threshold — worked for HELLOEVERYONE`,
  `    const isTone = level > thresholdRef.current;`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added auto-calibration");
