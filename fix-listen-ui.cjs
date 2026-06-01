const fs = require("fs");
const file = "src/App.tsx";
let src = fs.readFileSync(file, "utf8");

// Hide Start Vibe button on listen tab
src = src.replace(
  `{inputMode !== 'atc' && <div className='mt-8 mb-4'>`,
  `{inputMode !== 'atc' && inputMode !== 'listen' && <div className='mt-8 mb-4'>`
);

// Hide morse translation box on listen tab
src = src.replace(
  `{text && inputMode !== 'atc' &&`,
  `{text && inputMode !== 'atc' && inputMode !== 'listen' &&`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Done");
