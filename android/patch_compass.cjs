const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

// After the outer ring draw, add compass needle overlay
const old = "      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.strokeStyle='rgba(0,255,70,0.4)'; ctx.lineWidth=2; ctx.stroke();";
const newCode = `      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.strokeStyle='rgba(0,255,70,0.4)'; ctx.lineWidth=2; ctx.stroke();

      // Compass needle - points to real North
      const northRad = (compassHeadingRef.current - 90) * Math.PI / 180;
      const needleLen = 18;
      const nx = cx + Math.cos(northRad) * (R - 12);
      const ny = cy + Math.sin(northRad) * (R - 12);
      // Red north needle
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(northRad);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(needleLen, 0);
      ctx.strokeStyle = 'rgba(255,60,60,0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Arrow head
      ctx.beginPath();
      ctx.moveTo(needleLen, 0);
      ctx.lineTo(needleLen - 5, -3);
      ctx.lineTo(needleLen - 5, 3);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,60,60,0.9)';
      ctx.fill();
      ctx.restore();
      // N label at needle tip
      ctx.fillStyle = 'rgba(255,60,60,0.9)';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('N', nx, ny);`;

c = c.replace(old, newCode);
fs.writeFileSync('src/App.tsx', c);
console.log('Done:', c.includes('northRad') ? 'patch applied' : 'FAILED');
