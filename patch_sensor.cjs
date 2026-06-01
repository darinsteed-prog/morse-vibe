const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const old = `  React.useEffect(() => {
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

const newCode = `  React.useEffect(() => {
    let sensor = null;
    try {
      sensor = new window.AbsoluteOrientationSensor({ frequency: 10 });
      sensor.addEventListener('reading', () => {
        const q = sensor.quaternion;
        const yaw = Math.atan2(2*(q[3]*q[2]+q[0]*q[1]), 1-2*(q[1]*q[1]+q[2]*q[2]));
        compassHeadingRef.current = ((yaw * 180 / Math.PI) + 360) % 360;
      });
      sensor.start();
    } catch(e) {
      const handler = (ev) => {
        if(ev.alpha != null) compassHeadingRef.current = (360 - ev.alpha) % 360;
      };
      window.addEventListener('deviceorientationabsolute', handler, true);
    }
    return () => { if(sensor) try { sensor.stop(); } catch(e) {} };
  }, []);`;

c = c.replace(old, newCode);
fs.writeFileSync('src/App.tsx', c);
console.log('Done:', c.includes('AbsoluteOrientationSensor') ? 'applied' : 'FAILED');
