const fs = require("fs");
const file = "src/components/RemoteTab.tsx";
let src = fs.readFileSync(file, "utf8");

// Add inputMode="text" and autocomplete off to BT input for better Android keyboard
src = src.replace(
  `placeholder={btSendMode === 'morse' ? 'Type text → sends as morse...' : 'Type message...'}
                  className="flex-1 bg-vibe-surface border border-white/10 rounded-xl px-4 py-3 text-base font-mono placeholder:text-white/20 focus:outline-none"
                  onKeyDown={e => e.key === 'Enter' && sendBtMessage()}/>`,
  `placeholder={btSendMode === 'morse' ? 'Type text → sends as morse...' : 'Type message...'}
                  className="flex-1 bg-vibe-surface border border-white/10 rounded-xl px-4 py-3 text-base font-mono placeholder:text-white/20 focus:outline-none"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  onKeyDown={e => e.key === 'Enter' && sendBtMessage()}
                  onSubmit={() => sendBtMessage()}/>`
);

// Same for LoRa input
src = src.replace(
  `placeholder={loraSendMode === 'morse' ? 'Type text → sends as morse...' : 'Type message...'}
                  className="flex-1 bg-vibe-surface border border-white/10 rounded-xl px-4 py-3 text-base font-mono placeholder:text-white/20 focus:outline-none"
                  onKeyDown={e => e.key === 'Enter' && sendLoraMessage()}/>`,
  `placeholder={loraSendMode === 'morse' ? 'Type text → sends as morse...' : 'Type message...'}
                  className="flex-1 bg-vibe-surface border border-white/10 rounded-xl px-4 py-3 text-base font-mono placeholder:text-white/20 focus:outline-none"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  onKeyDown={e => e.key === 'Enter' && sendLoraMessage()}
                  onSubmit={() => sendLoraMessage()}/>`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed keyboard inputs");
