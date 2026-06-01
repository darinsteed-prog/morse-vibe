const fs = require('fs');
let c = fs.readFileSync('src/components/ImageMode.tsx', 'utf8');

const old = `      <button onClick={() => fileRef.current?.click()} disabled={isTransmitting || loading}
        className="w-full py-6 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-vibe-primary/40 hover:bg-vibe-primary/5 transition-all disabled:opacity-30">
        <ImageIcon className="w-7 h-7 text-white/20" />
        <span className="text-base font-mono text-white/40 uppercase tracking-wider">{loading?'Processing...':'Tap to select image'}</span>
      </button>`;

const newCode = `      <div className="flex gap-2">
        <button onClick={() => fileRef.current?.click()} disabled={isTransmitting || loading}
          className="flex-1 py-4 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-vibe-primary/40 hover:bg-vibe-primary/5 transition-all disabled:opacity-30">
          <ImageIcon className="w-6 h-6 text-white/20" />
          <span className="text-[12px] font-mono text-white/40 uppercase tracking-wider">{loading?'Processing...':'Gallery'}</span>
        </button>
        <button onClick={() => cameraRef.current?.click()} disabled={isTransmitting || loading}
          className="flex-1 py-4 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-vibe-primary/40 hover:bg-vibe-primary/5 transition-all disabled:opacity-30">
          <ImageIcon className="w-6 h-6 text-white/20" />
          <span className="text-[12px] font-mono text-white/40 uppercase tracking-wider">{loading?'Processing...':'Camera'}</span>
        </button>
      </div>`;

c = c.replace(old, newCode);
fs.writeFileSync('src/components/ImageMode.tsx', c);
console.log('Done:', c.includes('Camera') ? 'applied' : 'FAILED');
