const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(
  "      ctx.clearRect(0,0,W,H);\n      // Rotate entire radar to match compass\n      const headingRad = compassHeadingRef.current * Math.PI / 180;\n      ctx.save();\n      ctx.translate(cx, cy);\n      ctx.rotate(-headingRad);\n      ctx.translate(-cx, -cy);",
  "      ctx.clearRect(0,0,W,H);"
);

c = c.replace(
  "      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.strokeStyle='rgba(0,255,70,0.4)'; ctx.lineWidth=2; ctx.stroke();\n      ctx.restore();",
  "      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.strokeStyle='rgba(0,255,70,0.4)'; ctx.lineWidth=2; ctx.stroke();"
);

fs.writeFileSync('src/App.tsx', c);
console.log('Done');
