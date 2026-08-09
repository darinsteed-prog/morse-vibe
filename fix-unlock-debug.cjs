const fs = require("fs");
const file = "src/pro.tsx";
let src = fs.readFileSync(file, "utf8");
src = src.replace(
  "  const [isPro, setIsPro] = useState(false);",
  "  const [isPro, setIsPro] = useState(true); // Unlocked for testing"
);
fs.writeFileSync(file, src, "utf8");
console.log("✔ Unlocked for testing");
