const fs = require("fs");
const file = "src/components/ReferenceMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Add fontSize to the dot function spans
src = src.replace(
  `  const dot = (m: string) => m.split("").map((c,i) => <span key={i} style={{color: c==="."?"rgba(139,92,246,0.9)":c==="-"?"rgba(255,200,50,0.9)":"rgba(255,255,255,0.15)"}}>{c==="."?"·":c==="-"?"−":c}</span>);`,
  `  const dot = (m: string, size=32) => m.split("").map((c,i) => <span key={i} style={{color: c==="."?"rgba(139,92,246,0.9)":c==="-"?"rgba(255,200,50,0.9)":"rgba(255,255,255,0.15)", fontSize: size+"px", lineHeight:"1"}}>{c==="."?"·":c==="-"?"−":c}</span>);`
);

// Use size in alphabet
src = src.replace(`{dot(m)}</span>`, `{dot(m, 36)}</span>`);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed dot size");
