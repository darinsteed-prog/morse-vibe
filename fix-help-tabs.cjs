const fs = require("fs");
const file = "src/App.tsx";
let src = fs.readFileSync(file, "utf8");

// Add help for decipher tab
src = src.replace(
  `{inputMode==='atc' && <div className='flex flex-col gap-3 text-base font-mono text-white/60'>`,
  `{inputMode==='decipher' && <div className='flex flex-col gap-3 text-base font-mono text-white/60'>
                <p><span className='text-white font-bold'>Fix tab</span> — Correct garbled morse decoded text.</p>
                <p>After using the Listen tab or Flash receiver, copy the decoded text and paste it here.</p>
                <p>Tap <span className='text-vibe-primary'>Analyse Text</span> — each word is shown as a card.</p>
                <p><span className='text-vibe-primary'>Green words</span> are recognised correctly. <span className='text-vibe-primary'>Yellow words</span> have suggestions.</p>
                <p>Tap a suggestion button to replace the wrong word. Tap <span className='text-vibe-primary'>Copy</span> to copy the corrected text.</p>
              </div>}
              {inputMode==='ref' && <div className='flex flex-col gap-3 text-base font-mono text-white/60'>
                <p><span className='text-white font-bold'>Guide tab</span> — Morse code reference guide. Works offline.</p>
                <p><span className='text-vibe-primary'>A-Z</span> — Full alphabet and numbers with visual dot/dash display. Searchable.</p>
                <p><span className='text-vibe-primary'>Radio</span> — Standard ham radio prosigns and Q-codes with meanings.</p>
                <p><span className='text-vibe-primary'>SOS</span> — Emergency phrases in morse. SOS is three dots, three dashes, three dots with no spaces.</p>
                <p><span className='text-vibe-primary'>Timing</span> — WPM speed reference and how to read morse by ear using dit and dah.</p>
              </div>}
              {inputMode==='atc' && <div className='flex flex-col gap-3 text-base font-mono text-white/60'>`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added help for Fix and Guide tabs");
