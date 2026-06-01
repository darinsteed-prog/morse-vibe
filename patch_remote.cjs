const fs = require('fs');
let c = fs.readFileSync('src/components/RemoteTab.tsx', 'utf8');
c = c.replace("          <ImageDecoder receivedText={lastReceivedText}/>\n          <QRDecoder receivedText={lastReceivedText}/>\n          <MorseDecoder receivedText={lastReceivedText}/>", "");
fs.writeFileSync('src/components/RemoteTab.tsx', c);
console.log('Done:', c.includes('QRDecoder receivedText') ? 'STILL THERE' : 'removed');
