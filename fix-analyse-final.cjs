const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Remove debug alert
src = src.replace(
  `    alert("Analyse tapped. Text: [" + text + "] Length: " + text.length);\n    if (!text) return;`,
  `    if (!text) return;`
);

// Use decodedText state directly instead of decodedRef
src = src.replace(
  `    const text = decodedRef.current.trim().toUpperCase();`,
  `    const text = decodedText.trim().toUpperCase();`
);

// Tighten match from 50% to 70%
src = src.replace(
  `        if (matches >= Math.ceil(word.length * 0.5)) found.push(w);`,
  `        if (matches >= Math.ceil(word.length * 0.7)) found.push(w);`
);

// Remove fallback that shows random words
src = src.replace(
  `    if (found.length > 0) {
      setSuggestions(found.slice(0, 6));
    } else {
      // No close matches - show words of same length as unrecognised words
      const unknownLengths = words.filter(w => w.length >= 2 && !WORDS.includes(w)).map(w => w.length);
      const byLength = WORDS.filter(w => unknownLengths.includes(w.length)).slice(0, 6);
      setSuggestions(byLength.length > 0 ? byLength : ["NO MATCHES FOUND"]);
    }`,
  `    setSuggestions(found.slice(0, 6));
    if (found.length === 0) setSuggestions(["No close matches found"]);`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed analyse");
