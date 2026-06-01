const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const old = "      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.strokeStyle='rgba(0,255,70,0.4)'; ctx.lineWidth=2; ctx.stroke();\n      const kmLabel=Math.round((BASE_RANGE/zoomRef.current)*111)+'km';";

const newCode = "      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.strokeStyle='rgba(0,255,70,0.4)'; ctx.lineWidth=2; ctx.stroke();\n      const northRad=(compassHeadingRef.current-90)*Math.PI/180;\n      const needleLen=R-10;\n      ctx.save(); ctx.translate(cx,cy); ctx.rotate(northRad);\n      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(needleLen,0); ctx.strokeStyle='rgba(255,60,60,0.95)'; ctx.lineWidth=2; ctx.stroke();\n      ctx.beginPath(); ctx.moveTo(needleLen,0); ctx.lineTo(needleLen-6,-3); ctx.lineTo(needleLen-6,3); ctx.closePath(); ctx.fillStyle='rgba(255,60,60,0.95)'; ctx.fill();\n      ctx.restore();\n      ctx.fillStyle='rgba(255,60,60,0.9)'; ctx.font='bold 11px monospace'; ctx.textAlign='center';\n      ctx.fillText('N', cx+Math.cos(northRad)*needleLen, cy+Math.sin(northRad)*needleLen-4);\n      const kmLabel=Math.round((BASE_RANGE/zoomRef.current)*111)+'km';";

if(c.includes(old.split('\n')[0])) {
  c = c.replace(old, newCode);
  fs.writeFileSync('src/App.tsx', c);
  console.log('Done: patch applied');
} else {
  console.log('NOT FOUND');
}
