const fs = require('fs');
let c = fs.readFileSync('src/components/RemoteTab.tsx', 'utf8');

// Add sendMode state - insert after btSendText state
c = c.replace(
  "const [btSendText, setBtSendText] = useState('');",
  "const [btSendText, setBtSendText] = useState('');\n  const [btSendMode, setBtSendMode] = useState<'text'|'morse'|'qr'|'vibe'>('text');\n  const [loraSendMode, setLoraSendMode] = useState<'text'|'morse'|'qr'|'vibe'>('text');"
);

// Replace BitChat send section
const oldBtSend = `          {btConnected && (
            <div className="flex gap-2">
              <input type="text" value={btSendText} onChange={e=>setBtSendText(e.target.value)} placeholder="Send via Bluetooth..." className="flex-1 bg-vibe-surface border border-white/10 rounded-xl px-4 py-3 text-base font-mono placeholder:text-white/20 focus:outline-none" onKeyDown={e=>e.key==='Enter'&&sendBtMessage()}/>
              <button onClick={sendBtMessage} disabled={!btSendText.trim()} className="p-3 bg-vibe-primary rounded-xl disabled:opacity-30"><Send className="w-5 h-5"/></button>
            </div>
          )}`;

const newBtSend = `          {btConnected && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                {(['text','morse','qr','vibe'] as const).map(m=>(
                  <button key={m} onClick={()=>setBtSendMode(m)} className={\`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest \${btSendMode===m?'bg-white/15 text-white':'text-white/30'}\`}>{m}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={btSendText} onChange={e=>setBtSendText(e.target.value)} placeholder={\`Send as \${btSendMode}...\`} className="flex-1 bg-vibe-surface border border-white/10 rounded-xl px-4 py-3 text-base font-mono placeholder:text-white/20 focus:outline-none" onKeyDown={e=>e.key==='Enter'&&sendBtMessage()}/>
                <button onClick={()=>{
                  if(!btSendText.trim()) return;
                  const morseMap: Record<string,string> = {"A":".-","B":"-...","C":"-.-.","D":"-..","E":".","F":"..-.","G":"--.","H":"....","I":"..","J":".---","K":"-.-","L":".-..","M":"--","N":"-.","O":"---","P":".--.","Q":"--.-","R":".-.","S":"...","T":"-","U":"..-","V":"...-","W":".--","X":"-..-","Y":"-.--","Z":"--..","0":"-----","1":".----","2":"..---","3":"...--","4":"....-","5":".....","6":"-....","7":"--...","8":"---..","9":"----.","."};
                  let payload = btSendText;
                  if(btSendMode==='morse') payload = 'MORSE:'+btSendText.toUpperCase().split('').map(c=>c===' '?'/':morseMap[c]||'').filter(Boolean).join(' ');
                  else if(btSendMode==='qr') payload = 'QR:'+btSendText;
                  else if(btSendMode==='vibe') payload = 'VIBE:'+btSendText;
                  sendBtMessage(payload);
                }} disabled={!btSendText.trim()} className="p-3 bg-vibe-primary rounded-xl disabled:opacity-30"><Send className="w-5 h-5"/></button>
              </div>
            </div>
          )}`;

c = c.replace(oldBtSend, newBtSend);

// Replace LoRa send section
const oldLoraSend = `          {loraConnected && (
            <div className="flex gap-2">
              <input type="text" value={loraSendText} onChange={e=>setLoraSendText(e.target.value)} placeholder="Send via LoRa..." className="flex-1 bg-vibe-surface border border-white/10 rounded-xl px-4 py-3 text-base font-mono placeholder:text-white/20 focus:outline-none" onKeyDown={e=>e.key==='Enter'&&sendLoraMessage()}/>
              <button onClick={sendLoraMessage} disabled={!loraSendText.trim()} className="p-3 bg-vibe-primary rounded-xl disabled:opacity-30"><Send className="w-5 h-5"/></button>`;

const newLoraSend = `          {loraConnected && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                {(['text','morse','qr','vibe'] as const).map(m=>(
                  <button key={m} onClick={()=>setLoraSendMode(m)} className={\`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest \${loraSendMode===m?'bg-white/15 text-white':'text-white/30'}\`}>{m}</button>
                ))}
              </div>
              <div className="flex gap-2">
              <input type="text" value={loraSendText} onChange={e=>setLoraSendText(e.target.value)} placeholder={\`Send as \${loraSendMode}...\`} className="flex-1 bg-vibe-surface border border-white/10 rounded-xl px-4 py-3 text-base font-mono placeholder:text-white/20 focus:outline-none" onKeyDown={e=>e.key==='Enter'&&sendLoraMessage()}/>
              <button onClick={()=>{
                if(!loraSendText.trim()) return;
                const morseMap: Record<string,string> = {"A":".-","B":"-...","C":"-.-.","D":"-..","E":".","F":"..-.","G":"--.","H":"....","I":"..","J":".---","K":"-.-","L":".-..","M":"--","N":"-.","O":"---","P":".--.","Q":"--.-","R":".-.","S":"...","T":"-","U":"..-","V":"...-","W":".--","X":"-..-","Y":"-.--","Z":"--..","0":"-----","1":".----","2":"..---","3":"...--","4":"....-","5":".....","6":"-....","7":"--...","8":"---..","9":"----.","."};
                let payload = loraSendText;
                if(loraSendMode==='morse') payload = 'MORSE:'+loraSendText.toUpperCase().split('').map(c=>c===' '?'/':morseMap[c]||'').filter(Boolean).join(' ');
                else if(loraSendMode==='qr') payload = 'QR:'+loraSendText;
                else if(loraSendMode==='vibe') payload = 'VIBE:'+loraSendText;
                sendLoraMessage(payload);
              }} disabled={!loraSendText.trim()} className="p-3 bg-vibe-primary rounded-xl disabled:opacity-30"><Send className="w-5 h-5"/></button>`;

c = c.replace(oldLoraSend, newLoraSend);

fs.writeFileSync('src/components/RemoteTab.tsx', c);
console.log('Done:', c.includes('btSendMode') ? 'applied' : 'FAILED');
