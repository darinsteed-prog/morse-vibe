const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Trigger suggestions on every char, never clear them
src = src.replace(
  `    } else {
      setDecodedText(prev => prev + upper);
    }`,
  `    } else {
      setDecodedText(prev => {
        const next = prev + upper;
        // Check last partial word for suggestions
        const words = next.trimEnd().split(" ");
        const lastWord = words[words.length - 1];
        if (lastWord && lastWord.length >= 2 && !WORDS.includes(lastWord)) {
          const newSug = getSuggestions(next);
          if (newSug.length > 0) {
            suggestionsRef.current = newSug;
            setSuggestions(newSug);
          }
        }
        return next;
      });
    }`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Suggestions trigger on every character");
