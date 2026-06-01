const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Add holdoff ref after isToneRef
src = src.replace(
  "  const isToneRef = useRef(false);",
  `  const isToneRef = useRef(false);
  const toneOffStartRef = useRef<number>(0);`
);

// Replace tone detection logic with holdoff version
src = src.replace(
  `    if (isTone && !isToneRef.current) {
      isToneRef.current = true;
      toneStartRef.current = now;
      setToneActive(true);
      if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
      if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
    } else if (!isTone && isToneRef.current) {
      isToneRef.current = false;
      setToneActive(false);
      const duration = now - toneStartRef.current;
      if (duration < 20) { rafRef.current = requestAnimationFrame(analyse); return; }
      processSymbol(duration > getDot() * 1.8);
    }`,
  `    if (isTone) {
      if (!isToneRef.current) {
        isToneRef.current = true;
        toneStartRef.current = now;
        setToneActive(true);
        if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
        if (letterTimerRef.current) clearTimeout(letterTimerRef.current);
      }
      toneOffStartRef.current = 0;
    } else {
      if (isToneRef.current) {
        if (toneOffStartRef.current === 0) {
          toneOffStartRef.current = now;
        } else if (now - toneOffStartRef.current > 40) {
          // Signal has been off for 40ms — real gap, not inter-element noise
          isToneRef.current = false;
          setToneActive(false);
          const duration = toneOffStartRef.current - toneStartRef.current;
          toneOffStartRef.current = 0;
          if (duration > 20) processSymbol(duration > getDot() * 1.8);
        }
      }
    }`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added 40ms gap holdoff");
