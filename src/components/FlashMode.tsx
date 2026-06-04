import React, { useState, useRef, useEffect } from "react";

interface FlashModeProps { text: string; isTransmitting: boolean; }

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
    return matches >= Math.ceil(last.length * 0.5) && matches < last.length;
  }).slice(0, 4);
};

export function FlashMode({ text, isTransmitting }: FlashModeProps) {

  const [isFlashing, setIsFlashing] = useState(false);
  const [wpm, setWpm] = useState(10);
  const [useScreen, setUseScreen] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [receivedText, setReceivedText] = useState('');
  const [receivedMorse, setReceivedMorse] = useState('');
  const [lightLevel, setLightLevel] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const stopRef = useRef(false);
  const streamRef = useRef<MediaStream|null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const pulseStartRef = useRef<number>(0);
  const lastStateRef = useRef<boolean>(false);
  const morseBufferRef = useRef<string>('');
  const letterTimerRef = useRef<any>(null);
  const wordTimerRef = useRef<any>(null);
  const baselineRef = useRef<number>(0);
  const thresholdRef = useRef<number>(30);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const MORSE_MAP: Record<string,string> = {
    ".-":"A","-...":"B","-.-.":"C","-..":"D",".":"E","..-.":"F",
    "--.":"G","....":"H","..":"I",".---":"J","-.-":"K",".-..":"L",
    "--":"M","-.":"N","---":"O",".--.":"P","--.-":"Q",".-.":"R",
    "...":"S","-":"T","..-":"U","...-":"V",".--":"W","-..-":"X",
    "-.--":"Y","--..":"Z","-----":"0",".----":"1","..---":"2",
    "...--":"3","....-":"4",".....":"5","-....":"6","--...":"7",
    "---..":"8","----.":"9"
  };

  const setTorch = async (on: boolean) => {
    if (useScreen) { setScreenOn(on); return; }
    try {
      if (on && !streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
      }
      if (streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0];
        await (track as any).applyConstraints({ advanced: [{ torch: on }] });
      }
    } catch(e) { setScreenOn(on); }
  };

  const stopTorch = async () => {
    try {
      if (streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0];
        await (track as any).applyConstraints({ advanced: [{ torch: false }] });
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    } catch(e) {}
    setScreenOn(false);
  };

  const flashMorse = async () => {
    if (!text.trim()) return;
    stopRef.current = false;
    setIsFlashing(true);
    const dot = 1200 / wpm;
    const morseMap: Record<string,string> = {
      "A":".-","B":"-...","C":"-.-.","D":"-..","E":".","F":"..-.","G":"--.","H":"....","I":"..","J":".---",
      "K":"-.-","L":".-..","M":"--","N":"-.","O":"---","P":".--.","Q":"--.-","R":".-.","S":"...","T":"-",
      "U":"..-","V":"...-","W":".--","X":"-..-","Y":"-.--","Z":"--..","0":"-----","1":".----","2":"..---",
      "3":"...--","4":"....-","5":".....","6":"-....","7":"--...","8":"---..","9":"----.",".":'.-.-.-'
    };
    const morse = text.toUpperCase().split("").map(c => c === " " ? "/" : (morseMap[c] || "")).filter(Boolean).join(" ");
    for (const char of morse) {
      if (stopRef.current) break;
      if (char === ".") { await setTorch(true); await sleep(dot); await setTorch(false); await sleep(dot); }
      else if (char === "-") { await setTorch(true); await sleep(dot*3); await setTorch(false); await sleep(dot); }
      else if (char === " ") { await sleep(dot*2); }
      else if (char === "/") { await sleep(dot*6); }
    }
    await stopTorch();
    setIsFlashing(false);
  };

  const stopFlash = async () => { stopRef.current = true; await stopTorch(); setIsFlashing(false); };

  const addLetter = (letter: string) => {
    setReceivedText(prev => {
      const next = prev + letter;
      setSuggestions(getSuggestions(next));
      return next;
    });
  };

  const addWordSpace = () => {
    setReceivedText(prev => {
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
  };

  const acceptSuggestion = (word: string) => {
    setReceivedText(prev => {
      const words = prev.trimEnd().split(" ");
      words[words.length - 1] = word;
      return words.join(" ") + " ";
    });
    setSuggestions([]);
  };

  const startReceiving = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 320, height: 240, frameRate: 30 }
      });
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      streamRef.current = stream;
      setReceiving(true);
      setReceivedText('');
      setReceivedMorse('');
      setSuggestions([]);
      morseBufferRef.current = '';
      lastStateRef.current = false;
      pulseStartRef.current = Date.now();
      baselineRef.current = 0;

      let calibFrames = 0, calibSum = 0;

      const analyze = () => {
        if (!canvasRef.current || !videoRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        canvasRef.current.width = 32;
        canvasRef.current.height = 24;
        ctx.drawImage(videoRef.current, 0, 0, 32, 24);
        const data = ctx.getImageData(0, 0, 32, 24).data;
        let brightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          brightness += (data[i] + data[i+1] + data[i+2]) / 3;
        }
        brightness = brightness / (32 * 24);
        setLightLevel(Math.round(brightness));

        if (calibFrames < 30) {
          calibSum += brightness;
          calibFrames++;
          if (calibFrames === 30) {
            baselineRef.current = calibSum / 30;
            thresholdRef.current = baselineRef.current + 30;
          }
        } else {
          const isLight = brightness > thresholdRef.current;
          const now = Date.now();

          if (isLight !== lastStateRef.current) {
            const duration = now - pulseStartRef.current;
            const dotLen = 1200 / wpm;

            if (!isLight) {
              const sym = duration < dotLen * 2 ? '.' : '-';
              morseBufferRef.current += sym;
              clearTimeout(letterTimerRef.current);
              clearTimeout(wordTimerRef.current);
              const dl = 1200 / wpm;
              letterTimerRef.current = setTimeout(() => {
                if (morseBufferRef.current) {
                  const letter = MORSE_MAP[morseBufferRef.current] || '?';
                  setReceivedMorse(m => m + morseBufferRef.current + ' ');
                  addLetter(letter);
                  morseBufferRef.current = '';
                }
                wordTimerRef.current = setTimeout(() => {
                  addWordSpace();
                  setReceivedMorse(m => m + '  ');
                }, dl * 4);
              }, dl * 3);
            }
            lastStateRef.current = isLight;
            pulseStartRef.current = now;
          }
        }
        animRef.current = requestAnimationFrame(analyze);
      };
      animRef.current = requestAnimationFrame(analyze);
    } catch(e) {
      alert('Camera access denied');
    }
  };

  const stopReceiving = () => {
    cancelAnimationFrame(animRef.current);
    clearTimeout(letterTimerRef.current);
    clearTimeout(wordTimerRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setReceiving(false);
  };

  useEffect(() => () => { stopReceiving(); stopTorch(); }, []);

  return (
    <>
      {screenOn && <div className="fixed inset-0 bg-white z-[9999]" style={{pointerEvents:"none"}} />}
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
      <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-4">



          <span className="text-[12px] font-mono uppercase tracking-wider text-white/40">Flash Transmit</span>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-[12px] font-mono text-white/40">Speed</span>
              <span className="text-[12px] font-mono text-vibe-primary">{wpm} WPM</span>
            </div>
            <input type="range" min={3} max={15} step={1} value={wpm}
              onChange={e => setWpm(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-vibe-primary"
              disabled={isFlashing} />
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div>
              <p className="text-base font-bold">Screen Flash</p>
              <p className="text-[11px] font-mono text-white/30">Off = torch, On = white screen</p>
            </div>
            <button onClick={() => setUseScreen(!useScreen)} disabled={isFlashing}
              className={`w-12 h-6 rounded-full relative ${useScreen ? 'bg-vibe-primary' : 'bg-white/10'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${useScreen ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={flashMorse} disabled={!text.trim() || isFlashing}
              className="flex-1 py-3 rounded-xl text-base font-bold uppercase tracking-widest bg-vibe-primary text-white disabled:opacity-30">Flash Morse</button>
            <button onClick={stopFlash} disabled={!isFlashing}
              className="flex-1 py-3 rounded-xl text-base font-bold uppercase tracking-widest bg-red-500 text-white disabled:opacity-30">Stop</button>
          </div>
          <p className="text-[11px] font-mono text-white/20 text-center">Type message in Keys tab first</p>


      </div>
    </>
  );
}
