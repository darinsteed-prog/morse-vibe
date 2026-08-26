const fs = require("fs");
const file = "server.ts";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  `        const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!r.ok) continue;
        const data = await r.json();
        if (data.ac && data.ac.length > 0) {
          res.json(data);
          return;
        }`,
  `        const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!r.ok) continue;
        const data = await r.json();
        if (data.ac !== undefined) {
          res.json(data);
          return;
        }`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed timeout and empty check");
