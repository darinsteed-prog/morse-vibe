const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

// Fix panel height so Done button is always visible
c = c.replace(
  'max-h-[75vh] overflow-y-auto mt-20',
  'max-h-[70vh] overflow-y-auto mt-16'
);

// Fix encryption toggle - setEncryptionEnabled might not be updating
// Check if encryptionEnabled state is being read correctly
console.log('encryptionEnabled found:', c.includes('encryptionEnabled'));
console.log('setEncryptionEnabled found:', c.includes('setEncryptionEnabled'));

fs.writeFileSync('src/App.tsx', c);
console.log('Done');
