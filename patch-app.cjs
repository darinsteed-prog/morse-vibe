// patch-app.js — adds Listen tab to App.tsx
const fs = require('fs');
const path = require('path');
const appPath = path.join(__dirname, 'src', 'App.tsx');
let src = fs.readFileSync(appPath, 'utf8');
let changed = false;

// 1. Add import
if (!src.includes('ListenMode')) {
  src = src.replace(
    `import { FlashMode } from './components/FlashMode';`,
    `import { FlashMode } from './components/FlashMode';\nimport { ListenMode } from './components/ListenMode';`
  );
  changed = true;
  console.log('✔ Added ListenMode import');
}

// 2. Add 'listen' to modes array
if (!src.includes("'listen'")) {
  src = src.replace(
    `const modes = ['type', 'tap', 'img', 'qr', 'sound', 'flash', 'remote', 'atc'];`,
    `const modes = ['type', 'tap', 'img', 'qr', 'sound', 'flash', 'remote', 'atc', 'listen'];`
  );
  changed = true;
  console.log('✔ Added listen to modes array');
}

// 3. Add label
if (!src.includes("listen: 'Listen'")) {
  src = src.replace(
    `atc: 'Air'`,
    `atc: 'Air', listen: 'Listen'`
  );
  changed = true;
  console.log('✔ Added Listen label');
}

// 4. Add render case — insert before the RemoteTab render
if (!src.includes('ListenMode')) {
  src = src.replace(
    `: inputMode === 'flash' ? (<FlashMode text={text} isTransmitting={isTransmitting} />) : inputMode === 'atc'`,
    `: inputMode === 'flash' ? (<FlashMode text={text} isTransmitting={isTransmitting} />) : inputMode === 'listen' ? (<ListenMode />) : inputMode === 'atc'`
  );
  changed = true;
  console.log('✔ Added ListenMode render case');
}

// 5. Hide Start Vibe button on listen tab (add 'listen' to atc exclusion)
if (!src.includes("inputMode !== 'listen'")) {
  src = src.replace(
    `{inputMode !== 'atc' && <div className='mt-8 mb-4'>`,
    `{inputMode !== 'atc' && inputMode !== 'listen' && <div className='mt-8 mb-4'>`
  );
  changed = true;
  console.log('✔ Hidden Start Vibe button on listen tab');
}

// 6. Hide morse translation on listen tab
if (!src.includes("inputMode !== 'listen'")) {
  // already done above — also patch the translation box
  src = src.replace(
    `{text && inputMode !== 'atc' &&`,
    `{text && inputMode !== 'atc' && inputMode !== 'listen' &&`
  );
  changed = true;
  console.log('✔ Hidden morse translation box on listen tab');
}

// 7. Add help text for listen tab
if (!src.includes("inputMode==='listen'")) {
  src = src.replace(
    `{inputMode==='atc' && <div className='flex flex-col gap-3 text-base font-mono text-white/60'>`,
    `{inputMode==='listen' && <div className='flex flex-col gap-3 text-base font-mono text-white/60'>
                <p><span className='text-white font-bold'>Listen tab</span> — Decode morse code from any audio source.</p>
                <p>Tap <span className='text-vibe-primary'>Start Listening</span> and hold your phone near a radio, speaker, or another phone playing morse tones.</p>
                <p>Adjust the <span className='text-vibe-primary'>Threshold</span> slider until only the morse signal triggers (above background noise).</p>
                <p>Set <span className='text-vibe-primary'>Expected Speed</span> to match the sender's WPM — this affects dot/dash detection.</p>
                <p>Works with ham radio, CW signals, the Sound tab on another phone, or any audio morse source.</p>
              </div>}
              {inputMode==='atc' && <div className='flex flex-col gap-3 text-base font-mono text-white/60'>`
  );
  changed = true;
  console.log('✔ Added help text for listen tab');
}

if (changed) {
  fs.writeFileSync(appPath, src, 'utf8');
  console.log('\n✅ App.tsx patched successfully');
} else {
  console.log('\nℹ No changes needed');
}
