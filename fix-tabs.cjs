const fs = require("fs");
const file = "src/App.tsx";
let src = fs.readFileSync(file, "utf8");

// Add imports after listen import
if (!src.includes("DecipherMode")) {
  src = src.replace(
    `import { ListenMode } from './components/ListenMode';`,
    `import { ListenMode } from './components/ListenMode';
import { DecipherMode } from './components/DecipherMode';
import { ReferenceMode } from './components/ReferenceMode';`
  );
  console.log("✔ Added imports");
}

// Update modes array
src = src.replace(
  `const modes = ['type', 'tap', 'img', 'qr', 'sound', 'flash', 'remote', 'atc', 'listen'];`,
  `const modes = ['type', 'tap', 'img', 'qr', 'sound', 'flash', 'remote', 'atc', 'listen', 'decipher', 'ref'];`
);

// Update labels
src = src.replace(
  `atc: 'Air', listen: 'Listen'`,
  `atc: 'Air', listen: 'Listen', decipher: 'Fix', ref: 'Guide'`
);

// Add render cases
src = src.replace(
  `: inputMode === 'listen' ? (<ListenMode />) : inputMode === 'atc'`,
  `: inputMode === 'listen' ? (<ListenMode />) : inputMode === 'decipher' ? (<DecipherMode />) : inputMode === 'ref' ? (<ReferenceMode />) : inputMode === 'atc'`
);

// Hide Start Vibe button on new tabs
src = src.replace(
  `inputMode !== 'atc' && inputMode !== 'listen' && <div className='mt-8 mb-4'>`,
  `inputMode !== 'atc' && inputMode !== 'listen' && inputMode !== 'decipher' && inputMode !== 'ref' && <div className='mt-8 mb-4'>`
);

// Hide morse translation on new tabs
src = src.replace(
  `text && inputMode !== 'atc' && inputMode !== 'listen' &&`,
  `text && inputMode !== 'atc' && inputMode !== 'listen' && inputMode !== 'decipher' && inputMode !== 'ref' &&`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Done");
