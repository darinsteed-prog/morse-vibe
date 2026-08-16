const fs = require("fs");
const file = "src/App.tsx";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  /let data;[\s\S]*?data = r2\.data;\s*\}/,
  `const r = await window.Capacitor.Plugins.CapacitorHttp.get({ url:'https://morse-vibe.onrender.com/api/flights?lat='+clat+'&lon='+clon });
      const data = r.data;`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ ATC now uses Render server proxy");
