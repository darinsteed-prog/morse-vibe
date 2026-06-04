const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  `        {suggestions.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-[10px] font-mono text-yellow-400/50 uppercase">Did you mean?</span>
            <div className="flex gap-1 flex-wrap">
              {suggestions.map(w => (
                <button key={w} onClick={() => acceptSuggestion(w)}
                  className="px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-lg text-[12px] font-mono font-bold text-yellow-400/80 hover:bg-yellow-400/20 transition-colors">
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}`,
  `        {suggestions.length > 0 && (
          <div className="flex flex-col gap-1 mt-2 bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-2">
            <span className="text-[10px] font-mono text-yellow-400/60 uppercase tracking-wider mb-1">Did you mean? (tap to replace)</span>
            {suggestions.map((w, i) => (
              <button key={w} onClick={() => acceptSuggestion(w)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-yellow-400/10 transition-colors text-left">
                <span className="text-[11px] font-mono text-yellow-400/40">{i + 1}.</span>
                <span className="text-base font-mono font-bold text-yellow-400/90">{w}</span>
              </button>
            ))}
          </div>
        )}`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Updated suggestions to list format");
