const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Remove the setSuggestions([]) that clears on word space
// Keep suggestions visible until user taps one or resets
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
          setSuggestions(prev => {
            const newSuggestions = getSuggestions(trimmed);
            // Keep existing suggestions if no new ones found
            return newSuggestions.length > 0 ? newSuggestions : prev;
          });
        }
        // Do NOT clear suggestions on word space
        return prev.endsWith(" ") ? prev : prev + " ";
      });`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Suggestions now stay visible");
