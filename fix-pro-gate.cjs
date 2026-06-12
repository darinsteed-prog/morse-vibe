const fs = require("fs");
const file = "src/App.tsx";
let src = fs.readFileSync(file, "utf8");

// Add imports
src = src.replace(
  `import React, { useState, useEffect, useRef } from 'react';`,
  `import React, { useState, useEffect, useRef } from 'react';
import { ProProvider } from './pro';
import { ProGate } from './components/ProGate';`
);

// Wrap app in ProProvider
src = src.replace(
  `return (
    <div`,
  `return (
    <ProProvider>
    <div`
);
src = src.replace(
  `  );
}`,
  `  </ProProvider>
  );
}`
);

// Wrap Air tab in ProGate
src = src.replace(
  `: inputMode === 'ref' ? (<ReferenceMode />) : inputMode === 'help' ? (<HelpMode />) : inputMode === 'atc'`,
  `: inputMode === 'ref' ? (<ReferenceMode />) : inputMode === 'help' ? (<HelpMode />) : inputMode === 'atc'`
);

// Gate the atc, remote tabs
src = src.replace(
  `inputMode === 'atc' ? <ATCMode /> :`,
  `inputMode === 'atc' ? <ProGate feature="Air Radar" description="Live flight radar with aircraft analysis"><ATCMode /></ProGate> :`
);

src = src.replace(
  `inputMode === 'remote' ? <RemoteTab`,
  `inputMode === 'remote' ? <ProGate feature="Remote & Nearby" description="Send morse over internet and Bluetooth"><RemoteTab`
);

// Close the RemoteTab ProGate - find the closing tag
src = src.replace(
  `/> : inputMode === 'atc'`,
  `/></ProGate> : inputMode === 'atc'`
);

fs.writeFileSync(file, src, "utf8");
console.log("✔ Pro gate added");
