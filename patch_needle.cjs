const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

// Replace compassHeadingRef with compassRef in the needle drawing code
c = c.replace(
  'const northRad=(compassHeadingRef.current-90)*Math.PI/180;',
  'const northRad=(compassRef.current-90)*Math.PI/180;'
);

fs.writeFileSync('src/App.tsx', c);
console.log('Done:', c.includes('compassRef.current-90') ? 'applied' : 'FAILED');
