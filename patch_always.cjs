const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(
  'if(mode!==\'sector\') return;',
  '// always run compass sensor'
);

fs.writeFileSync('src/App.tsx', c);
console.log('Done:', c.includes('always run compass') ? 'applied' : 'FAILED');
