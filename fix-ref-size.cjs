const fs = require("fs");
const file = "src/components/ReferenceMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Make dot/dash symbols bigger everywhere
src = src.replaceAll(`className="text-xl tracking-widest"`, `className="text-4xl tracking-widest"`);
src = src.replaceAll(`className="text-3xl tracking-widest"`, `className="text-4xl tracking-widest"`);
src = src.replaceAll(`className="text-2xl tracking-widest"`, `className="text-3xl tracking-widest"`);
src = src.replaceAll(`className="text-base tracking-widest"`, `className="text-3xl tracking-widest"`);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed morse size");
