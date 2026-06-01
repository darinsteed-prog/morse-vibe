const fs = require("fs");
const file = "src/components/RemoteTab.tsx";
let src = fs.readFileSync(file, "utf8");

// Fix BT button - find and replace the whole onClick block
const btStart = src.indexOf('<button onClick={()=>{\n                  if(!btSendText.trim()) return;\n                  const morseMap');
const btEnd = src.indexOf('}} disabled={!btSendText.trim()}');
if(btStart !== -1 && btEnd !== -1) {
  src = src.substring(0, btStart) + 
    '<button onClick={()=>sendBtMessage(btSendText)}' +
    src.substring(btEnd + '}} disabled={!btSendText.trim()}'.length);
  console.log("✔ Fixed BT button");
} else {
  console.log("✖ BT button not found", btStart, btEnd);
}

// Fix LoRa button
const loraStart = src.indexOf('<button onClick={()=>{\n                if(!loraSendText.trim()) return;\n                const morseMap');
const loraEnd = src.indexOf('}} disabled={!loraSendText.trim()}');
if(loraStart !== -1 && loraEnd !== -1) {
  src = src.substring(0, loraStart) +
    '<button onClick={()=>sendLoraMessage(loraSendText)}' +
    src.substring(loraEnd + '}} disabled={!loraSendText.trim()}'.length);
  console.log("✔ Fixed LoRa button");
} else {
  console.log("✖ LoRa button not found", loraStart, loraEnd);
}

fs.writeFileSync(file, src, "utf8");
console.log("Done");
