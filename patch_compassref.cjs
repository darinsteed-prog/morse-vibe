const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

// Add compassHeadingRef declaration after sweepRef
const old = "  const sweepRef = React.useRef(0);";
const newCode = "  const sweepRef = React.useRef(0);\n  const compassHeadingRef = React.useRef(0);";
c = c.replace(old, newCode);

// Add compass listener after fetchFlights useEffect
const old2 = "  React.useEffect(() => { fetchFlights(); }, []);";
const newCode2 = `  React.useEffect(() => { fetchFlights(); }, []);

  React.useEffect(() => {
    const handler = (e) => {
      if(e.alpha != null) {
        compassHeadingRef.current = (360 - e.alpha) % 360;
      }
    };
    window.addEventListener('deviceorientationabsolute', handler, true);
    window.addEventListener('deviceorientation', handler, true);
    return () => {
      window.removeEventListener('deviceorientationabsolute', handler, true);
      window.removeEventListener('deviceorientation', handler, true);
    };
  }, []);`;

c = c.replace(old2, newCode2);
fs.writeFileSync('src/App.tsx', c);
console.log('Done:', c.includes('compassHeadingRef = React.useRef') ? 'applied' : 'FAILED');
