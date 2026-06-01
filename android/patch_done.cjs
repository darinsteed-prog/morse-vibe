const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

// Make done button sticky at bottom
c = c.replace(
  '<button onClick={() => setShowSettings(false)} className="w-full mt-8 py-4 rounded-xl bg-white/10 text-white font-bold uppercase tracking-widest">Done</button>',
  '<div className="sticky bottom-0 pt-4 pb-2 bg-vibe-surface"><button onClick={() => setShowSettings(false)} className="w-full py-4 rounded-xl bg-white/10 text-white font-bold uppercase tracking-widest">Done</button></div>'
);

fs.writeFileSync('src/App.tsx', c);
console.log('Done:', c.includes('sticky bottom-0') ? 'applied' : 'FAILED');
