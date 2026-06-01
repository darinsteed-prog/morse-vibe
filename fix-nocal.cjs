const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Skip calibration entirely, use fixed threshold of 12
src = src.replace(
  `await calibrate(ctx, analyser);`,
  `thresholdRef.current = 12;
      setStatusMsg("Ready");
      setPhase("listening");
      rafRef.current = requestAnimationFrame(analyse);`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Removed calibration, fixed threshold at 12");
