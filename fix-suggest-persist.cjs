const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Don't clear suggestions on word space - keep them visible
src = src.replace(
  `      } else {
            setSuggestions([]);
          }
          return prev.endsWith(" ") ? prev : prev + " ";`,
  `      }
          return prev.endsWith(" ") ? prev : prev + " ";`
);

// Clear suggestions only when Start is pressed
src = src.replace(
  `    setDecodedText("");
    setSuggestions([]);
    setLockedFreq(null);`,
  `    setDecodedText("");
    setSuggestions([]);
    setLockedFreq(null);
    setStatusMsg("Tap Start then play morse near phone");`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Suggestions now persist until next session");
