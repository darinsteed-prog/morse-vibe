const fs = require("fs");
const file = "src/components/RemoteTab.tsx";
let src = fs.readFileSync(file, "utf8");

const broken = `              <button onClick={()=>sendLoraMessage(loraSendText)} className="p-3 bg-vibe-primary rounded-xl disabled:opacity-30"><Send className="w-5 h-5"/></button>
            </div>
          )}
          {msgList(loraMessages)}`;

const fixed = `              <button onClick={()=>sendLoraMessage(loraSendText)} className="p-3 bg-vibe-primary rounded-xl disabled:opacity-30"><Send className="w-5 h-5"/></button>
              </div>
            </div>
          )}
          {msgList(loraMessages)}`;

if(src.includes(broken)){
  src = src.replace(broken, fixed);
  fs.writeFileSync(file, src, "utf8");
  console.log("✔ Fixed JSX structure");
} else {
  console.log("✖ Pattern not found");
}
