import React, { useState } from "react";
import { Search, RotateCcw, Copy, Check, ArrowRight } from "lucide-react";

const WORDS = ["THE","AND","FOR","ARE","BUT","NOT","YOU","ALL","CAN","HER","WAS","ONE","OUR","OUT","DAY","GET","HAS","HIM","HIS","HOW","MAN","NEW","NOW","OLD","SEE","TWO","WAY","WHO","YES","ABLE","ALSO","AWAY","BACK","BALL","BASE","BEEN","BEST","BIRD","BLUE","BOAT","BODY","BOOK","BORN","BOTH","CALL","CAME","CARE","CASE","CITY","COAT","CODE","COLD","COME","COOK","COOL","COPY","COST","DARK","DATA","DATE","DEAD","DEAL","DEAR","DEBT","DEEP","DESK","DOES","DONE","DOOR","DOWN","DRAW","DROP","DUST","DUTY","EACH","EARN","EAST","EDGE","ELSE","EVEN","EVER","EVIL","FACE","FACT","FAIL","FAIR","FALL","FAME","FARM","FAST","FEAR","FEED","FEEL","FEET","FILE","FILL","FILM","FIND","FINE","FIRE","FIRM","FISH","FIVE","FLAG","FLAT","FLOW","FOLD","FOOD","FOOL","FOOT","FORM","FORT","FOUR","FREE","FROM","FUEL","FULL","FUND","GAIN","GAME","GAVE","GEAR","GIFT","GIRL","GIVE","GLAD","GOAL","GOES","GOLD","GONE","GOOD","GREW","GROW","HALF","HALL","HAND","HANG","HARD","HARM","HATE","HAVE","HEAD","HEAL","HEAR","HEAT","HELD","HELL","HELP","HERE","HERO","HIGH","HILL","HINT","HIRE","HOLD","HOLE","HOME","HOOK","HOPE","HOST","HOUR","HUGE","HUNT","HURT","IDEA","INTO","IRON","ITEM","JOIN","JOKE","JUMP","JUST","KEEP","KEPT","KILL","KIND","KING","KNEW","KNOW","LACK","LADY","LAKE","LAND","LANE","LAST","LATE","LEAD","LEAN","LEFT","LESS","LIFE","LIFT","LIKE","LINE","LINK","LIST","LIVE","LOAD","LOAN","LOCK","LONE","LONG","LOOK","LOSE","LOSS","LOST","LOUD","LOVE","LUCK","LUNG","MADE","MAIL","MAIN","MAKE","MANY","MARK","MASK","MASS","MATE","MEAL","MEAN","MEAT","MEET","MEMO","MILD","MILE","MILK","MILL","MINE","MISS","MODE","MOOD","MOON","MORE","MOST","MOVE","MUCH","MUST","NAIL","NAME","NEAR","NECK","NEED","NEXT","NICE","NINE","NODE","NONE","NOON","NORM","NOSE","NOTE","ONCE","ONLY","OPEN","OVER","PACE","PACK","PAGE","PAID","PAIN","PAIR","PALE","PARK","PART","PASS","PATH","PEAK","PICK","PILE","PILL","PINE","PIPE","PLAN","PLAY","PLOT","PLUG","PLUS","POEM","POLL","POOL","POOR","PORT","POSE","POST","POUR","PRAY","PULL","PUMP","PURE","PUSH","RACE","RAGE","RAID","RAIL","RAIN","RANK","RARE","RATE","READ","REAL","RELY","RENT","REST","RICE","RICH","RIDE","RING","RISE","RISK","ROAD","ROCK","ROLE","ROLL","ROOF","ROOM","ROOT","ROPE","ROSE","RULE","RUSH","RUST","SAFE","SAID","SAIL","SALE","SALT","SAME","SAND","SAVE","SEAL","SEEK","SEEM","SEEN","SELF","SELL","SEND","SENT","SHIP","SHOE","SHOP","SHOT","SHOW","SHUT","SICK","SIDE","SIGN","SILK","SING","SINK","SIZE","SKIN","SLOW","SNAP","SNOW","SOFT","SOIL","SOLD","SOME","SONG","SOON","SORE","SORT","SOUL","SOUP","STAR","STAY","STEM","STEP","STOP","SUCH","SUIT","SURE","TALE","TALK","TALL","TANK","TAPE","TASK","TEAR","TELL","TERM","TEST","TEXT","THAN","THAT","THEM","THEN","THEY","THIN","THIS","TIDE","TILL","TIME","TINY","TIRE","TOLD","TOLL","TONE","TOOK","TOOL","TORN","TOUR","TOWN","TREE","TRIP","TRUE","TUBE","TUNE","TURN","TYPE","UNIT","UPON","USED","USER","VARY","VAST","VERY","VIEW","VOTE","WADE","WALK","WALL","WANT","WARD","WARM","WARN","WASH","WEAR","WEEK","WELL","WENT","WERE","WEST","WHAT","WHEN","WHOM","WIDE","WIFE","WILD","WILL","WIND","WINE","WIRE","WISE","WISH","WITH","WOOD","WORD","WORK","WRAP","YARD","YEAR","YOUR","ZERO","ZONE","HELLO","EVERY","EVERYONE","WORLD","MORSE","RADIO","SIGNAL","MAYDAY","ROGER","WILCO","OVER","COPY","BREAK","HELP","STOP","SOS"];

const M2C: Record<string,string> = {".-":"A","-...":"B","-.-.":"C","-..":"D",".":"E","..-.":"F","--.":"G","....":"H","..":"I",".---":"J","-.-":"K",".-..":"L","--":"M","-.":"N","---":"O",".--.":"P","--.-":"Q",".-.":"R","...":"S","-":"T","..-":"U","...-":"V",".--":"W","-..-":"X","-.--":"Y","--..":"Z","-----":"0",".----":"1","..---":"2","...--":"3","....-":"4",".....":"5","-....":"6","--...":"7","---..":"8","----.":"9"};

function isMorse(t: string) { return /^[.\- /\n\/]+$/.test(t.trim()) && (t.includes(".") || t.includes("-")); }

function decodeMorse(t: string) {
  const sep = t.includes("/") ? "/" : t.includes("   ") ? "   " : null;
  if (sep) return t.split(sep).map(w => w.trim().split(/\s+/).filter(Boolean).map(s => M2C[s]||"?").join("")).join(" ");
  return t.trim().split(/\s+/).filter(Boolean).map(s => M2C[s]||"?").join("");
}

function getSug(word: string) {
  if (!word || word.length < 2 || WORDS.includes(word)) return [];
  return WORDS.filter(w => {
    if (w.length !== word.length) return false;
    let m = 0;
    for (let i = 0; i < word.length; i++) if (word[i] === w[i]) m++;
    return m >= Math.ceil(word.length * 0.5);
  }).slice(0, 5);
}

interface WR { original: string; isKnown: boolean; suggestions: string[]; chosen: string; }

export function DecipherMode() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<WR[]>([]);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [morseDecoded, setMorseDecoded] = useState("");

  const analyse = () => {
    if (!input.trim()) return;
    const upper = input.trim().toUpperCase();
    let text = upper;
    if (isMorse(upper)) { text = decodeMorse(upper); setMorseDecoded(text); }
    else setMorseDecoded("");
    const words = text.split(/\s+/).filter(Boolean);
    setResults(words.map(w => ({ original: w, isKnown: WORDS.includes(w), suggestions: getSug(w), chosen: w })));
    setDone(true);
  };

  const pick = (i: number, w: string) => setResults(p => p.map((r,j) => j===i ? {...r, chosen: w} : r));
  const output = () => results.map(r => r.chosen).join(" ");
  const copy = () => { navigator.clipboard.writeText(output()); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const reset = () => { setInput(""); setResults([]); setDone(false); setMorseDecoded(""); };

  return (
    <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-mono uppercase tracking-wider text-white/40">Fix / Decipher</span>
        <button onClick={reset} className="text-white/20 hover:text-white/50 p-1"><RotateCcw className="w-4 h-4" /></button>
      </div>
      <p className="text-[11px] font-mono text-white/30">Paste decoded text <span className="text-white/50">HELL O EVERYON E</span> or morse code <span className="text-white/50">.... . .-.. .-.. ---</span></p>
      <textarea value={input} onChange={e=>{setInput(e.target.value);setDone(false);setResults([]);}} placeholder="Paste text or morse here..." rows={4}
        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-base font-mono text-white/90 placeholder:text-white/20 focus:outline-none resize-none" />
      <button onClick={analyse} disabled={!input.trim()} className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-base uppercase tracking-widest bg-vibe-primary text-white disabled:opacity-30 active:scale-95">
        <Search className="w-5 h-5" /> Analyse
      </button>
      {done && (
        <div className="flex flex-col gap-3">
          {morseDecoded && <div className="bg-vibe-primary/10 border border-vibe-primary/20 rounded-xl p-3"><p className="text-[10px] font-mono text-vibe-primary/50 uppercase mb-1">Morse decoded to</p><p className="font-mono text-base text-white/80">{morseDecoded}</p></div>}
          <div className="bg-black/30 border border-white/5 rounded-xl p-3">
            <p className="text-[10px] font-mono text-white/20 uppercase mb-1">Corrected text</p>
            <p className="font-mono text-lg text-white/90 break-all">{output()}</p>
          </div>
          <button onClick={copy} className="flex items-center justify-center gap-2 py-2 rounded-xl border border-white/10 text-[12px] font-mono text-white/40 hover:text-white/60">
            {copied ? <Check className="w-4 h-4 text-green-400"/> : <Copy className="w-4 h-4"/>}{copied?"Copied!":"Copy corrected text"}
          </button>
          {results.map((r,i)=>(
            <div key={i} className={`rounded-xl border p-3 flex flex-col gap-2 ${r.isKnown?"bg-white/5 border-white/5":r.chosen!==r.original?"bg-green-500/10 border-green-500/20":"bg-yellow-400/5 border-yellow-400/20"}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-white/20">#{i+1}</span>
                <span className={`font-mono font-bold text-base ${r.isKnown?"text-white/70":r.chosen!==r.original?"text-white/40 line-through":"text-yellow-400/80"}`}>{r.original}</span>
                {r.chosen!==r.original&&<><ArrowRight className="w-3 h-3 text-green-400/50"/><span className="font-mono font-bold text-base text-green-400">{r.chosen}</span></>}
                {r.isKnown&&<span className="text-[10px] font-mono text-green-400/40 ml-auto">✓</span>}
              </div>
              {!r.isKnown&&r.suggestions.length>0&&(
                <div className="flex flex-wrap gap-1">
                  {r.suggestions.map(s=><button key={s} onClick={()=>pick(i,s)} className={`px-3 py-1.5 rounded-lg text-[12px] font-mono font-bold transition-colors ${r.chosen===s?"bg-green-500/20 border border-green-500/40 text-green-400":"bg-yellow-400/10 border border-yellow-400/20 text-yellow-400/80"}`}>{s}</button>)}
                  {r.chosen!==r.original&&<button onClick={()=>pick(i,r.original)} className="px-2 py-1 rounded-lg text-[11px] font-mono text-white/30 border border-white/10">undo</button>}
                </div>
              )}
              {!r.isKnown&&r.suggestions.length===0&&<p className="text-[11px] font-mono text-white/20">No close matches</p>}
            </div>
          ))}
        </div>
      )}
      {!done&&<p className="text-[11px] font-mono text-white/15 text-center">Use / between words in morse · e.g. .... . / .-- --- .-. .-.. -..</p>}
    </div>
  );
}
