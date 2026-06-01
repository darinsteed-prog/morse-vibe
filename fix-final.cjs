const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// 1. Increase word gap from 9 to 12
src = src.replace("}, getDot() * 9);", "}, getDot() * 12);");

// 2. Dont start decoding until calibration is done + 500ms settle time
src = src.replace(
  `setStatusMsg("Ready · threshold auto-set to " + threshold + "%");
    setPhase("listening");
    rafRef.current = requestAnimationFrame(analyse);`,
  `setStatusMsg("Ready · threshold auto-set to " + threshold + "%");
    await new Promise(r => setTimeout(r, 500));
    symbolsRef.current = "";
    setCurrentSymbols("");
    setDecodedText("");
    setPhase("listening");
    rafRef.current = requestAnimationFrame(analyse);`
);

// 3. Raise calibration headroom from 1.5 to 2.0 to better reject noise
src = src.replace(
  "const threshold = Math.max(8, Math.round(max * 1.5 + 5));",
  "const threshold = Math.max(8, Math.round(max * 2.0 + 8));"
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed noise at start and word gaps");
