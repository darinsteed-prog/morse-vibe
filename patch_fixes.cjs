const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

// Fix 1: Reset all blip alphas to 0 when flights load so nothing shows before sweep hits
c = c.replace(
  'setFlights(parsed); flightsRef.current=parsed; blipAlphaRef.current={}; setLastUpdated',
  'setFlights(parsed); flightsRef.current=parsed; blipAlphaRef.current={}; Object.keys(blipAlphaRef.current).forEach(k=>blipAlphaRef.current[k]=0); setLastUpdated'
);

// Fix 2: Sector angle - fAngle is bearing FROM center, compassRef is phone heading
// Aircraft should show when their bearing from center is within sector of compass heading
// The issue is fAngle uses atan2(dx,-dy) which gives bearing from North clockwise
// compassRef gives phone heading from North clockwise - these SHOULD match
// Fix: normalize properly
c = c.replace(
  "          let diff=(fAngle-compassRef.current+360)%360; if(diff>180) diff-=360;\n          if(Math.abs(diff)>halfSec) return;",
  "          const rawDiff=((fAngle-compassRef.current)%360+360)%360;\n          const diff=rawDiff>180?rawDiff-360:rawDiff;\n          if(Math.abs(diff)>halfSec) return;"
);

fs.writeFileSync('src/App.tsx', c);
console.log('Done');
