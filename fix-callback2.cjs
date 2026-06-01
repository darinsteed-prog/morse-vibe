const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  `      decoder.messageCallback = (data: any) => {
        const char = data?.message ?? data;
        appendChar(String(char));
      };`,
  `      decoder.messageCallback = (data: any) => {
        const msg = data?.message ?? data;
        if (msg !== undefined && msg !== null) appendChar(String(msg));
      };`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed messageCallback");
