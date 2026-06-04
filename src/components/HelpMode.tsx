import React, { useState } from "react";
import { Zap, ChevronDown, ChevronUp } from "lucide-react";

interface Section {
  title: string;
  icon: string;
  content: React.ReactNode;
}

function AccordionItem({ title, icon, content }: { title: string; icon: string; content: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-vibe-surface border border-white/5 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-bold text-base text-white">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-2 border-t border-white/5 pt-3">
          {content}
        </div>
      )}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-white/50 leading-relaxed">{children}</p>;
}

function B({ children }: { children: React.ReactNode }) {
  return <span className="text-white/80 font-bold">{children}</span>;
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-[12px] font-mono text-vibe-primary/60 bg-vibe-primary/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
      <p className="text-[13px] text-white/50 leading-relaxed">{children}</p>
    </div>
  );
}

interface HelpModeProps {}

export function HelpMode({}: HelpModeProps) {
  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="bg-vibe-surface border border-white/10 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-vibe-primary rounded-xl flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" fill="currentColor" />
        </div>
        <div>
          <p className="font-bold text-lg text-white">Morse Vibe</p>
          <p className="text-[11px] font-mono text-white/30">Complete User Guide · Works Offline</p>
        </div>
      </div>

      {/* What is Morse Code */}
      <AccordionItem icon="📡" title="What is Morse Code?" content={
        <>
          <P>Morse code is a communication system that uses patterns of short and long signals — called <B>dots (·)</B> and <B>dashes (−)</B> — to represent letters and numbers.</P>
          <P>It was invented in the 1830s and is still used today by ham radio operators, the military, and emergency services because it works when everything else fails — no internet, no phone signal needed.</P>
          <P>Each letter has a unique pattern. For example: <B>A = ·−</B>, <B>B = −···</B>, <B>S = ···</B>, <B>O = −−−</B>.</P>
          <P>The famous distress signal <B>SOS</B> is three dots, three dashes, three dots: <B>···−−−···</B></P>
        </>
      } />

      {/* Keys Tab */}
      <AccordionItem icon="⌨️" title="Keys Tab — Type & Transmit" content={
        <>
          <P>The main tab for typing a message and sending it as morse code vibration.</P>
          <Step n={1}>Type your message using the keyboard.</Step>
          <Step n={2}>The morse code translation appears below as you type.</Step>
          <Step n={3}>Tap <B>Start Vibe</B> to transmit the message as vibration pulses.</Step>
          <Step n={4}>The receiver holds their phone and feels the vibration pattern.</Step>
          <P>Use <B>Settings</B> (top right) to adjust dot and dash timing to your preference.</P>
        </>
      } />

      {/* Tap Tab */}
      <AccordionItem icon="👆" title="Tap Tab — Enter Morse Manually" content={
        <>
          <P>For users who know morse code and want to tap it directly instead of typing text.</P>
          <Step n={1}>Tap the large button quickly for a <B>dot</B> — short tap.</Step>
          <Step n={2}>Hold the button for a <B>dash</B> — long tap.</Step>
          <Step n={3}>Pause briefly between taps to separate letters.</Step>
          <Step n={4}>Longer pause adds a word space.</Step>
          <P>The decoded text appears above the tap area in real time.</P>
        </>
      } />

      {/* Sound Tab */}
      <AccordionItem icon="🔊" title="Sound Tab — Audio Morse" content={
        <>
          <P>Transmits your message as audible morse code beeps through the speaker.</P>
          <Step n={1}>Type your message in the <B>Keys tab</B> first.</Step>
          <Step n={2}>Switch to Sound tab.</Step>
          <Step n={3}>Adjust <B>Frequency</B> (pitch of the beep) and <B>Speed</B> (WPM).</Step>
          <Step n={4}>Tap <B>Play Sound</B> to transmit.</Step>
          <P>Useful for communicating with ham radio operators or anyone with a morse decoder.</P>
          <P>The receiver can use the <B>Fix tab</B> to correct any decoding errors.</P>
        </>
      } />

      {/* Flash Tab */}
      <AccordionItem icon="🔦" title="Flash Tab — Torch Morse" content={
        <>
          <P>Transmits morse code using the phone torch — useful for signalling over distance in the dark.</P>
          <Step n={1}>Type your message in the <B>Keys tab</B> first.</Step>
          <Step n={2}>Switch to Flash tab.</Step>
          <Step n={3}>Choose <B>Torch</B> (uses camera flash) or <B>Screen</B> (white screen flashes).</Step>
          <Step n={4}>Set speed — slower is easier to read visually.</Step>
          <Step n={5}>Tap <B>Flash Morse</B> to transmit.</Step>
          <P>Point the torch at the receiver. Works over hundreds of metres in darkness.</P>
          <P>The receiver watches the flashing light and counts the dots and dashes to decode the message manually using the <B>Guide tab</B> as reference.</P>
        </>
      } />

      {/* Image Tab */}
      <AccordionItem icon="🖼️" title="Image Tab — Send Images" content={
        <>
          <P>Encode and send an image as morse code vibration or QR code.</P>
          <Step n={1}>Tap <B>Gallery</B> to choose a photo or <B>Camera</B> to take one.</Step>
          <Step n={2}>Adjust <B>Contrast</B> and <B>Brightness</B> for best results.</Step>
          <Step n={3}>Choose mode: <B>Morse</B> (vibration), <B>QR</B> (scannable code), or <B>Both</B>.</Step>
          <P>High contrast black and white images work best. The receiver needs Morse Vibe to decode vibration mode.</P>
        </>
      } />

      {/* QR Tab */}
      <AccordionItem icon="📱" title="QR Tab — QR Codes" content={
        <>
          <P>Generate or scan QR codes for any text or URL.</P>
          <P><B>Generate:</B> Type any text and tap Generate QR Code. Show the QR to the receiver to scan with any camera app.</P>
          <P><B>Scan:</B> Tap Open Camera to scan a QR code. The decoded text appears instantly.</P>
        </>
      } />

      {/* Remote Tab */}
      <AccordionItem icon="🌐" title="Remote Tab — Send Over Distance" content={
        <>
          <P>Three ways to communicate over distance:</P>
          <P><B>Remote (Internet):</B> Both devices enter the same Room ID. Requires internet. Messages trigger vibration on the other device instantly. Good for controlling a phone across the world.</P>
          <Step n={1}>Share your <B>Room ID</B> with the other person.</Step>
          <Step n={2}>They enter the same Room ID on their device.</Step>
          <Step n={3}>Type a message in Keys tab and tap <B>Start Vibe</B> — it transmits to them.</Step>
          <P><B>Nearby (Bluetooth):</B> Direct connection between two phones with Morse Vibe. No internet needed. Range up to 100m outdoors. Both phones must have Morse Vibe open.</P>
          <P><B>LoRa (Meshtastic):</B> Connects to Meshtastic LoRa hardware for km-range off-grid communication. Requires a Meshtastic device (TTGO T-Beam, Heltec LoRa 32, etc.).</P>
        </>
      } />

      {/* Air Tab */}
      <AccordionItem icon="✈️" title="Air Tab — Live Flight Radar" content={
        <>
          <P>Live air traffic radar showing real flights around you.</P>
          <Step n={1}>Tap <B>GPS</B> to centre the radar on your location.</Step>
          <Step n={2}>Tap <B>Scan</B> to fetch live flight data.</Step>
          <Step n={3}>Pinch to zoom in or out.</Step>
          <Step n={4}>Tap any blip to see flight details.</Step>
          <Step n={5}>Tap <B>Analyse Aircraft</B> for full analysis including predicted position.</Step>
          <P><B>OMNI mode:</B> Rotating sweep shows all aircraft around you.</P>
          <P><B>SECTOR mode:</B> Uses your phone compass — only shows aircraft in the direction you point.</P>
          <P><B>Green blips</B> = civil aircraft. <B>Yellow blips</B> = government or military.</P>
          <P>Requires internet to fetch flight data.</P>
        </>
      } />

      {/* Fix Tab */}
      <AccordionItem icon="🔧" title="Fix Tab — Correct Decoded Text" content={
        <>
          <P>Use this to correct garbled or partially decoded morse text.</P>
          <Step n={1}>Paste decoded text like <B>HELL O EVERYON E</B> — or morse symbols like <B>.... . .-.. .-.. ---</B></Step>
          <Step n={2}>Tap <B>Analyse</B>.</Step>
          <Step n={3}>Each word appears as a card. <B>Yellow cards</B> have suggestions.</Step>
          <Step n={4}>Tap a suggestion to replace the wrong word.</Step>
          <Step n={5}>Tap <B>Copy</B> to copy the corrected text.</Step>
          <P>For morse input: use <B>/</B> between words. Example: <B>.... . / .-- --- .-. .-.. -..</B></P>
        </>
      } />

      {/* Guide Tab */}
      <AccordionItem icon="📖" title="Guide Tab — Morse Reference" content={
        <>
          <P>Complete offline morse code reference guide. No internet needed.</P>
          <P><B>A-Z:</B> Full alphabet and numbers with visual dot/dash display. Tap search to find any letter.</P>
          <P><B>Radio:</B> Standard ham radio prosigns and Q-codes used by operators worldwide.</P>
          <P><B>SOS:</B> Emergency phrases in morse code. SOS is three dots, three dashes, three dots with no spaces.</P>
          <P><B>Timing:</B> WPM speed reference table and how to read morse by ear using dit and dah.</P>
        </>
      } />

      {/* Settings */}
      <AccordionItem icon="⚙️" title="Settings — Timing & Encryption" content={
        <>
          <P><B>Visual Flash:</B> Screen flashes white during vibration transmission — useful for visual feedback.</P>
          <P><B>Dot Duration:</B> How long a dot vibration lasts in milliseconds. Default 100ms.</P>
          <P><B>Dash Duration:</B> How long a dash vibration lasts. Default 300ms (3x dot).</P>
          <P><B>Letter Gap:</B> Pause between letters. Default 300ms.</P>
          <P><B>Word Gap:</B> Pause between words. Default 700ms.</P>
          <P><B>AES-256 Encryption:</B> Encrypts Remote tab messages so only people with the same key can read them. Both sender and receiver must use the same secret key. Tap <B>Generate Random Key</B> and share it securely with the other person before communicating.</P>
        </>
      } />

      {/* Tips */}
      <AccordionItem icon="💡" title="Tips & Best Practices" content={
        <>
          <P><B>Learning morse:</B> Start with the Guide tab A-Z section. Practice with the Tap tab — short tap for dot, long tap for dash.</P>
          <P><B>Emergency use:</B> SOS is always three dots, three dashes, three dots. The Flash tab works even without phone signal.</P>
          <P><B>Ham radio:</B> Use Sound tab at 18-20 WPM to transmit over a radio. Use the Fix tab to correct any received text errors.</P>
          <P><B>Hiking/survival:</B> Flash tab works over hundreds of metres at night. Nearby tab works without internet up to 100m.</P>
          <P><B>Best vibration results:</B> Lower WPM (10-15) gives clearer vibration patterns that are easier to feel.</P>
        </>
      } />

      {/* Rate */}
      <div className="bg-vibe-primary/10 border border-vibe-primary/20 rounded-xl p-4 flex flex-col gap-3 text-center">
        <p className="text-lg font-bold text-white">⭐ Enjoying Morse Vibe?</p>
        <p className="text-[12px] text-white/50 leading-relaxed">A quick rating on the Play Store helps other users find the app and supports future development.</p>
        <button onClick={() => { try { (window as any).open("market://details?id=com.morsevibe.app", "_system"); } catch(e) { (window as any).open("https://play.google.com/store/apps/details?id=com.morsevibe.app", "_system"); } }}
          className="w-full py-3 rounded-xl bg-vibe-primary text-white font-bold text-base uppercase tracking-widest active:scale-95 transition-all">
          ⭐ Rate on Play Store
        </button>
        <p className="text-[11px] text-white/20">Takes less than 30 seconds · means a lot!</p>
      </div>

      {/* About */}
      <div className="bg-vibe-surface border border-white/5 rounded-xl p-4 text-center flex flex-col gap-1">
        <p className="text-[12px] font-mono text-white/30 uppercase tracking-wider">About Morse Vibe</p>
        <p className="text-[11px] text-white/20">Developed by FaithAlarm</p>
        <p className="text-[11px] text-white/20">faithalarmapp@gmail.com</p>
        <p className="text-[11px] text-white/15 mt-1">All features work offline except Remote (internet) and Air (flight data)</p>
      </div>

    </div>
  );
}
