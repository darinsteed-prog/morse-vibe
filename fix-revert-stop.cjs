const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Revert stop fix - remove audioContext close and decoder flush
src = src.replace(
  `  const stopListening = () => {
    if (listenerRef.current) {
      try { listenerRef.current.stopListening(); } catch(e) {}
      try { listenerRef.current.audioContext?.close(); } catch(e) {}
      listenerRef.current = null;
    }
    if (decoderRef.current) {
      try { decoderRef.current.flush(); } catch(e) {}
      decoderRef.current = null;
    }
    setListening(false);
    setToneActive(false);
    setSignalLevel(0);
    setLockedFreq(null);
    setStatusMsg("Tap Start then play morse near phone");
  };`,
  `  const stopListening = () => {
    if (listenerRef.current) {
      try { listenerRef.current.stopListening(); } catch(e) {}
      listenerRef.current = null;
    }
    setListening(false);
    setToneActive(false);
    setSignalLevel(0);
    setLockedFreq(null);
    setStatusMsg("Tap Start then play morse near phone");
  };`
);

// Revert suggestion fix
src = src.replace(
  `    if (upper === ' ' || upper === '/') {
        setDecodedText(prev => {
          const trimmed = prev.trimEnd();
          const words = trimmed.split(" ");
          const lastWord = words[words.length - 1];
          if (lastWord && !WORDS.includes(lastWord) && lastWord.length > 1) {
            setSuggestions(getSuggestions(trimmed));
          }
          return prev.endsWith(" ") ? prev : prev + " ";
        });`,
  `    if (upper === ' ' || upper === '/') {
        setDecodedText(prev => {
          const trimmed = prev.trimEnd();
          const words = trimmed.split(" ");
          const lastWord = words[words.length - 1];
          if (lastWord && !WORDS.includes(lastWord)) {
            setSuggestions(getSuggestions(trimmed));
          } else {
            setSuggestions([]);
          }
          return prev.endsWith(" ") ? prev : prev + " ";
        });`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Reverted");
