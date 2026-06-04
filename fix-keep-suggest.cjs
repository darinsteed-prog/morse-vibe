const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Only update suggestions if new ones found - never clear them on new chars
src = src.replace(
  `    } else {
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
  `    } else {
      setDecodedText(prev => prev + upper);
    }`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed - suggestions only update on word space, never clear on new chars");
