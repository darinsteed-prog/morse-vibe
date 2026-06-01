const fs = require("fs");
const file = "src/components/RemoteTab.tsx";
let src = fs.readFileSync(file, "utf8");

const broken = `<button onClick={()=>{
                if(!loraSendText.trim()) return;
                const morseMap: Record<string,string> = {"A":".-","B":"-...","C":"-.-.","D":"-..","E":".","F":"..-.","G":"--.","H":"....","I":"..","J":".---","K":"-.-","L":".-..","M":"--","N":"-.","O":"---","P":".--.","Q":"--.-","R":".-.","S":"...","T":"-","U":"..-","V":"...-","W":".--","X":"-..-","Y":"-.--","Z":"--..","0":"-----","1":".----","2":"..---","3":"...--","4":"....-","5":".....","6":"-....","7":"--...","8":"---..","9":"----."}
                let payload = loraSendText;
                if(loraSendMode==='morse') payload = 'MORSE:'+loraSendText.toUpperCase().split('').map(c=>c===' '?'/':morseMap[c]||'').filter(Boolean).join(' ');
                else if(loraSendMode==='qr') payload = 'QR:'+loraSendText;
                else if(loraSendMode==='vibe') payload = 'VIBE:'+loraSendText;
                sendLoraMessage(payload);
              }} disabled={!loraSendText.trim()} className="p-3 bg-vibe-primary rounded-xl disabled:opacity-30"><Send className="w-5 h-5"/></button>`;

const fixed = `<button onClick={()=>sendLoraMessage(loraSendText)} disabled={!loraSendText.trim()} className="p-3 bg-vibe-primary rounded-xl disabled:opacity-30"><Send className="w-5 h-5"/></button>`;

if(src.includes(broken)){
  src = src.replace(broken, fixed);
  fs.writeFileSync(file, src, "utf8");
  console.log("✔ Fixed LoRa button");
} else {
  // try to find it
  const idx = src.indexOf("const morseMap: Record<string,string>");
  console.log("morseMap found at index:", idx);
  console.log("Context around it:");
  console.log(src.substring(idx-100, idx+200));
}
