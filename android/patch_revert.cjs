const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

// Remove the broken rotation code
c = c.replace(
  `      ctx.clearRect(0,0,W,H);
      // Rotate entire radar to match compass
      const headingRad = compassHeadingRef.current * Math.PI / 180;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-headingRad);
      ctx.translate(-cx, -cy);`,
  "      ctx.clearRect(0,0,W,H);"
);

c = c.replace(
  "      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.strokeStyle='rgba(0,255,70,0.4)'; ctx.lineWidth=2; ctx.stroke();\n      ctx.restore();",
  "      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.strokeStyle='rgba(0,255,70,0.4)'; ctx.lineWidth=2; ctx.stroke();"
);

fs.writeFileSync('src/App.tsx', c);
console.log('Done');
