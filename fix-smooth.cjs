const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Lower minimum back to 30ms - catches real dots but kills 17ms noise
src = src.replace(
  "if (duration < 50) return; // ignore noise spikes under 50ms",
  "if (duration < 30) return; // ignore noise under 30ms"
);

// Less smoothing = sharper tone edges = more accurate timing
src = src.replace(
  "analyser.smoothingTimeConstant = 0.3;",
  "analyser.smoothingTimeConstant = 0.05;"
);

// Raise threshold slightly to avoid noise floor triggering
src = src.replace(
  "const [threshold, setThreshold] = useState(15);",
  "const [threshold, setThreshold] = useState(20);"
);
src = src.replace(
  "const thresholdRef = useRef(15);",
  "const thresholdRef = useRef(20);"
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed smoothing and threshold");
