const fs = require("fs");
const file = "src/components/ListenMode.tsx";
let src = fs.readFileSync(file, "utf8");

// Replace Float32 time domain with Uint8 converted to float - more compatible
const oldGet = `    const td = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(td);

    // Goertzel power at locked frequency
    const power = goertzel(td, lockedFreqRef.current, audioCtxRef.current.sampleRate);`;

const newGet = `    const tdByte = new Uint8Array(analyserRef.current.fftSize);
    analyserRef.current.getByteTimeDomainData(tdByte);
    const td = new Float32Array(tdByte.length);
    for (let i = 0; i < tdByte.length; i++) td[i] = (tdByte[i] - 128) / 128;

    // Goertzel power at locked frequency
    const power = goertzel(td, lockedFreqRef.current, audioCtxRef.current.sampleRate);`;

src = src.replace(oldGet, newGet);

// Same fix for noise measurement
const oldNoise = `          const td = new Float32Array(analyserRef.current.fftSize);
          analyserRef.current.getFloatTimeDomainData(td);
          noisePowers.push(goertzel(td, freq, audioCtxRef.current.sampleRate));`;

const newNoise = `          const tdB = new Uint8Array(analyserRef.current.fftSize);
          analyserRef.current.getByteTimeDomainData(tdB);
          const tdF = new Float32Array(tdB.length);
          for (let i = 0; i < tdB.length; i++) tdF[i] = (tdB[i] - 128) / 128;
          noisePowers.push(goertzel(tdF, freq, audioCtxRef.current.sampleRate));`;

src = src.replace(oldNoise, newNoise);

if(src.includes("tdByte")) {
  fs.writeFileSync(file, src, "utf8");
  console.log("✔ Fixed time domain data");
} else {
  console.log("✖ Pattern not found");
}
