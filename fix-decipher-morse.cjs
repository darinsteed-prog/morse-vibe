const fs = require("fs");
const file = "src/components/DecipherMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Add morse decoder at top if not there
if (!src.includes("MORSE_TO_CHAR")) {
  src = src.replace(
    `interface WordResult {`,
    `const MORSE_TO_CHAR: Record<string,string> = {".-":"A","-...":"B","-.-.":"C","-..":"D",".":"E","..-.":"F","--.":"G","....":"H","..":"I",".---":"J","-.-":"K",".-..":"L","--":"M","-.":"N","---":"O",".--.":"P","--.-":"Q",".-.":"R","...":"S","-":"T","..-":"U","...-":"V",".--":"W","-..-":"X","-.--":"Y","--..":"Z","-----":"0",".----":"1","..---":"2","...--":"3","....-":"4",".....":"5","-....":"6","--...":"7","---..":"8","----.":"9"};

function isMorse(text: string): boolean {
  return /^[.\-\s\/]+$/.test(text.trim()) && (text.includes(".") || text.includes("-"));
}

function decodeMorse(text: string): string {
  return text.trim().split("   ").map(word =>
    word.trim().split(" ").filter(Boolean).map(sym => MORSE_TO_CHAR[sym] || "?").join("")
  ).join(" ");
}

interface WordResult {`
  );
  console.log("✔ Added morse decoder");
}

// Fix analyse to auto-detect and decode morse
src = src.replace(
  `  const analyse = () => {
    if (!inputText.trim()) return;
    const words = inputText.trim().toUpperCase().split(/\\s+/);`,
  `  const analyse = () => {
    if (!inputText.trim()) return;
    const upper = inputText.trim().toUpperCase();
    // Auto-decode morse if input looks like morse code
    const text = isMorse(upper) ? decodeMorse(upper) : upper;
    const words = text.split(/\\s+/);`
);

// Fix words reference
src = src.replace(
  `    setResults(words.map(word => ({`,
  `    setResults(words.filter(Boolean).map(word => ({`
);

fs.writeFileSync(file, src, "utf8");
console.log("Done");
