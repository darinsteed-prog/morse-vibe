const fs = require("fs");
const file = "src/components/FlashMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Remove mode state since we only have send now
src = src.replace(
  `  const [mode, setMode] = useState<'send'|'receive'>('send');`,
  ``
);

// Remove the receive content block
const receiveStart = src.indexOf(`        {mode === 'receive' &&`);
const receiveEnd = src.indexOf(`      </div>\n    </>\n  );\n}`);
if (receiveStart !== -1 && receiveEnd !== -1) {
  src = src.substring(0, receiveStart) + src.substring(receiveEnd);
  console.log("✔ Removed receive content");
} else {
  console.log("Pattern not found - checking...");
  console.log("receive start:", receiveStart);
  console.log("receive end:", receiveEnd);
}

// Remove send mode condition since it's the only mode now
src = src.replace(`        {mode === 'send' && <>`, ``);
src = src.replace(`        </>}`, ``);

fs.writeFileSync(file, src, "utf8");
console.log("Done");
