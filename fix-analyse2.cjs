const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
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
  };`,
  `  const analyse = () => {
    if (!decodedText.trim()) return;
    const words = decodedText.trim().toUpperCase().split(/\s+/);
    const allSuggestions: string[] = [];
    words.forEach(word => {
      if (word.length >= 2 && !WORDS.includes(word)) {
        // Try exact pattern match first
        const exact = WORDS.filter(w => {
          if (w.length !== word.length) return false;
          let matches = 0;
          for (let i = 0; i < word.length; i++) {
            if (word[i] === w[i]) matches++;
          }
          return matches >= Math.ceil(word.length * 0.5);
        });
        exact.forEach(s => { if (!allSuggestions.includes(s)) allSuggestions.push(s); });
      }
    });
    suggestionsRef.current = allSuggestions.slice(0, 6);
    setSuggestions(allSuggestions.slice(0, 6));
    if (allSuggestions.length === 0) {
      // Force show even if no match - show closest words by length
      const lens = words.filter(w => w.length >= 2 && !WORDS.includes(w)).map(w => w.length);
      const byLen = WORDS.filter(w => lens.includes(w.length)).slice(0, 4);
      suggestionsRef.current = byLen;
      setSuggestions(byLen);
    }
  };`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed analyse function");
