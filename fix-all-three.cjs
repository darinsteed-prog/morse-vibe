const fs = require("fs");

// Fix 1: Guide morse size
let ref = fs.readFileSync("src/components/ReferenceMode.tsx", "utf8");
ref = ref.replace(`<span className="text-xl tracking-widest">{dot(m)}</span>`, `<span className="text-3xl tracking-widest">{dot(m)}</span>`);
ref = ref.replace(`<span className="text-base tracking-widest">{dot(m)}</span>`, `<span className="text-2xl tracking-widest">{dot(m)}</span>`);
fs.writeFileSync("src/components/ReferenceMode.tsx", ref, "utf8");
console.log("✔ Fixed guide morse size");

// Fix 2: Decipher - add morse-to-text conversion so morse input works
let dec = fs.readFileSync("src/components/DecipherMode.tsx", "utf8");

// Add morse decoder before the component
const morseDecoder = `
const MORSE_TO_CHAR: Record<string,string> = {".-":"A","-...":"B","-.-.":"C","-..":"D",".":"E","..-.":"F","--.":"G","....":"H","..":"I",".---":"J","-.-":"K",".-..":"L","--":"M","-.":"N","---":"O",".--.":"P","--.-":"Q",".-.":"R","...":"S","-":"T","..-":"U","...-":"V",".--":"W","-..-":"X","-.--":"Y","--..":"Z","-----":"0",".----":"1","..---":"2","...--":"3","....-":"4",".....":"5","-....":"6","--...":"7","---..":"8","----.":"9"};

function decodeMorseInput(input: string): string {
  // Check if input looks like morse code (contains dots and dashes)
  if(!/^[.\-/ ]+$/.test(input.trim())) return input;
  return input.trim().split("   ").map(word =>
    word.trim().split(" ").map(sym => MORSE_TO_CHAR[sym] || "?").join("")
  ).join(" ");
}
`;

if (!dec.includes("MORSE_TO_CHAR")) {
  dec = dec.replace(`interface WordResult`, morseDecoder + `\ninterface WordResult`);
  console.log("✔ Added morse decoder to Fix tab");
}

// Auto-decode morse before analysing
dec = dec.replace(
  `  const analyse = () => {
    if (!inputText.trim()) return;
    const words = inputText.trim().toUpperCase().split(/\\s+/);`,
  `  const analyse = () => {
    if (!inputText.trim()) return;
    // Auto-decode if input is morse symbols
    const decoded = decodeMorseInput(inputText.trim().toUpperCase());
    const words = decoded.split(/\\s+/);`
);

// Show decoded version if morse was entered
dec = dec.replace(
  `  const getOutput = () => results.map(r => r.chosen).join(" ");`,
  `  const getOutput = () => results.map(r => r.chosen).join(" ");
  const inputWasMorse = /^[.\\-/ ]+$/.test(inputText.trim());`
);

fs.writeFileSync("src/components/DecipherMode.tsx", dec, "utf8");
console.log("✔ Fixed Fix tab to accept morse code input");

// Fix 3: Remove listen import if still there
let app = fs.readFileSync("src/App.tsx", "utf8");
if (app.includes("ListenMode")) {
  app = app.replace(`import { ListenMode } from './components/ListenMode';\n`, ``);
  app = app.replace(`: inputMode === 'listen' ? (<ListenMode />) : `, `: `);
  app = app.replace(` && inputMode !== 'listen'`, ``);
  fs.writeFileSync("src/App.tsx", app, "utf8");
  console.log("✔ Removed ListenMode references");
} else {
  console.log("ℹ ListenMode already removed");
}
