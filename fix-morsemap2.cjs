const fs = require("fs");
const file = "src/components/RemoteTab.tsx";
let src = fs.readFileSync(file, "utf8");

// Replace all morseMaps in the file with a clean version using a regex
const badMap = /const morseMap: Record<string,string> = \{[^}]+\}/g;
const goodMap = `const morseMap: Record<string,string> = {"A":".-","B":"-...","C":"-.-.","D":"-..","E":".","F":"..-.","G":"--.","H":"....","I":"..","J":".---","K":"-.-","L":".-..","M":"--","N":"-.","O":"---","P":".--.","Q":"--.-","R":".-.","S":"...","T":"-","U":"..-","V":"...-","W":".--","X":"-..-","Y":"-.--","Z":"--..","0":"-----","1":".----","2":"..---","3":"...--","4":"....-","5":".....","6":"-....","7":"--...","8":"---..","9":"----."}`;

const count = (src.match(badMap)||[]).length;
src = src.replace(badMap, goodMap);
fs.writeFileSync(file, src, "utf8");
console.log("Fixed", count, "morseMaps");
