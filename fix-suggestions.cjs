const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Replace getSuggestions to also match non-? words
src = src.replace(
  `const getSuggestions = (text: string): string[] => {
  const words = text.trimEnd().split(" ");
  const last = words[words.length - 1];
  if (!last || !last.includes("?")) return [];
  return WORDS.filter(w => {
    if (w.length !== last.length) return false;
    for (let i = 0; i < last.length; i++) {
      if (last[i] !== "?" && last[i] !== w[i]) return false;
    }
    return true;
  }).slice(0, 4);
};`,
  `const getSuggestions = (text: string): string[] => {
  const words = text.trimEnd().split(" ");
  const last = words[words.length - 1];
  if (!last || last.length < 2) return [];
  // Exact match - no suggestions needed
  if (WORDS.includes(last)) return [];
  // Pattern match with ? wildcards
  if (last.includes("?")) {
    return WORDS.filter(w => {
      if (w.length !== last.length) return false;
      for (let i = 0; i < last.length; i++) {
        if (last[i] !== "?" && last[i] !== w[i]) return false;
      }
      return true;
    }).slice(0, 4);
  }
  // Fuzzy match - find words with same length and at least 60% matching chars
  return WORDS.filter(w => {
    if (w.length !== last.length) return false;
    let matches = 0;
    for (let i = 0; i < last.length; i++) {
      if (last[i] === w[i]) matches++;
    }
    return matches >= Math.ceil(last.length * 0.6) && matches < last.length;
  }).slice(0, 4);
};`
);

// Also trigger suggestions when word space is detected
src = src.replace(
  `        if (upper === ' ' || upper === '/') {
          setDecodedText(prev => prev.endsWith(" ") ? prev : prev + " ");
          setSuggestions([]);`,
  `        if (upper === ' ' || upper === '/') {
          setDecodedText(prev => {
            const next = prev.endsWith(" ") ? prev : prev + " ";
            // Check the word that just completed
            const completedWords = next.trimEnd().split(" ");
            const lastWord = completedWords[completedWords.length - 1];
            if (lastWord && !WORDS.includes(lastWord)) {
              setSuggestions(getSuggestions(next.trimEnd()));
            } else {
              setSuggestions([]);
            }
            return next;
          });`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed suggestions to work without ?");
