const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// More smoothing so signal doesnt drop between dots
src = src.replace(
  "analyser.smoothingTimeConstant = 0.1;",
  "analyser.smoothingTimeConstant = 0.6;"
);

// Lower minimum duration to 30ms to catch fast dots
src = src.replace(
  "if (duration < 20) { rafRef.current = requestAnimationFrame(analyse); return; }",
  "if (duration < 30) { rafRef.current = requestAnimationFrame(analyse); return; }"
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed smoothing");
