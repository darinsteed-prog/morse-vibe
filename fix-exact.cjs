const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

src = src.replace("analyser.smoothingTimeConstant = 0.3;", "analyser.smoothingTimeConstant = 0.1;");
src = src.replace("letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 4);", "letterTimerRef.current = setTimeout(() => { commitLetter(); }, getDot() * 3);");
src = src.replace("}, getDot() * 15);", "}, getDot() * 12);");
src = src.replace("if (duration < 30)", "if (duration < 20)");

fs.writeFileSync(file, src, "utf8");
console.log("✔ Restored exact working settings");
