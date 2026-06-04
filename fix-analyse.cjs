const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Remove all automatic suggestion triggering from appendChar
src = src.replace(
  `    if (upper === ' ' || upper === '/') {
      setDecodedText(prev => {
        const trimmed = prev.trimEnd();
        const words = trimmed.split(" ");
        const lastWord = words[words.length - 1];
        if (lastWord && !WORDS.includes(lastWord)) {
          const newSuggestions = getSuggestions(trimmed);
          if (newSuggestions.length > 0) {
            suggestionsRef.current = newSuggestions;
            setSuggestions(newSuggestions);
          }
          // Don't clear if no new suggestions found
        }
        return prev.endsWith(" ") ? prev : prev + " ";
      });
    } else {
      setDecodedText(prev => {
        const next = prev + upper;
        const newSuggestions = getSuggestions(next);
        if (newSuggestions.length > 0) {
          suggestionsRef.current = newSuggestions;
          setSuggestions(newSuggestions);
        }
        return next;
      });
    }`,
  `    if (upper === ' ' || upper === '/') {
      setDecodedText(prev => prev.endsWith(" ") ? prev : prev + " ");
    } else {
      setDecodedText(prev => prev + upper);
    }`
);

// Add analyse function before acceptSuggestion
src = src.replace(
  `  const acceptSuggestion = (word: string) => {`,
  `  const analyse = () => {
    if (!decodedText.trim()) return;
    const words = decodedText.trim().split(" ");
    const allSuggestions: string[] = [];
    words.forEach(word => {
      if (word.length >= 2 && !WORDS.includes(word)) {
        const s = getSuggestions(word + " ");
        s.forEach(sug => {
          if (!allSuggestions.includes(sug)) allSuggestions.push(sug);
        });
      }
    });
    suggestionsRef.current = allSuggestions.slice(0, 6);
    setSuggestions(allSuggestions.slice(0, 6));
  };

  const acceptSuggestion = (word: string) => {`
);

// Add Analyse button next to reset button
src = src.replace(
  `          <button onClick={reset} className="text-white/20 hover:text-white/50 transition-colors p-1">
            <RotateCcw className="w-3 h-3" />
          </button>`,
  `          <div className="flex gap-2">
            <button onClick={analyse} disabled={!decodedText.trim()}
              className="text-[11px] font-mono text-yellow-400/60 hover:text-yellow-400 border border-yellow-400/20 rounded-lg px-2 py-1 disabled:opacity-30">
              Analyse
            </button>
            <button onClick={reset} className="text-white/20 hover:text-white/50 transition-colors p-1">
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added Analyse button");
