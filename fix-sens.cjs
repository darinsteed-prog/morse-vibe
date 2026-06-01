const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Fix calibration - use noise floor + 5 instead of + 8
src = src.replace(
  "thresholdRef.current = Math.max(8, Math.round(max + 8));",
  "thresholdRef.current = Math.max(5, Math.round(max + 5));"
);

// Show threshold value in status
src = src.replace(
  `setStatusMsg("Ready · " + FREQ_BANDS[bandIndexRef.current].hint);`,
  `setStatusMsg("Ready · sensitivity " + thresholdRef.current + "%");`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed calibration threshold");
