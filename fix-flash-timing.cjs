const fs = require("fs");
const file = "src/components/FlashMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Replace hardcoded dotLen with WPM-based calculation
// Also pass wpm into the analyze closure
src = src.replace(
  `              const dotLen = 120;

            if (!isLight) {
              const sym = duration < dotLen * 2 ? '.' : '-';`,
  `              const dotLen = 1200 / wpm;

            if (!isLight) {
              const sym = duration < dotLen * 2 ? '.' : '-';`
);

// Fix letter timer dotLen too
src = src.replace(
  `              letterTimerRef.current = setTimeout(() => {
                if (morseBufferRef.current) {
                  const letter = MORSE_MAP[morseBufferRef.current] || '?';
                  setReceivedMorse(m => m + morseBufferRef.current + ' ');
                  addLetter(letter);
                  morseBufferRef.current = '';
                }
                wordTimerRef.current = setTimeout(() => {
                  addWordSpace();
                  setReceivedMorse(m => m + '  ');
                }, dotLen * 4);
              }, dotLen * 3);`,
  `              const dl = 1200 / wpm;
              letterTimerRef.current = setTimeout(() => {
                if (morseBufferRef.current) {
                  const letter = MORSE_MAP[morseBufferRef.current] || '?';
                  setReceivedMorse(m => m + morseBufferRef.current + ' ');
                  addLetter(letter);
                  morseBufferRef.current = '';
                }
                wordTimerRef.current = setTimeout(() => {
                  addWordSpace();
                  setReceivedMorse(m => m + '  ');
                }, dl * 4);
              }, dl * 3);`
);

// Also raise threshold from baseline+20 to baseline+30
src = src.replace(
  "thresholdRef.current = baselineRef.current + 20;",
  "thresholdRef.current = baselineRef.current + 30;"
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed flash timing");
