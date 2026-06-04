const fs = require("fs");
const file = "src/App.tsx";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  `import { DecipherMode } from './components/DecipherMode';`,
  `import { DecipherMode } from './components/DecipherMode';
import { ReferenceMode } from './components/ReferenceMode';`
);

src = src.replace(
  `const modes = ['type', 'tap', 'img', 'qr', 'sound', 'flash', 'remote', 'atc', 'listen', 'decipher'];`,
  `const modes = ['type', 'tap', 'img', 'qr', 'sound', 'flash', 'remote', 'atc', 'listen', 'decipher', 'ref'];`
);

src = src.replace(
  `listen: 'Listen', decipher: 'Fix'`,
  `listen: 'Listen', decipher: 'Fix', ref: 'Guide'`
);

src = src.replace(
  `: inputMode === 'decipher' ? (<DecipherMode />) : inputMode === 'atc'`,
  `: inputMode === 'decipher' ? (<DecipherMode />) : inputMode === 'ref' ? (<ReferenceMode />) : inputMode === 'atc'`
);

src = src.replace(
  `inputMode !== 'decipher' && <div className='mt-8 mb-4'>`,
  `inputMode !== 'decipher' && inputMode !== 'ref' && <div className='mt-8 mb-4'>`
);

src = src.replace(
  `inputMode !== 'decipher' &&`,
  `inputMode !== 'decipher' && inputMode !== 'ref' &&`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added Guide tab");
