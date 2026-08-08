import React, { useState } from "react";
import { Zap, ChevronDown, ChevronUp } from "lucide-react";

function AccordionItem({ title, icon, content }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-vibe-surface border border-white/5 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-bold text-base text-white">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>
      {open && <div className="px-4 pb-4 flex flex-col gap-3 border-t border-white/5 pt-3">{content}</div>}
    </div>
  );
}

const P = ({ children }) => <p className="text-[13px] text-white/55 leading-relaxed">{children}</p>;
const B = ({ children }) => <span className="text-white/85 font-bold">{children}</span>;
const H = ({ children }) => <p className="text-[12px] font-mono text-vibe-primary/70 uppercase tracking-wider mt-2">{children}</p>;
const Step = ({ n, children }) => (
  <div className="flex gap-3 items-start">
    <span className="text-[11px] font-mono text-vibe-primary/60 bg-vibe-primary/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
    <p className="text-[13px] text-white/55 leading-relaxed flex-1">{children}</p>
  </div>
);

export function HelpMode() {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-vibe-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <Zap className="w-6 h-6 text-white" fill="currentColor" />
        </div>
        <div>
          <p className="font-bold text-lg text-white">Morse Vibe Help Guide</p>
          <p className="text-[11px] font-mono text-white/30">Tap any section to expand.</p>
        </div>
      </div>

      <AccordionItem icon="❓" title="What is Morse Code?" content={
        <><P>Morse code uses short and long signals called dots and dashes to represent letters and numbers. Invented in the 1830s, it is still used by ham radio operators, military, and emergency services. SOS is dot-dot-dot dash-dash-dash dot-dot-dot.</P></>
      } />

      <AccordionItem icon="⌨️" title="Keys Tab - Type and Transmit" content={
        <><H>How to use</H><Step n={1}>Type your message. Morse translation appears below.</Step><Step n={2}>Tap Start Vibe to transmit as vibration pulses.</Step><Step n={3}>Receiver holds phone and feels the dots and dashes.</Step><H>Settings</H><P>Adjust dot duration, dash duration, letter gap, and word gap in Settings. Default dot is 100ms, dash is 300ms.</P></>
      } />

      <AccordionItem icon="👆" title="Tap Tab - Enter Morse Manually" content={
        <><P>Tap morse directly once you know the alphabet.</P><Step n={1}>Short tap for dot.</Step><Step n={2}>Hold for dash.</Step><Step n={3}>Pause between taps to separate letters.</Step><Step n={4}>Longer pause adds a word space.</Step></>
      } />

      <AccordionItem icon="🔊" title="Sound Tab - Audio Morse" content={
        <><P>Transmits morse as audio beeps.</P><Step n={1}>Type message in Keys tab first.</Step><Step n={2}>Adjust frequency (600-800 Hz standard) and WPM speed.</Step><Step n={3}>Tap Play Sound. Hold phone near radio mic to transmit over air.</Step><P>Use 18-20 WPM at 700 Hz for ham radio. Start at 5 WPM to learn by ear.</P></>
      } />

      <AccordionItem icon="🔦" title="Flash Tab - Torch Morse" content={
        <><P>Flashes morse using phone torch. Visible hundreds of metres in darkness.</P><Step n={1}>Type message in Keys tab.</Step><Step n={2}>Choose Torch (brighter, longer range) or Screen mode.</Step><Step n={3}>Set speed - 5 WPM or slower for visual reading.</Step><Step n={4}>Tap Flash Morse. Keep phone pointed at receiver.</Step><P>In darkness a phone torch is visible at 200-500 metres. SOS flashed repeatedly is an internationally recognised distress signal.</P></>
      } />

      <AccordionItem icon="🖼️" title="Image Tab - Send Images" content={
        <><Step n={1}>Tap Gallery or Camera to select or take a photo.</Step><Step n={2}>Adjust contrast and brightness. High contrast images work best.</Step><Step n={3}>Choose Morse, QR, or Both output mode.</Step><Step n={4}>Tap Send to transmit.</Step></>
      } />

      <AccordionItem icon="📱" title="QR Tab - QR Codes" content={
        <><P>Creates and scans standard single QR codes. Any camera app can scan them.</P><P>Difference from Optic tab: QR tab makes one static code for short messages. Optic tab makes animated sequences for longer text with error recovery. No internet needed for either.</P><H>Generate</H><Step n={1}>Type any text, URL, or message.</Step><Step n={2}>Tap Generate QR Code.</Step><Step n={3}>Show to receiver - any camera app can scan it.</Step><H>Scan</H><Step n={1}>Tap Open Camera.</Step><Step n={2}>Point at any QR code. Scans automatically.</Step></>
      } />

      <AccordionItem icon="🌐" title="Remote Tab - Send Over Distance" content={
        <><H>Remote - Internet Relay</H><P>Send morse vibrations to any phone anywhere in the world. Both phones connect to a shared room on the Morse Vibe server.</P><Step n={1}>Both phones open Remote tab and select Remote mode.</Step><Step n={2}>One person shares their Room ID with the other.</Step><Step n={3}>Other person enters Room ID and taps Connect.</Step><Step n={4}>Transmit from Keys tab - other phone vibrates instantly.</Step><P>Enable AES-256 Encryption in Settings for end-to-end encrypted messages. Both devices need the same key. The relay server never sees unencrypted content.</P><H>Nearby - Bluetooth</H><P>Direct connection between two phones. No internet needed. Range up to 100 metres outdoors.</P><Step n={1}>Both phones select Nearby mode.</Step><Step n={2}>One taps Advertise, other taps Scan.</Step><Step n={3}>Select device from list and connect.</Step><Step n={4}>Morse on one phone vibrates the other.</Step><H>LoRa - Meshtastic Radio</H><P>Connect to a Meshtastic LoRa hardware device for km-range off-grid mesh communication. No infrastructure needed. Used by hikers, preppers, and emergency responders worldwide.</P><Step n={1}>Pair a Meshtastic device to phone via Bluetooth first.</Step><Step n={2}>Select LoRa mode in Remote tab.</Step><Step n={3}>Connect and send morse through the mesh network.</Step></>
      } />

      <AccordionItem icon="✈️" title="Air Tab - Live Flight Radar" content={
        <><P>Live ATC-style radar showing real aircraft around you using ADS-B flight data. Aircraft broadcast position, speed, altitude, and ID continuously.</P><Step n={1}>Tap GPS to centre radar on your location.</Step><Step n={2}>Tap Scan to fetch live flight data.</Step><Step n={3}>Tap any blip for flight details - airline, type, altitude, speed, origin, destination.</Step><Step n={4}>Tap Analyse Aircraft for full identification including government and military detection.</Step><H>Display modes</H><P>OMNI mode shows all aircraft 360 degrees around you. SECTOR mode uses your compass to show only aircraft in the direction you are pointing.</P><P>Green blips are civil aircraft. Yellow blips are government, military, or special mission. Requires internet to fetch flight data.</P></>
      } />

      <AccordionItem icon="👁️" title="Optic Tab - Optical Data Transfer" content={
        <><P>Transfers text between phones using only screen and camera. No internet, Bluetooth, WiFi, cables, accounts, or pairing of any kind. Works through a window. Nothing passes through any network or server.</P><H>When to use it</H><P>Use when wireless is disabled or monitored, phones are in airplane mode, on different networks, or when you want no digital record. Also works across a window where nothing passes through walls or infrastructure at all.</P><H>How to Send</H><Step n={1}>Go to Optic tab, Send mode.</Step><Step n={2}>Type message or tap Paste from clipboard.</Step><Step n={3}>Adjust frame rate. Use 2-3 fps in poor light, 6-8 fps in good conditions.</Step><Step n={4}>Tap Start Optical Send. Animated QR codes cycle on screen.</Step><Step n={5}>Hold screen steady facing receiver camera at 20-60cm distance until they confirm.</Step><H>How to Receive</H><Step n={1}>Go to Optic tab, Receive mode.</Step><Step n={2}>Tap Start Camera.</Step><Step n={3}>Point camera at sender screen. Keep steady.</Step><Step n={4}>Frame counter increases as data is captured. Message appears automatically when complete.</Step><Step n={5}>Tap Copy or Send to Keys tab to use the text.</Step><H>How fountain codes work</H><P>Each QR frame contains a different random mix of message fragments. You only need enough frames in total - not every frame, not in order. Missed or blurry frames are recovered from the combinations in other frames. The same technology is used in satellite TV broadcasting and 5G networks.</P><H>Tips</H><P>Good lighting helps. Keep both phones still. Reduce frame rate if struggling. 20-60cm between screens works best.</P></>
      } />

      <AccordionItem icon="🔧" title="Fix Tab - Correct Decoded Text" content={
        <><P>Corrects garbled or partially decoded morse text using fuzzy word matching.</P><Step n={1}>Paste garbled text like HELL O EVERYON E or raw morse symbols.</Step><Step n={2}>Tap Analyse.</Step><Step n={3}>Yellow words have suggestions. Tap to replace.</Step><Step n={4}>Tap Copy for corrected text.</Step><P>Also automatically decodes raw morse symbols if pasted directly. Use / between words for morse input.</P></>
      } />

      <AccordionItem icon="📖" title="Guide Tab - Morse Reference" content={
        <><P>Complete offline morse reference. No internet needed.</P><P>A-Z: Full alphabet and numbers with visual dot-dash display. Searchable. Tap any letter to feel the vibration.</P><P>Radio: Ham radio prosigns and Q-codes. AR is end of message, SK is end of contact, QRZ is who is calling, QSL is confirmed receipt, QTH is my location.</P><P>SOS: Emergency phrases in morse. SOS is dot-dot-dot dash-dash-dash dot-dot-dot as a continuous signal with no letter breaks.</P><P>Timing: WPM speed guide and tips on learning to read morse by ear.</P></>
      } />

      <AccordionItem icon="🧭" title="Compass Tab - Navigation" content={
        <><P>ATC-style compass showing heading, pitch, roll, and GPS coordinates.</P><Step n={1}>Tap Start Compass.</Step><Step n={2}>Hold phone flat. Compass ring rotates with your heading.</Step><Step n={3}>Red needle always points to magnetic North.</Step><P>Heading is direction in degrees. 0 and 360 is North, 90 is East, 180 is South, 270 is West. Pitch is forward-back tilt. Roll is left-right tilt. GPS accuracy improves outdoors after 30-60 seconds. Keep away from metal objects for accurate compass readings.</P></>
      } />

      <AccordionItem icon="⚙️" title="Settings - Timing and Encryption" content={
        <><H>Timing</H><P>Dot Duration: length of a dot vibration. Default 100ms. Dash Duration: length of a dash. Default 300ms. Letter Gap: pause between letters. Default 300ms. Word Gap: pause between words. Default 700ms. Reduce all values for faster transmission. Increase for beginners.</P><H>AES-256 Encryption</H><Step n={1}>Enable Encryption in Settings.</Step><Step n={2}>Tap Generate Random Key or enter your own.</Step><Step n={3}>Share the key with your contact using a separate channel.</Step><Step n={4}>Both devices need the same key to decode messages.</Step><P>Encrypts Remote tab internet messages end-to-end. The relay server never sees the key or unencrypted content.</P></>
      } />

      <AccordionItem icon="💡" title="Tips and Use Cases" content={
        <><H>Learning morse</H><P>Learn 5 letters at a time. Start with E (dot), T (dash), S (dot-dot-dot), O (dash-dash-dash). Practice with Tap tab daily. Learn to hear complete words as sounds rather than counting dots and dashes.</P><H>Emergency</H><P>Flash tab works without signal, WiFi, or Bluetooth. SOS flashed repeatedly is internationally recognised. Vibration Keys tab works in total darkness and silence.</P><H>Ham radio</H><P>Sound tab at 18-20 WPM with 700 Hz for radio transmission. Guide tab has all prosigns and Q-codes. LoRa mode for off-air mesh communication.</P><H>Hiking</H><P>Nearby Bluetooth up to 100 metres without infrastructure. Flash tab hundreds of metres at night. Neither needs any connectivity.</P><H>Secure environments</H><P>Optic tab transfers data using only visible light. Nothing passes through any network. Enable AES-256 for encrypted internet relay.</P><H>Chain workflow</H><P>Receive text optically via Optic tab, tap Send to Keys tab, vibrate it to a third person. Data moves from internet to optical to vibration with no single connection point.</P></>
      } />

      <div className="bg-vibe-primary/10 border border-vibe-primary/20 rounded-xl p-4 flex flex-col gap-3 text-center">
        <p className="text-lg font-bold text-white">Enjoying Morse Vibe?</p>
        <p className="text-[12px] text-white/50 leading-relaxed">A quick rating helps other people discover the app.</p>
        <button onClick={() => { try { window.open("market://details?id=com.morsevibe.app", "_system"); } catch(e) { window.open("https://play.google.com/store/apps/details?id=com.morsevibe.app", "_system"); } }}
          className="w-full py-3 rounded-xl bg-vibe-primary text-white font-bold text-base uppercase tracking-widest active:scale-95">
          Rate on Play Store
        </button>
      </div>

      <div className="bg-vibe-surface border border-white/5 rounded-xl p-4 text-center flex flex-col gap-1">
        <p className="text-[12px] font-mono text-white/30 uppercase tracking-wider">About Morse Vibe</p>
        <p className="text-[11px] text-white/20">Developed by FaithAlarm</p>
        <p className="text-[11px] text-white/20">faithalarmapp@gmail.com</p>
      </div>
    </div>
  );
}
