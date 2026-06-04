const fs = require("fs");
const file = "src/App.tsx";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  `import { ReferenceMode } from './components/ReferenceMode';`,
  `import { ReferenceMode } from './components/ReferenceMode';
import { HelpMode } from './components/HelpMode';`
);
src = src.replace(
  `const modes = ['type', 'tap', 'img', 'qr', 'sound', 'flash', 'remote', 'atc', 'decipher', 'ref'];`,
  `const modes = ['type', 'tap', 'img', 'qr', 'sound', 'flash', 'remote', 'atc', 'decipher', 'ref', 'help'];`
);
src = src.replace(
  `decipher: 'Fix', ref: 'Guide'`,
  `decipher: 'Fix', ref: 'Guide', help: 'Help'`
);
src = src.replace(
  `: inputMode === 'ref' ? (<ReferenceMode />) : inputMode === 'atc'`,
  `: inputMode === 'ref' ? (<ReferenceMode />) : inputMode === 'help' ? (<HelpMode />) : inputMode === 'atc'`
);
src = src.replace(
  `inputMode !== 'decipher' && inputMode !== 'ref' && <div className='mt-8 mb-4'>`,
  `inputMode !== 'decipher' && inputMode !== 'ref' && inputMode !== 'help' && <div className='mt-8 mb-4'>`
);
src = src.replace(
  `inputMode !== 'decipher' && inputMode !== 'ref' &&`,
  `inputMode !== 'decipher' && inputMode !== 'ref' && inputMode !== 'help' &&`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added Help tab");
