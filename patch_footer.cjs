const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');
c = c.replace("<footer className='mt-auto pt-8 text-center'><p className='text-[12px] font-mono text-white/20 uppercase tracking-[0.2em]'>Optimised for Wearable Browsers</p></footer>", "");
fs.writeFileSync('src/App.tsx', c);
console.log('Done:', c.includes('Wearable') ? 'STILL THERE' : 'removed');
