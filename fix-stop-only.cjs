const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");
src = src.replace(
  "try { listenerRef.current.stopListening(); } catch(e) {}",
  "try { listenerRef.current.stop(); } catch(e) {}"
);
fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed stop");
