const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

// Move settings panel up - change items-end to items-center
c = c.replace(
  'className="fixed bottom-0 left-0 right-0 bg-vibe-surface border-t border-white/10 rounded-t-3xl p-6 z-50 max-h-[85vh] overflow-y-auto"><div className="flex justify-between items-center mb-6"><h2 className="font-bold text-2xl uppercase tracking-widest">Signal Settings</h2>',
  'className="fixed bottom-0 left-0 right-0 bg-vibe-surface border-t border-white/10 rounded-t-3xl p-6 z-50 max-h-[75vh] overflow-y-auto mt-20"><div className="flex justify-between items-center mb-6"><h2 className="font-bold text-2xl uppercase tracking-widest">Signal Settings</h2>'
);

// Add dot/dash timing and vibration strength settings after visualFlash toggle
const old = `<div className="flex flex-col gap-4"><h3 className="text-base font-mono uppercase tracking-wider text-white/60">Encryption</h3>`;
const newCode = `<div className="flex flex-col gap-4"><h3 className="text-base font-mono uppercase tracking-wider text-white/60">Timing</h3>
<div className="flex flex-col gap-2 p-4 bg-white/5 rounded-xl">
  <div className="flex justify-between"><span className="text-base font-bold">Dot Duration</span><span className="text-base font-mono text-vibe-primary">{settings.dotDuration}ms</span></div>
  <input type="range" min={50} max={300} step={10} value={settings.dotDuration} onChange={e=>setSettings({...settings,dotDuration:+e.target.value})} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary" />
</div>
<div className="flex flex-col gap-2 p-4 bg-white/5 rounded-xl">
  <div className="flex justify-between"><span className="text-base font-bold">Dash Duration</span><span className="text-base font-mono text-vibe-primary">{settings.dashDuration}ms</span></div>
  <input type="range" min={150} max={600} step={10} value={settings.dashDuration} onChange={e=>setSettings({...settings,dashDuration:+e.target.value})} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary" />
</div>
<div className="flex flex-col gap-2 p-4 bg-white/5 rounded-xl">
  <div className="flex justify-between"><span className="text-base font-bold">Letter Gap</span><span className="text-base font-mono text-vibe-primary">{settings.letterSpace}ms</span></div>
  <input type="range" min={100} max={800} step={50} value={settings.letterSpace} onChange={e=>setSettings({...settings,letterSpace:+e.target.value})} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary" />
</div>
<div className="flex flex-col gap-2 p-4 bg-white/5 rounded-xl">
  <div className="flex justify-between"><span className="text-base font-bold">Word Gap</span><span className="text-base font-mono text-vibe-primary">{settings.wordSpace}ms</span></div>
  <input type="range" min={200} max={1500} step={50} value={settings.wordSpace} onChange={e=>setSettings({...settings,wordSpace:+e.target.value})} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary" />
</div>
</div><div className="flex flex-col gap-4"><h3 className="text-base font-mono uppercase tracking-wider text-white/60">Encryption</h3>`;

c = c.replace(old, newCode);
fs.writeFileSync('src/App.tsx', c);
console.log('Done:', c.includes('dotDuration}ms') ? 'applied' : 'FAILED');
