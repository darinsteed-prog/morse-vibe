const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Fix messageCallback - morse-pro passes {message, timings} object
// Also add speedCallback to update WPM display
src = src.replace(
  `      decoder.messageCallback = (data: any) => {
        const char = data.message ?? data;
        if (char && char !== ' ') {
          setDecodedText(prev => {
            const next = prev + String(char).toUpperCase();
            setSuggestions(getSuggestions(next));
            return next;
          });
        } else if (char === ' ') {
          setDecodedText(prev => prev.endsWith(" ") ? prev : prev + " ");
          setSuggestions([]);
        }
      };`,
  `      decoder.messageCallback = (data: any) => {
        // morse-pro passes full decoded string in data.message
        const msg = typeof data === 'string' ? data : (data?.message ?? data?.character ?? '');
        if (!msg) return;
        const upper = String(msg).toUpperCase();
        if (upper === ' ' || upper === '/') {
          setDecodedText(prev => prev.endsWith(" ") ? prev : prev + " ");
          setSuggestions([]);
        } else {
          setDecodedText(prev => {
            const next = prev + upper;
            setSuggestions(getSuggestions(next));
            return next;
          });
        }
      };

      decoder.speedCallback = (data: any) => {
        const speed = data?.wpm ?? data;
        if (speed && speed > 0) setWpm(Math.round(speed));
      };`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed messageCallback and added speedCallback");
