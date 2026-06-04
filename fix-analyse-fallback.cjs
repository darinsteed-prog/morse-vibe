const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  `    setSuggestions(found.slice(0, 6));
  };`,
  `    if (found.length > 0) {
      setSuggestions(found.slice(0, 6));
    } else {
      // No close matches - show words of same length as unrecognised words
      const unknownLengths = words.filter(w => w.length >= 2 && !WORDS.includes(w)).map(w => w.length);
      const byLength = WORDS.filter(w => unknownLengths.includes(w.length)).slice(0, 6);
      setSuggestions(byLength.length > 0 ? byLength : ["NO MATCHES FOUND"]);
    }
  };`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added fallback suggestions");
