const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Add alert to confirm button fires
src = src.replace(
  `  const analyse = () => {
    const text = decodedRef.current.trim().toUpperCase();
    if (!text) return;`,
  `  const analyse = () => {
    const text = decodedRef.current.trim().toUpperCase();
    alert("Analyse tapped. Text: [" + text + "] Length: " + text.length);
    if (!text) return;`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added debug alert");
