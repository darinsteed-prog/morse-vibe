const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Raise minimum tone from 15ms to 50ms — kills noise spikes
src = src.replace(
  "if (duration < 15) return; // ignore sub-15ms clicks",
  "if (duration < 50) return; // ignore noise spikes under 50ms"
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed minimum tone duration");
