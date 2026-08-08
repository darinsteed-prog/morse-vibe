const fs = require("fs");
const file = "src/pro.tsx";
let src = fs.readFileSync(file, "utf8");
src = src.replace(
  "  const [isPro, setIsPro] = useState(true); // Unlocked for testing",
  "  const [isPro, setIsPro] = useState(false);"
);
fs.writeFileSync(file, src, "utf8");
console.log("✔ Paywall re-enabled");
