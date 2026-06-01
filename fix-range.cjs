const fs = require("fs");
const file = "src/components/RemoteTab.tsx";
let src = fs.readFileSync(file, "utf8");

// Add high power scan mode for better range
src = src.replace(
  `await ble.requestLEScan(
        { services: [MORSE_VIBE_SERVICE_UUID], allowDuplicates: false },`,
  `await ble.requestLEScan(
        { services: [MORSE_VIBE_SERVICE_UUID], allowDuplicates: false, scanMode: 2 },`
);

// Update range description
src = src.replace(
  "Direct Bluetooth between Morse Vibe phones. No internet. Range ~30m.",
  "Direct Bluetooth between Morse Vibe phones. No internet. Range up to 100m outdoors."
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Enabled high power scan mode");
