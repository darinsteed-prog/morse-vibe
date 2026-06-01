const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Replace RMS calculation with peak detection (we know this works)
src = src.replace(
  `    // Use overall RMS energy — works for any frequency
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length);
    const level = Math.round((rms / 128) * 100);
    setSignalLevel(Math.min(level, 100));`,
  `    // Peak detection across full spectrum
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] > peak) peak = data[i];
    }
    const level = Math.round((peak / 255) * 100);
    setSignalLevel(Math.min(level, 100));`
);

// Also fix calibration to use peak
src = src.replace(
  `        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        const rms = Math.sqrt(sum / data.length);
        samples.push((rms / 128) * 100);`,
  `        let peak = 0;
        for (let i = 0; i < data.length; i++) {
          if (data[i] > peak) peak = data[i];
        }
        samples.push((peak / 255) * 100);`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Switched to peak detection");
