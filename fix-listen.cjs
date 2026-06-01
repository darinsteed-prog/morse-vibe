const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Loosen bandpass Q from 15 to 5 (wider band, more signal gets through)
src = src.replace("bandpass.Q.value = 15;", "bandpass.Q.value = 5;");

// Widen detection window from ±150Hz to ±300Hz
src = src.replace("const lowBin = Math.max(0, Math.floor((freq - 150) / binHz));", 
                  "const lowBin = Math.max(0, Math.floor((freq - 300) / binHz));");
src = src.replace("const highBin = Math.min(data.length - 1, Math.ceil((freq + 150) / binHz));",
                  "const highBin = Math.min(data.length - 1, Math.ceil((freq + 300) / binHz));");

// More smoothing so signal level is stable
src = src.replace("analyser.smoothingTimeConstant = 0.15;", "analyser.smoothingTimeConstant = 0.4;");

// Lower default threshold from 25 to 15
src = src.replace("const [threshold, setThreshold] = useState(25);", 
                  "const [threshold, setThreshold] = useState(15);");
src = src.replace("const thresholdRef = useRef(25);",
                  "const thresholdRef = useRef(15);");

// Fix min duration — was filtering too aggressively, drop to 0.2
src = src.replace("const getMinDuration = () => getDot() * 0.4;",
                  "const getMinDuration = () => getDot() * 0.2;");

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed listen sensitivity");
