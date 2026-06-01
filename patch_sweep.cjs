const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const old = `        if(modeRef.current==='sweep'){
          const angleDiff=(sweepRef.current-fAngle+360)%360;
          if(angleDiff<3){
            blipAlphaRef.current[f.icao]=1.0;
          }
           if(blipAlphaRef.current[f.icao]===undefined || blipAlphaRef.current[f.icao]<0){
            return;
          }
          if(fadeRef.current){
            alpha=blipAlphaRef.current[f.icao];
            if(alpha===0) return;
            alpha=Math.max(0,alpha-FADE_RATE);
            blipAlphaRef.current[f.icao]=alpha;
            if(alpha<0.02){ blipAlphaRef.current[f.icao]=-1; return; }
          } else {
            alpha=1;
          }
        }`;

const newCode = `        if(modeRef.current==='sweep'){
          const now=Date.now();
          const sweepMs=12000;
          const lastSeen=lastSeenRef.current[f.icao]||0;
          const timeSince=now-lastSeen;
          const sweepAngle=(sweepRef.current-90+360)%360;
          const latDiff=f.lat-latRef.current;
          const lonDiff=f.lon-lonRef.current;
          const bearing=(Math.atan2(lonDiff,latDiff)*180/Math.PI+360)%360;
          const diff=(sweepAngle-bearing+360)%360;
          if(diff<4){
            lastSeenRef.current[f.icao]=now;
            blipAlphaRef.current[f.icao]=1.0;
          }
          if(!lastSeenRef.current[f.icao]) return;
          if(fadeRef.current){
            alpha=Math.max(0,1-timeSince/(sweepMs*0.9));
            if(alpha<0.02) return;
          } else {
            if(timeSince>sweepMs) return;
            alpha=1;
          }
        }`;

c = c.replace(old, newCode);
fs.writeFileSync('src/App.tsx', c);
console.log('Done:', c.includes('bearingRad') ? 'applied' : 'FAILED - checking...', c.includes('sweepMs') ? 'sweepMs found' : 'sweepMs NOT found');
