const fs = require("fs");
const file = "src/components/ReferenceMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Make morse symbols bigger in alphabet grid
src = src.replace(
  `<span className="text-xl tracking-widest">{dot(m)}</span>`,
  `<span className="text-3xl tracking-widest">{dot(m)}</span>`
);

// Make number morse bigger too
src = src.replace(
  `<span className="text-base tracking-widest">{dot(m)}</span>`,
  `<span className="text-2xl tracking-widest">{dot(m)}</span>`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed morse size");
