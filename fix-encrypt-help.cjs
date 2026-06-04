const fs = require("fs");
const file = "src/App.tsx";
let src = fs.readFileSync(file, "utf8");

// Add help text above encryption section in settings
src = src.replace(
  `<h3 className="text-base font-mono uppercase tracking-wider text-white/60">Encryption</h3>`,
  `<h3 className="text-base font-mono uppercase tracking-wider text-white/60">Encryption</h3>
<div className="bg-white/5 rounded-xl p-3 border border-white/5">
  <p className="text-[12px] text-white/50 leading-relaxed">Encrypts messages sent via the <span className="text-white/80">Remote tab</span> so only people with the same key can read them.</p>
  <p className="text-[12px] text-white/40 mt-2 leading-relaxed">Both sender and receiver must use the same secret key. Use <span className="text-white/60">Generate Random Key</span> and share it with the other person before communicating.</p>
  <p className="text-[12px] text-white/40 mt-2 leading-relaxed">Does not affect Nearby BLE or LoRa messages.</p>
</div>`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added encryption help");
