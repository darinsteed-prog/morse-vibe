const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Fix letter timer from 3x to 5x dot
src = src.replace(
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 3);",
  "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 5);"
);

// Update locked frequency continuously during decode
// Add after "const power = goertzel..." line
src = src.replace(
  `    // Goertzel: measure energy ONLY at the locked frequency
    const power = goertzel(samplesRef.current, lockedFreqRef.current, audioCtxRef.current.sampleRate);`,
  `    // Every 10 frames update the locked frequency to track signal drift
    if (Math.random() < 0.1 && analyserRef.current) {
      const newFreq = findDominantFreq(analyserRef.current, audioCtxRef.current.sampleRate);
      if (newFreq > 400 && newFreq < 1200) {
        // Smooth update - dont jump too fast
        lockedFreqRef.current = Math.round(lockedFreqRef.current * 0.8 + newFreq * 0.2);
        setLockedFreq(lockedFreqRef.current);
      }
    }
    // Goertzel: measure energy ONLY at the locked frequency
    const power = goertzel(samplesRef.current, lockedFreqRef.current, audioCtxRef.current.sampleRate);`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed letter timer and continuous frequency tracking");
