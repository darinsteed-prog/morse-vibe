const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const old = `      if(modeRef.current==='sector'){
        const cRad=(compassRef.current-90)*Math.PI/180,halfSec=(sectorRef.current/2)*Math.PI/180;
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,R,cRad-halfSec,cRad+halfSec); ctx.closePath(); ctx.fillStyle='rgba(0,255,70,0.04)'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(cRad-halfSec)*R,cy+Math.sin(cRad-halfSec)*R); ctx.strokeStyle='rgba(0,255,70,0.3)'; ctx.lineWidth=1; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(cRad+halfSec)*R,cy+Math.sin(cRad+halfSec)*R); ctx.stroke();
      }`;

const newCode = `      if(modeRef.current==='sector'){
        const cRad=(compassRef.current-90)*Math.PI/180,halfSec=(sectorRef.current/2)*Math.PI/180;
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,R,cRad-halfSec,cRad+halfSec); ctx.closePath(); ctx.fillStyle='rgba(0,255,70,0.04)'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(cRad-halfSec)*R,cy+Math.sin(cRad-halfSec)*R); ctx.strokeStyle='rgba(0,255,70,0.3)'; ctx.lineWidth=1; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(cRad+halfSec)*R,cy+Math.sin(cRad+halfSec)*R); ctx.stroke();
        // Store sector params for mask after aircraft draw
        ctx._sectorCRad=cRad; ctx._sectorHalf=halfSec;
      }`;

c = c.replace(old, newCode);

// Find where the compass needle is drawn (end of draw loop) and add sector mask after aircraft
const maskInsert = `// Draw sector blackout mask
      if(modeRef.current==='sector' && ctx._sectorCRad!==undefined){
        const cRad=ctx._sectorCRad, halfSec=ctx._sectorHalf;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx,cy,R,0,Math.PI*2);
        ctx.closePath();
        ctx.beginPath();
        ctx.moveTo(cx,cy);
        ctx.arc(cx,cy,R,cRad-halfSec,cRad+halfSec);
        ctx.closePath();
        ctx.save();
        // Fill entire circle black then cut out sector
        ctx.beginPath();
        ctx.arc(cx,cy,R,0,Math.PI*2,false);
        ctx.moveTo(cx,cy);
        ctx.arc(cx,cy,R,cRad-halfSec,cRad+halfSec,false);
        ctx.closePath();
        ctx.fillStyle='rgba(0,8,0,0.85)';
        ctx.fill('evenodd');
        ctx.restore();
      }`;

// Insert mask just before the compass needle drawing
const compassInsert = `const northRad=(compassRef.current-90)*Math.PI/180`;
c = c.replace(compassInsert, maskInsert + '\n      ' + compassInsert);

fs.writeFileSync('src/App.tsx', c);
console.log('Done:', c.includes('evenodd') ? 'applied' : 'FAILED');
