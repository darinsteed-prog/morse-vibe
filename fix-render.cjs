const fs = require("fs");
const file = "src/App.tsx";
let src = fs.readFileSync(file, "utf8");

const target = `: inputMode === 'flash' ? (<FlashMode text={text} isTransmitting={isTransmitting} />) : inputMode === 'atc'`;
const replacement = `: inputMode === 'flash' ? (<FlashMode text={text} isTransmitting={isTransmitting} />) : inputMode === 'listen' ? (<ListenMode />) : inputMode === 'atc'`;

if (src.includes(target)) {
  src = src.replace(target, replacement);
  fs.writeFileSync(file, src, "utf8");
  console.log("✔ Render case added");
} else {
  // find what's actually there
  const idx = src.indexOf("FlashMode text={text}");
  console.log("FlashMode context:", src.substring(idx - 20, idx + 120));
}
