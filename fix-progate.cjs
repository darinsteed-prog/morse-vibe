const fs = require("fs");
const file = "src/App.tsx";
let src = fs.readFileSync(file, "utf8");

src = src.replace(
  `inputMode === 'atc' ? (<ATCMode />) : (
          <RemoteTab roomId={roomId} setRoomId={setRoomId} wsConnected={wsConnected} wsRef={wsRef} copied={copied} copyWebhook={copyWebhook} lastReceivedText={lastReceivedText} setLastReceivedText={setLastReceivedText} setText={setText} vibrateSafe={vibrateSafe} settings={settings} encryptionEnabled={encryptionEnabled} encryptionKey={encryptionKey} />
        )`,
  `inputMode === 'atc' ? (<ProGate feature="Air Radar" description="Live flight radar with aircraft analysis. Unlock Pro to access."><ATCMode /></ProGate>) : (
          <ProGate feature="Remote & Nearby" description="Send morse over internet and Bluetooth mesh. Unlock Pro to access."><RemoteTab roomId={roomId} setRoomId={setRoomId} wsConnected={wsConnected} wsRef={wsRef} copied={copied} copyWebhook={copyWebhook} lastReceivedText={lastReceivedText} setLastReceivedText={setLastReceivedText} setText={setText} vibrateSafe={vibrateSafe} settings={settings} encryptionEnabled={encryptionEnabled} encryptionKey={encryptionKey} /></ProGate>
        )`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ ProGate applied to ATCMode and RemoteTab");
