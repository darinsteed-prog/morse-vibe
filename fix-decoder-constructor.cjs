const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Fix decoder constructor - takes object not number
// Also move callbacks into constructor instead of setting after
src = src.replace(
  `      const decoder = new MorseAdaptiveDecoder(wpmRef.current);
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
      };`,
  `      const decoder = new MorseAdaptiveDecoder({
        wpm: wpmRef.current,
        messageCallback: (data: any) => {
          const msg = data?.message ?? data;
          if (msg !== undefined && msg !== null) appendChar(String(msg));
        },
        speedCallback: (data: any) => {
          const speed = data?.wpm ?? data;
          if (speed && speed > 0 && speed < 100) setWpm(Math.round(speed));
        }
      });
      decoderRef.current = decoder;`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Fixed decoder constructor");
