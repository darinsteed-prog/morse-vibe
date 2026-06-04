const fs = require("fs");
const file = "src/components/HelpMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Add rate app section before the About section
src = src.replace(
  `      {/* About */}`,
  `      {/* Rate */}
      <div className="bg-vibe-primary/10 border border-vibe-primary/20 rounded-xl p-4 flex flex-col gap-3 text-center">
        <p className="text-lg font-bold text-white">⭐ Enjoying Morse Vibe?</p>
        <p className="text-[12px] text-white/50 leading-relaxed">A quick rating on the Play Store helps other users find the app and supports future development.</p>
        <button onClick={() => { try { (window as any).open("market://details?id=com.morsevibe.app", "_system"); } catch(e) { (window as any).open("https://play.google.com/store/apps/details?id=com.morsevibe.app", "_system"); } }}
          className="w-full py-3 rounded-xl bg-vibe-primary text-white font-bold text-base uppercase tracking-widest active:scale-95 transition-all">
          ⭐ Rate on Play Store
        </button>
        <p className="text-[11px] text-white/20">Takes less than 30 seconds · means a lot!</p>
      </div>

      {/* About */}`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Added rate section");
