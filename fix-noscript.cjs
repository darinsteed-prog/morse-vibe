const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Remove ScriptProcessor - use AnalyserNode time domain data instead
src = src.replace(
  `      // ScriptProcessor gives us raw PCM samples for Goertzel
      const bufferSize = 1024;
      const script = ctx.createScriptProcessor(bufferSize, 1, 1);
      scriptRef.current = script;
      script.onaudioprocess = (e) => {
        samplesRef.current = e.inputBuffer.getChannelData(0).slice();
      };

      source.connect(analyser);
      source.connect(script);
      script.connect(ctx.destination);`,
  `      source.connect(analyser);`
);

// Replace samplesRef usage in goertzel with time domain data from analyser
src = src.replace(
  `    if (!audioCtxRef.current || samplesRef.current.length === 0) {
      rafRef.current = requestAnimationFrame(decode);
      return;
    }

    // Every 10 frames update the locked frequency to track signal drift
    if (Math.random() < 0.1 && analyserRef.current) {
      const newFreq = findDominantFreq(analyserRef.current, audioCtxRef.current.sampleRate);
      if (newFreq > 400 && newFreq < 1200) {
        // Smooth update - dont jump too fast
        lockedFreqRef.current = Math.round(lockedFreqRef.current * 0.8 + newFreq * 0.2);
        setLockedFreq(lockedFreqRef.current);
      }
    }
    // Goertzel: measure energy ONLY at the locked frequency
    const power = goertzel(samplesRef.current, lockedFreqRef.current, audioCtxRef.current.sampleRate);`,
  `    if (!audioCtxRef.current || !analyserRef.current) {
      rafRef.current = requestAnimationFrame(decode);
      return;
    }

    // Get time domain samples directly from analyser
    const timeDomain = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(timeDomain);

    // Goertzel: measure energy ONLY at the locked frequency
    const power = goertzel(timeDomain, lockedFreqRef.current, audioCtxRef.current.sampleRate);`
);

// Also fix noise measurement to use time domain
src = src.replace(
  `          const measureNoise = () => {
            if (samplesRef.current.length > 0 && audioCtxRef.current) {
              const power = goertzel(samplesRef.current, lockedFreqRef.current, audioCtxRef.current.sampleRate);
              noiseSamples.push(power);
            }`,
  `          const measureNoise = () => {
            if (analyserRef.current && audioCtxRef.current) {
              const td = new Float32Array(analyserRef.current.fftSize);
              analyserRef.current.getFloatTimeDomainData(td);
              const power = goertzel(td, lockedFreqRef.current, audioCtxRef.current.sampleRate);
              noiseSamples.push(power);
            }`
);

// Fix scriptRef cleanup
src = src.replace(
  `    if (scriptRef.current) { try { scriptRef.current.disconnect(); } catch(e) {} scriptRef.current = null; }`,
  ``
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Removed ScriptProcessor, using time domain data");
