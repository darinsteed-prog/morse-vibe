import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, RotateCcw } from "lucide-react";

const WORDS = ["THE","AND","FOR","ARE","BUT","NOT","YOU","ALL","CAN","HER","WAS","ONE","OUR","OUT","DAY","GET","HAS","HIM","HIS","HOW","MAN","NEW","NOW","OLD","SEE","TWO","WAY","WHO","YES","ABLE","ALSO","AWAY","BACK","BALL","BASE","BEEN","BEST","BIRD","BLUE","BOAT","BODY","BOOK","BORN","BOTH","CALL","CAME","CARE","CASE","CITY","COAT","CODE","COLD","COME","COOK","COOL","COPY","COST","DARK","DATA","DATE","DEAD","DEAL","DEAR","DEBT","DEEP","DESK","DOES","DONE","DOOR","DOWN","DRAW","DROP","DUST","DUTY","EACH","EARN","EAST","EDGE","ELSE","EVEN","EVER","EVIL","FACE","FACT","FAIL","FAIR","FALL","FAME","FARM","FAST","FEAR","FEED","FEEL","FEET","FILE","FILL","FILM","FIND","FINE","FIRE","FIRM","FISH","FIVE","FLAG","FLAT","FLOW","FOLD","FOOD","FOOL","FOOT","FORM","FORT","FOUR","FREE","FROM","FUEL","FULL","FUND","GAIN","GAME","GAVE","GEAR","GIFT","GIRL","GIVE","GLAD","GOAL","GOES","GOLD","GONE","GOOD","GREW","GROW","HALF","HALL","HAND","HANG","HARD","HARM","HATE","HAVE","HEAD","HEAL","HEAR","HEAT","HELD","HELL","HELP","HERE","HERO","HIGH","HILL","HINT","HIRE","HOLD","HOLE","HOME","HOOK","HOPE","HOST","HOUR","HUGE","HUNT","HURT","IDEA","INTO","IRON","ITEM","JOIN","JOKE","JUMP","JUST","KEEP","KEPT","KILL","KIND","KING","KNEW","KNOW","LACK","LADY","LAKE","LAND","LANE","LAST","LATE","LEAD","LEAN","LEFT","LESS","LIFE","LIFT","LIKE","LINE","LINK","LIST","LIVE","LOAD","LOAN","LOCK","LONE","LONG","LOOK","LOSE","LOSS","LOST","LOUD","LOVE","LUCK","LUNG","MADE","MAIL","MAIN","MAKE","MANY","MARK","MASK","MASS","MATE","MEAL","MEAN","MEAT","MEET","MEMO","MILD","MILE","MILK","MILL","MINE","MISS","MODE","MOOD","MOON","MORE","MOST","MOVE","MUCH","MUST","NAIL","NAME","NEAR","NECK","NEED","NEXT","NICE","NINE","NODE","NONE","NOON","NORM","NOSE","NOTE","ONCE","ONLY","OPEN","OVER","PACE","PACK","PAGE","PAID","PAIN","PAIR","PALE","PARK","PART","PASS","PATH","PEAK","PICK","PILE","PILL","PINE","PIPE","PLAN","PLAY","PLOT","PLUG","PLUS","POEM","POLL","POOL","POOR","PORT","POSE","POST","POUR","PRAY","PULL","PUMP","PURE","PUSH","RACE","RAGE","RAID","RAIL","RAIN","RANK","RARE","RATE","READ","REAL","RELY","RENT","REST","RICE","RICH","RIDE","RING","RISE","RISK","ROAD","ROCK","ROLE","ROLL","ROOF","ROOM","ROOT","ROPE","ROSE","RULE","RUSH","RUST","SAFE","SAID","SAIL","SALE","SALT","SAME","SAND","SAVE","SEAL","SEEK","SEEM","SEEN","SELF","SELL","SEND","SENT","SHIP","SHOE","SHOP","SHOT","SHOW","SHUT","SICK","SIDE","SIGN","SILK","SING","SINK","SIZE","SKIN","SLOW","SNAP","SNOW","SOFT","SOIL","SOLD","SOME","SONG","SOON","SORE","SORT","SOUL","SOUP","STAR","STAY","STEM","STEP","STOP","SUCH","SUIT","SURE","TALE","TALK","TALL","TANK","TAPE","TASK","TEAR","TELL","TERM","TEST","TEXT","THAN","THAT","THEM","THEN","THEY","THIN","THIS","TIDE","TILL","TIME","TINY","TIRE","TOLD","TOLL","TONE","TOOK","TOOL","TORN","TOUR","TOWN","TREE","TRIP","TRUE","TUBE","TUNE","TURN","TYPE","UNIT","UPON","USED","USER","VARY","VAST","VERY","VIEW","VOTE","WADE","WALK","WALL","WANT","WARD","WARM","WARN","WASH","WEAR","WEEK","WELL","WENT","WERE","WEST","WHAT","WHEN","WHOM","WIDE","WIFE","WILD","WILL","WIND","WINE","WIRE","WISE","WISH","WITH","WOOD","WORD","WORK","WRAP","YARD","YEAR","YOUR","ZERO","ZONE","HELLO","EVERY","EVERYONE","WORLD","MORSE","RADIO","SIGNAL","MAYDAY","ROGER","WILCO","OVER","COPY","BREAK","HELP","STOP","SOS"];

const getSuggestions = (text: string): string[] => {
  const words = text.trimEnd().split(" ");
  const last = words[words.length - 1];
  if (!last || last.length < 2) return [];
  if (WORDS.includes(last)) return [];
  if (last.includes("?")) {
    return WORDS.filter(w => {
      if (w.length !== last.length) return false;
      for (let i = 0; i < last.length; i++) {
        if (last[i] !== "?" && last[i] !== w[i]) return false;
      }
      return true;
    }).slice(0, 4);
  }
  return WORDS.filter(w => {
    if (w.length !== last.length) return false;
    let matches = 0;
    for (let i = 0; i < last.length; i++) {
      if (last[i] === w[i]) matches++;
    }
    return matches >= Math.ceil(last.length * 0.6) && matches < last.length;
  }).slice(0, 4);
};

interface ListenModeProps {}

export function ListenMode({}: ListenModeProps) {
  const [listening, setListening] = useState(false);
  const [decodedText, setDecodedText] = useState("");
  const [signalLevel, setSignalLevel] = useState(0);
  const [toneActive, setToneActive] = useState(false);
  const [wpm, setWpm] = useState(18);
  const [lockedFreq, setLockedFreq] = useState<number|null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string|null>(null);
  const [statusMsg, setStatusMsg] = useState("Tap Start then play morse near phone");

  const listenerRef = useRef<any>(null);
  const decoderRef = useRef<any>(null);
  const wpmRef = useRef(18);

  useEffect(() => { wpmRef.current = wpm; }, [wpm]);

  const appendChar = (char: string) => {
    if (!char || char === '#') return; // # = unrecognised in morse-pro
    const upper = char.toUpperCase();
    if (upper === ' ' || upper === '/') {
      setDecodedText(prev => {
        const trimmed = prev.trimEnd();
        const words = trimmed.split(" ");
        const lastWord = words[words.length - 1];
        if (lastWord && !WORDS.includes(lastWord)) {
          setSuggestions(getSuggestions(trimmed));
        } else {
          setSuggestions([]);
        }
        return prev.endsWith(" ") ? prev : prev + " ";
      });
    } else {
      setDecodedText(prev => {
        const next = prev + upper;
        setSuggestions(getSuggestions(next));
        return next;
      });
    }
  };

  const acceptSuggestion = (word: string) => {
    setDecodedText(prev => {
      const words = prev.trimEnd().split(" ");
      words[words.length - 1] = word;
      return words.join(" ") + " ";
    });
    setSuggestions([]);
  };

  const reset = () => {
    setDecodedText("");
    setSuggestions([]);
    if (decoderRef.current) {
      try { decoderRef.current.flush(); } catch(e) {}
    }
  };

  const startListening = async () => {
    setError(null);
    setDecodedText("");
    setSuggestions([]);
    setLockedFreq(null);

    try {
      const MorseAdaptiveDecoder = (await import("morse-pro/lib/morse-pro-decoder-adaptive")).default;
      const MorseAdaptiveListener = (await import("morse-pro/lib/morse-pro-listener-adaptive")).default;

      const decoder = new MorseAdaptiveDecoder(wpmRef.current);
      decoderRef.current = decoder;

      // messageCallback receives {message, timings, morse}
      // message is a single decoded character
      decoder.messageCallback = (data: any) => {
        const msg = data?.message ?? data;
        if (msg !== undefined && msg !== null) appendChar(String(msg));
      };

      decoder.speedCallback = (data: any) => {
        const speed = data?.wpm ?? data;
        if (speed && speed > 0 && speed < 100) {
          setWpm(Math.round(speed));
        }
      };

      const spectrogramCallback = (data: any) => {
        const vol = data?.filterRegionVolume ?? 0;
        setSignalLevel(Math.min(100, Math.round((vol / 255) * 100)));
        setToneActive(!!data?.isOn);
      };

      const frequencyFilterCallback = (data: any) => {
        if (data?.min && data?.max) {
          setLockedFreq(Math.round((data.min + data.max) / 2));
        }
      };

      const micSuccessCallback = () => {
        setListening(true);
        setStatusMsg("Listening · auto-finding frequency...");
      };

      const micErrorCallback = (err: any) => {
        // Try fallback with getUserMedia directly
        setError("Mic error: " + (err?.message ?? String(err)));
        setListening(false);
      };

      // MorseAdaptiveListener constructor:
      // fftSize, volMin, volMax, freqMin, freqMax, volThreshold, decoder, bufferDuration,
      // spectrogramCb, freqFilterCb, volFilterCb, volThresholdCb, micSuccessCb, micErrorCb
      const listener = new MorseAdaptiveListener(
        256,    // fftSize - smaller = better time resolution
        -60,    // volumeFilterMin dB
        -30,    // volumeFilterMax dB (library default)
        400,    // frequencyFilterMin Hz
        1200,   // frequencyFilterMax Hz
        220,    // volumeThreshold (library default)
        decoder,
        500,    // bufferDuration ms
        spectrogramCallback,
        frequencyFilterCallback,
        undefined,
        undefined,
        micSuccessCallback,
        micErrorCallback
      );

      // Patch getUserMedia for modern Android WebView compatibility
      if (!navigator.getUserMedia) {
        (navigator as any).getUserMedia = (constraints: any, success: any, error: any) => {
          navigator.mediaDevices.getUserMedia(constraints).then(success).catch(error);
        };
      }

      listenerRef.current = listener;
      listener.startListening();

    } catch (e: any) {
      setError("Could not load decoder: " + (e?.message ?? String(e)));
    }
  };

  const stopListening = () => {
    if (listenerRef.current) {
      try { listenerRef.current.stopListening(); } catch(e) {}
      listenerRef.current = null;
    }
    setListening(false);
    setToneActive(false);
    setSignalLevel(0);
    setLockedFreq(null);
    setStatusMsg("Tap Start then play morse near phone");
  };

  useEffect(() => () => stopListening(), []);

  const bars = 20;
  const activeBars = Math.round((signalLevel / 100) * bars);

  return (
    <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-4">

      <div className="flex items-center justify-between">
        <span className="text-[12px] font-mono uppercase tracking-wider text-white/40">Mic Decoder</span>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${listening ? (toneActive ? "bg-vibe-primary animate-pulse" : "bg-vibe-primary/40") : "bg-white/20"}`} />
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{listening ? "LISTENING" : "IDLE"}</span>
        </div>
      </div>

      <p className="text-[11px] font-mono text-white/30 text-center">{statusMsg}</p>

      {lockedFreq && (
        <div className="bg-vibe-primary/10 border border-vibe-primary/20 rounded-xl px-3 py-2 text-center">
          <span className="text-[11px] font-mono text-vibe-primary/80">Auto-locked {lockedFreq}Hz · ignoring background noise</span>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] font-mono text-white/30">
          <span>SIGNAL</span><span>{signalLevel}%</span>
        </div>
        <div className="flex gap-[2px] h-6 items-end">
          {Array.from({length: bars}).map((_, i) => (
            <div key={i} className="flex-1 rounded-sm transition-all duration-75"
              style={{
                height: `${40 + (i / bars) * 60}%`,
                background: i < activeBars
                  ? toneActive ? "rgba(139,92,246,1)" : "rgba(255,255,255,0.4)"
                  : "rgba(255,255,255,0.06)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between">
          <span className="text-[12px] font-mono text-white/40">Starting Speed (auto-adapts)</span>
          <span className="text-[12px] font-mono text-vibe-primary">{wpm} WPM</span>
        </div>
        <input type="range" min={5} max={40} step={1} value={wpm}
          onChange={e => { setWpm(Number(e.target.value)); wpmRef.current = Number(e.target.value); }}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary"
          disabled={listening} />
        <div className="flex justify-between text-[10px] font-mono text-white/20">
          <span>5 slow</span><span>18 normal</span><span>40 fast</span>
        </div>
      </div>

      <div className="bg-black/30 border border-white/5 rounded-xl p-3 min-h-[100px] flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-mono text-white/20 uppercase tracking-wider">Decoded</span>
          <button onClick={reset} className="text-white/20 hover:text-white/50 transition-colors p-1">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
        <p className="font-mono text-lg break-all leading-relaxed min-h-[2em]">
          {decodedText
            ? decodedText.split("").map((ch, i) => (
                <span key={i} style={{ color: ch === "?" ? "#fbbf24" : "rgba(255,255,255,0.9)" }}>{ch}</span>
              ))
            : <span className="text-white/20">—</span>
          }
        </p>
        {suggestions.length > 0 && (
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
        )}
      </div>

      <button
        onClick={listening ? stopListening : startListening}
        className={`w-full py-5 rounded-xl flex items-center justify-center gap-3 font-bold text-lg uppercase tracking-widest transition-all active:scale-95 ${
          listening ? "bg-red-500/80 text-white" : "bg-vibe-primary text-white"
        }`}
      >
        {listening
          ? <><MicOff className="w-6 h-6" /> Stop</>
          : <><Mic className="w-6 h-6" /> Start Listening</>
        }
      </button>

      {error && <p className="text-red-400 text-[11px] font-mono text-center">{error}</p>}

      <div className="text-center flex flex-col gap-1">
        <p className="text-[11px] font-mono text-white/20">Auto-finds frequency · adapts to speed · works offline</p>
        <p className="text-[11px] font-mono text-white/15">Yellow = uncertain · tap suggestion to correct</p>
      </div>

    </div>
  );
}
