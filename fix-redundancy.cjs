const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Add redundancy state after suggestions state
src = src.replace(
  `  const [suggestions, setSuggestions] = useState<string[]>([]);`,
  `  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [attempt1, setAttempt1] = useState<string>("");
  const [combined, setCombined] = useState<string>("");
  const attemptCountRef = useRef(0);`
);

// Add combine function before appendChar
src = src.replace(
  `  const appendChar = (char: string) => {`,
  `  const combineAttempts = (a: string, b: string): string => {
    const wa = a.trim().split(/\s+/);
    const wb = b.trim().split(/\s+/);
    const result: string[] = [];
    const len = Math.max(wa.length, wb.length);
    for (let i = 0; i < len; i++) {
      const wordA = wa[i] || "";
      const wordB = wb[i] || "";
      if (!wordA) { result.push(wordB); continue; }
      if (!wordB) { result.push(wordA); continue; }
      if (wordA === wordB) { result.push(wordA); continue; }
      // Different - pick the one in dictionary, or combine char by char
      if (WORDS.includes(wordA)) { result.push(wordA); continue; }
      if (WORDS.includes(wordB)) { result.push(wordB); continue; }
      // Combine char by char - prefer non ? and non-noise chars
      const len2 = Math.max(wordA.length, wordB.length);
      let combined = "";
      for (let j = 0; j < len2; j++) {
        const ca = wordA[j] || "?";
        const cb = wordB[j] || "?";
        if (ca === cb) combined += ca;
        else if (ca === "?") combined += cb;
        else if (cb === "?") combined += ca;
        else combined += ca; // both different - keep first
      }
      result.push(combined);
    }
    return result.join(" ");
  };

  const appendChar = (char: string) => {`
);

// Track attempts - when decoded text gets a word space after content, save as attempt
src = src.replace(
  `    if (upper === ' ' || upper === '/') {
        setDecodedText(prev => {
          const trimmed = prev.trimEnd();
          const words = trimmed.split(" ");
          const lastWord = words[words.length - 1];
          if (lastWord && !WORDS.includes(lastWord)) {
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
          }
          return prev.endsWith(" ") ? prev : prev + " ";
        });`
);

// Add attempt comparison UI - add after decoded output box
src = src.replace(
  `      {suggestions.length > 0 && (`,
  `      {attempt1 && combined && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] font-mono text-green-400/60 uppercase tracking-wider">Combined (2 attempts)</span>
            <p className="font-mono text-lg text-green-400/90 break-all">{combined}</p>
          </div>
        )}
      {suggestions.length > 0 && (`
);

// Add Compare button near reset button
src = src.replace(
  `          <button onClick={reset} className="text-white/20 hover:text-white/50 transition-colors p-1">
            <RotateCcw className="w-3 h-3" />
          </button>`,
  `          <div className="flex gap-2 items-center">
            {decodedText.trim() && !attempt1 && (
              <button onClick={() => { setAttempt1(decodedText.trim()); attemptCountRef.current = 1; setDecodedText(""); setSuggestions([]); }}
                className="text-[10px] font-mono text-blue-400/60 hover:text-blue-400 border border-blue-400/20 rounded px-2 py-0.5">
                Save #1
              </button>
            )}
            {decodedText.trim() && attempt1 && (
              <button onClick={() => { const c = combineAttempts(attempt1, decodedText.trim()); setCombined(c); }}
                className="text-[10px] font-mono text-green-400/60 hover:text-green-400 border border-green-400/20 rounded px-2 py-0.5">
                Compare
              </button>
            )}
            <button onClick={reset} className="text-white/20 hover:text-white/50 transition-colors p-1">
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>`
);

// Clear attempts on full reset
src = src.replace(
  `  const reset = () => {
    setDecodedText("");
    setSuggestions([]);`,
  `  const reset = () => {
    setDecodedText("");
    setSuggestions([]);
    setAttempt1("");
    setCombined("");
    attemptCountRef.current = 0;`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added redundancy decoding");
