const fs = require("fs");
const file = "src/components/HelpMode.tsx";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  `          <P>Point the torch at the receiver. Works over hundreds of metres in darkness.</P>
          <P>Both sender and receiver must use the same WPM speed.</P>`,
  `          <P>Point the torch at the receiver. Works over hundreds of metres in darkness.</P>
          <P>The receiver watches the flashing light and counts the dots and dashes to decode the message manually using the <B>Guide tab</B> as reference.</P>`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed flash help text");
