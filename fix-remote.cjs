const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "src/components/RemoteTab.tsx");
let src = fs.readFileSync(file, "utf8");

const broken = `{"A":".-","B":"-...","C":"-.-.","D":"-..","E":".","F":"..-.","G":"--.","H":"....","I":"..","J":".---","K":"-.-","L":".-..","M":"--","N":"-.","O":"---","P":".--.","Q":"--.-","R":".-.","S":"...","T":"-","U":"..-","V":"...-","W":".--","X":"-..-","Y":"-.--","Z":"--..","0":"-----","1":".----","2":"..---","3":"...--","4":"....-","5":".....","6":"-....","7":"--...","8":"---..","9":"----.","."};`;

const fixed = `{"A":".-","B":"-...","C":"-.-.","D":"-..","E":".","F":"..-.","G":"--.","H":"....","I":"..","J":".---","K":"-.-","L":".-..","M":"--","N":"-.","O":"---","P":".--.","Q":"--.-","R":".-.","S":"...","T":"-","U":"..-","V":"...-","W":".--","X":"-..-","Y":"-.--","Z":"--..","0":"-----","1":".----","2":"..---","3":"...--","4":"....-","5":".....","6":"-....","7":"--...","8":"---..","9":"----.",".":'.-.-.-',",":'--..--',"?":'..--..'}`;

if(src.includes(broken)){
  src = src.replace(broken, fixed);
  fs.writeFileSync(file, src, "utf8");
  console.log("Fixed RemoteTab.tsx morseMap");
} else {
  console.log("Pattern not found - searching for truncated entry...");
  const idx = src.indexOf('"9":"----.","."');
  if(idx !== -1){
    console.log("Found truncated map at index", idx);
    console.log("Context:", src.substring(idx-10, idx+50));
  }
}
