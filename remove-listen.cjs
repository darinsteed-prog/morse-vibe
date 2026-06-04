const fs = require("fs");
const file = "src/App.tsx";
let src = fs.readFileSync(file, "utf8");

// Remove listen from modes array
src = src.replace(
  `'listen', 'decipher', 'ref'`,
  `'decipher', 'ref'`
);

// Remove listen label
src = src.replace(`, listen: 'Listen'`, ``);

// Remove ListenMode import
src = src.replace(`import { ListenMode } from './components/ListenMode';\n`, ``);

// Remove ListenMode render case
src = src.replace(`: inputMode === 'listen' ? (<ListenMode />) : inputMode === 'decipher'`, `: inputMode === 'decipher'`);

// Remove listen from button/translation exclusions
src = src.replace(` && inputMode !== 'listen'`, ``);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Removed Listen tab");
