import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Play, Square, Settings, History, Globe, Copy, Check, ChevronRight, Trash2, Plane } from 'lucide-react';
import { textToMorse, textToVibrationPattern, DEFAULT_SETTINGS, MORSE_TO_CHAR } from './constants';
import { KeyboardMode } from './components/KeyboardMode';
import { TelegraphMode } from './components/TelegraphMode';
import { ImageMode } from './components/ImageMode';
import { ImageDecoder } from './components/ImageDecoder';
import { QRMode } from './components/QRMode';
import { QRDecoder } from './components/QRDecoder';
import { MorseDecoder } from './components/MorseDecoder';
import { SoundMode } from './components/SoundMode';
import { FlashMode } from './components/FlashMode';
import { encrypt, decrypt, generateKey } from './crypto';

function ATCMode() {
  const [flights, setFlights] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [lastUpdated, setLastUpdated] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [zoom, setZoom] = React.useState(1);
  const [mode, setMode] = React.useState('sweep');
  const [compass, setCompass] = React.useState(0);
  const [sectorWidth, setSectorWidth] = React.useState(90);
  const [fadeEnabled, setFadeEnabled] = React.useState(true);
  const [myLat, setMyLat] = React.useState(null);
  const [myLon, setMyLon] = React.useState(null);
  const [locLabel, setLocLabel] = React.useState('DUBLIN');
  const [analysis, setAnalysis] = React.useState(null);
  const [analysing, setAnalysing] = React.useState(false);
  const canvasRef = React.useRef(null);
  const animRef = React.useRef(null);
  const sweepRef = React.useRef(0);
  const flightsRef = React.useRef([]);
  const blipAlphaRef = React.useRef({});
  const zoomRef = React.useRef(1);
  const pinchRef = React.useRef(null);
  const compassRef = React.useRef(0);
  const modeRef = React.useRef('sweep');
  const sectorRef = React.useRef(90);
  const latRef = React.useRef(53.3);
  const lonRef = React.useRef(-6.3);
  const fadeRef = React.useRef(true);
  const BASE_RANGE = 3.5;

  const getLocation = () => {
    if(!navigator.geolocation){ setError('GPS not available'); return; }
    navigator.geolocation.getCurrentPosition(pos => {
      const la=pos.coords.latitude, lo=pos.coords.longitude;
      latRef.current=la; lonRef.current=lo;
      setMyLat(la); setMyLon(lo);
      setLocLabel(la.toFixed(2)+'N '+Math.abs(lo).toFixed(2)+(lo<0?'W':'E'));
      fetchFlights(la,lo);
    }, err=>setError('GPS: '+err.message), {enableHighAccuracy:true,timeout:8000});
  };

  const fetchFlights = async (la,lo) => {
    const clat=la??latRef.current, clon=lo??lonRef.current;
    setLoading(true); setError(null);
    try {
      const { data } = await window.Capacitor.Plugins.CapacitorHttp.get({ url:'https://api.adsb.lol/v2/lat/'+clat+'/lon/'+clon+'/dist/250' });
      const parsed=(data.ac||[]).filter(a=>a.flight&&!a.gnd&&a.lat!=null&&a.lon!=null).map(a=>({ icao:a.hex, callsign:(a.flight||'').trim(), lat:a.lat, lon:a.lon, altitude:a.alt_baro!=null?Math.round(a.alt_baro*0.3048):null, velocity:a.gs!=null?Math.round(a.gs):null, heading:a.track!=null?Math.round(a.track):null, type:a.t||'', vrate:a.baro_rate!=null?Math.round(a.baro_rate):null, squawk:a.squawk||null }));
      setFlights(parsed); flightsRef.current=parsed; blipAlphaRef.current={}; setLastUpdated(new Date().toLocaleTimeString());
    } catch(e){ setError(e.message); } finally { setLoading(false); }
  };

  React.useEffect(()=>{ fetchFlights(); },[]);

  React.useEffect(()=>{
    if(mode!=='sector') return;
    let sensor=null;
    try {
      sensor=new AbsoluteOrientationSensor({frequency:10});
      sensor.addEventListener('reading',()=>{ const q=sensor.quaternion; const yaw=Math.atan2(2*(q[3]*q[2]+q[0]*q[1]),1-2*(q[1]*q[1]+q[2]*q[2])); const deg=((yaw*180/Math.PI)+360)%360; compassRef.current=deg; setCompass(deg); });
      sensor.start();
    } catch(e) {
      const handler=(ev)=>{ const deg=(360-(ev.alpha||0))%360; compassRef.current=deg; setCompass(deg); };
      window.addEventListener('deviceorientationabsolute',handler);
      return ()=>window.removeEventListener('deviceorientationabsolute',handler);
    }
    return ()=>{ if(sensor) sensor.stop(); };
  },[mode]);

  const isGovAircraft=(f)=>{
    const cs=f.callsign.toUpperCase();
    const govPrefixes=['RRR','GAF','NATO','LAGR','FORTE','DUKE','CASA','AZAZ','RCH','PAT','REACH','IAC','MAF','EXEC','VIP','SAM','AF1','AIR','IRON','SWORD','TROP','EVIL','JAKE','COMD','ROCKY','GHOST','RAIDR','VIPER','HOMER'];
    const milTypes=['EUFI','F16','F18','C130','E3CF','P8','B52','C17','KC135','F15','F35','AV8','HAWK','TPHR'];
    return govPrefixes.some(p=>cs.startsWith(p))||milTypes.includes(f.type.toUpperCase());
  };

  const analyseAircraft = async (f) => {
    setAnalysing(true); setAnalysis(null);
    const gov=isGovAircraft(f);
    const altFt=f.altitude!=null?Math.round(f.altitude*3.281):null;
    const predLat=f.lat+(Math.cos((f.heading-90)*Math.PI/180)*(f.velocity||0)*0.000277*0.5);
    const predLon=f.lon+(Math.sin((f.heading-90)*Math.PI/180)*(f.velocity||0)*0.000277*0.5);
    const threats=[];
    if(f.squawk==='7500') threats.push('SQUAWK 7500: HIJACK');
    if(f.squawk==='7600') threats.push('SQUAWK 7600: RADIO FAILURE');
    if(f.squawk==='7700') threats.push('SQUAWK 7700: EMERGENCY');
    if(altFt!=null&&altFt<1000) threats.push('VERY LOW ALTITUDE: '+altFt+'ft');
    if(f.velocity!=null&&f.velocity>600) threats.push('HIGH SPEED: '+f.velocity+'kt');
    if(f.vrate!=null&&Math.abs(f.vrate)>3000) threats.push('RAPID '+(f.vrate>0?'CLIMB':'DESCENT')+': '+Math.abs(f.vrate)+'fpm');
    if(gov) threats.push('GOVERNMENT/MILITARY CALLSIGN');
    const cs=f.callsign.toUpperCase();
    let route='UNKNOWN ROUTE';
    if(cs.match(/^[A-Z]{3}\d+/)){
      const airline=cs.substring(0,3);
      const knownAirlines={EIN:'Aer Lingus',RYR:'Ryanair',BAW:'British Airways',DLH:'Lufthansa',AFR:'Air France',UAE:'Emirates',AAL:'American Airlines',UAL:'United Airlines',DAL:'Delta',SWA:'Southwest',ACA:'Air Canada',QFA:'Qantas',SIA:'Singapore Airlines',KLM:'KLM',IBE:'Iberia'};
      if(knownAirlines[airline]) route='OPERATOR: '+knownAirlines[airline];
    }
    const dirLabel=f.heading!=null?['N','NE','E','SE','S','SW','W','NW'][Math.round(f.heading/45)%8]:'?';
    setAnalysis({ callsign:f.callsign, icao:f.icao, type:f.type, gov, threats, route, altFt, speed:f.velocity, heading:f.heading, dirLabel, vrate:f.vrate, squawk:f.squawk, predLat:predLat.toFixed(3), predLon:predLon.toFixed(3) });
    setAnalysing(false);
  };

  React.useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const FADE_RATE=0.005;
    const animate=()=>{
      sweepRef.current=(sweepRef.current+0.5)%360;
      const range=BASE_RANGE/zoomRef.current;
      const clat=latRef.current, clon=lonRef.current;
      const ctx=canvas.getContext('2d');
      const W=canvas.width,H=canvas.height,cx=W/2,cy=H/2,R=W/2-8;
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle='#000a00'; ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.fill();
      if(modeRef.current==='sector'){
        const cRad=(compassRef.current-90)*Math.PI/180,halfSec=(sectorRef.current/2)*Math.PI/180;
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,R,cRad-halfSec,cRad+halfSec); ctx.closePath(); ctx.fillStyle='rgba(0,255,70,0.04)'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(cRad-halfSec)*R,cy+Math.sin(cRad-halfSec)*R); ctx.strokeStyle='rgba(0,255,70,0.3)'; ctx.lineWidth=1; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(cRad+halfSec)*R,cy+Math.sin(cRad+halfSec)*R); ctx.stroke();
      }
      [0.25,0.5,0.75,1].forEach(r=>{ ctx.beginPath(); ctx.arc(cx,cy,R*r,0,Math.PI*2); ctx.strokeStyle='rgba(0,255,70,0.12)'; ctx.lineWidth=1; ctx.stroke(); });
      ctx.strokeStyle='rgba(0,255,70,0.12)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(cx,cy-R); ctx.lineTo(cx,cy+R); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx-R,cy); ctx.lineTo(cx+R,cy); ctx.stroke();
      ctx.fillStyle='rgba(0,255,70,0.4)'; ctx.font='bold 9px monospace';
      ctx.textAlign='center'; ctx.fillText('N',cx,cy-R+13); ctx.fillText('S',cx,cy+R-3);
      ctx.textAlign='left'; ctx.fillText('E',cx+R-13,cy+4); ctx.textAlign='right'; ctx.fillText('W',cx-R+13,cy+4);
      if(modeRef.current==='sweep'){
        const sweepRad=(sweepRef.current-90)*Math.PI/180;
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(sweepRad);
        const sg=ctx.createLinearGradient(0,0,R,0);
        sg.addColorStop(0,'rgba(0,255,70,0.0)'); sg.addColorStop(0.6,'rgba(0,255,70,0.0)'); sg.addColorStop(1,'rgba(0,255,70,0.3)');
        ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,R,-Math.PI/5,0); ctx.closePath(); ctx.fillStyle=sg; ctx.fill();
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(R,0); ctx.strokeStyle='rgba(0,255,70,0.95)'; ctx.lineWidth=1.5; ctx.stroke();
        ctx.restore();
      } else {
        const cRad=(compassRef.current-90)*Math.PI/180;
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(cRad);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(R,0); ctx.strokeStyle='rgba(0,255,70,0.9)'; ctx.lineWidth=2; ctx.stroke();
        ctx.restore();
      }
      flightsRef.current.forEach(f=>{
        const dx=(f.lon-clon)/range,dy=(f.lat-clat)/range;
        if(Math.sqrt(dx*dx+dy*dy)>1) return;
        const px=cx+dx*R,py=cy-dy*R;
        const fAngle=(Math.atan2(dx,-dy)*180/Math.PI+360)%360;
        const gov=isGovAircraft(f),isSel=selected&&selected.icao===f.icao;
        const baseColor=gov?'255,200,0':'0,255,70';
        let alpha=1;
        if(modeRef.current==='sweep'){
          const angleDiff=(sweepRef.current-fAngle+360)%360;
          if(angleDiff<1.5){ blipAlphaRef.current[f.icao]=1.0; }
          if(fadeRef.current){
            alpha=blipAlphaRef.current[f.icao]||0;
            alpha=Math.max(0,alpha-FADE_RATE);
            blipAlphaRef.current[f.icao]=alpha;
            if(alpha<0.02) return;
          } else {
            if(!blipAlphaRef.current[f.icao]) return;
          }
        } else {
          const halfSec=sectorRef.current/2;
          let diff=(fAngle-compassRef.current+360)%360; if(diff>180) diff-=360;
          if(Math.abs(diff)>halfSec) return;
        }
        if(f.heading!=null){ const rad=(f.heading-90)*Math.PI/180; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+Math.cos(rad)*10,py+Math.sin(rad)*10); ctx.strokeStyle='rgba('+baseColor+','+(alpha*0.5)+')'; ctx.lineWidth=1; ctx.stroke(); }
        ctx.beginPath(); ctx.arc(px,py,isSel?5:3,0,Math.PI*2); ctx.fillStyle='rgba('+baseColor+','+alpha+')'; ctx.fill();
        if(isSel){ ctx.beginPath(); ctx.arc(px,py,9,0,Math.PI*2); ctx.strokeStyle='rgba('+baseColor+','+(alpha*0.6)+')'; ctx.lineWidth=1; ctx.stroke(); }
        if(alpha>0.25||!fadeRef.current){ ctx.fillStyle='rgba('+baseColor+','+(alpha*0.85)+')'; ctx.font=isSel?'bold 9px monospace':'8px monospace'; ctx.textAlign='left'; ctx.fillText(f.callsign,px+7,py-4); }
      });
      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.strokeStyle='rgba(0,255,70,0.4)'; ctx.lineWidth=2; ctx.stroke();
      const kmLabel=Math.round((BASE_RANGE/zoomRef.current)*111)+'km';
      ctx.fillStyle='rgba(0,255,70,0.25)'; ctx.font='8px monospace'; ctx.textAlign='right';
      ctx.fillText('r='+kmLabel,cx+R-4,cy+R-6);
      animRef.current=requestAnimationFrame(animate);
    };
    animRef.current=requestAnimationFrame(animate);
    return ()=>cancelAnimationFrame(animRef.current);
  },[selected]);

  const handleCanvasTap=(e)=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const rect=canvas.getBoundingClientRect();
    const tapX=(e.clientX-rect.left)*(canvas.width/rect.width),tapY=(e.clientY-rect.top)*(canvas.height/rect.height);
    const cx=canvas.width/2,cy=canvas.height/2,R=canvas.width/2-8;
    const range=BASE_RANGE/zoomRef.current;
    let closest=null,closestDist=24;
    flightsRef.current.forEach(f=>{
      const dx=(f.lon-lonRef.current)/range,dy=(f.lat-latRef.current)/range;
      if(Math.sqrt(dx*dx+dy*dy)>1) return;
      const px=cx+dx*R,py=cy-dy*R,dist=Math.sqrt((tapX-px)**2+(tapY-py)**2);
      if(dist<closestDist){closestDist=dist;closest=f;}
    });
    setSelected(closest); setAnalysis(null);
  };

  const handleTouchStart=(e)=>{ if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;pinchRef.current=Math.sqrt(dx*dx+dy*dy);} };
  const handleTouchMove=(e)=>{ if(e.touches.length===2&&pinchRef.current){e.preventDefault();const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY,newDist=Math.sqrt(dx*dx+dy*dy),scale=newDist/pinchRef.current;zoomRef.current=Math.min(8,Math.max(0.5,zoomRef.current*scale));setZoom(zoomRef.current);pinchRef.current=newDist;} };
  const handleTouchEnd=()=>{pinchRef.current=null;};
  const switchMode=(m)=>{modeRef.current=m;blipAlphaRef.current={};setMode(m);};
  const toggleFade=()=>{ const nf=!fadeRef.current; fadeRef.current=nf; blipAlphaRef.current={}; if(!nf){ flightsRef.current.forEach(f=>{ blipAlphaRef.current[f.icao]=1; }); } setFadeEnabled(nf); };
  const dir=(h)=>h==null?'?':['N','NE','E','SE','S','SW','W','NW'][Math.round(h/45)%8];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'10px',flex:1}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <p style={{fontSize:'10px',fontFamily:'monospace',color:'rgba(0,255,70,0.6)',textTransform:'uppercase',letterSpacing:'0.1em'}}>ATC � {locLabel}</p>
          {lastUpdated && <p style={{fontSize:'9px',fontFamily:'monospace',color:'rgba(0,255,70,0.3)'}}>{lastUpdated}</p>}
        </div>
        <div style={{display:'flex',gap:'5px',alignItems:'center'}}>
          <span style={{fontSize:'9px',fontFamily:'monospace',color:'rgba(0,255,70,0.4)'}}>x{zoom.toFixed(1)}</span>
          <button onClick={getLocation} style={{padding:'4px 7px',background:'rgba(0,255,70,0.1)',border:'1px solid rgba(0,255,70,0.3)',borderRadius:'6px',color:'rgba(0,255,70,0.8)',fontSize:'10px',fontFamily:'monospace',fontWeight:'bold'}}>GPS</button>
          <button onClick={()=>fetchFlights()} disabled={loading} style={{padding:'4px 7px',background:'rgba(0,255,70,0.1)',border:'1px solid rgba(0,255,70,0.3)',borderRadius:'6px',color:'rgba(0,255,70,0.8)',fontSize:'10px',fontFamily:'monospace',fontWeight:'bold'}}>{loading?'...':'SCAN'}</button>
        </div>
      </div>
      <div style={{display:'flex',gap:'5px'}}>
        {['sweep','sector'].map(m=>(
          <button key={m} onClick={()=>switchMode(m)} style={{flex:1,padding:'5px',background:mode===m?'rgba(0,255,70,0.2)':'rgba(0,255,70,0.05)',border:'1px solid '+(mode===m?'rgba(0,255,70,0.5)':'rgba(0,255,70,0.15)'),borderRadius:'6px',color:mode===m?'rgba(0,255,70,0.9)':'rgba(0,255,70,0.3)',fontSize:'9px',fontFamily:'monospace',fontWeight:'bold',textTransform:'uppercase'}}>
            {m==='sweep'?'OMNI':'SECTOR'}
          </button>
        ))}
        <button onClick={toggleFade} style={{flex:1,padding:'5px',background:fadeEnabled?'rgba(0,255,70,0.2)':'rgba(0,255,70,0.05)',border:'1px solid '+(fadeEnabled?'rgba(0,255,70,0.5)':'rgba(0,255,70,0.15)'),borderRadius:'6px',color:fadeEnabled?'rgba(0,255,70,0.9)':'rgba(0,255,70,0.3)',fontSize:'9px',fontFamily:'monospace',fontWeight:'bold'}}>FADE {fadeEnabled?'ON':'OFF'}</button>
      </div>
      {mode==='sector' && (
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <p style={{fontSize:'9px',fontFamily:'monospace',color:'rgba(0,255,70,0.4)',whiteSpace:'nowrap'}}>WIDTH {sectorWidth}deg</p>
          <input type="range" min="20" max="180" value={sectorWidth} onChange={e=>{const v=+e.target.value;setSectorWidth(v);sectorRef.current=v;}} style={{flex:1,accentColor:'#00ff46'}} />
          <p style={{fontSize:'9px',fontFamily:'monospace',color:'rgba(0,255,70,0.6)',whiteSpace:'nowrap'}}>HDG {Math.round(compass)}deg</p>
        </div>
      )}
      {error && <p style={{color:'#ff4444',fontSize:'10px',fontFamily:'monospace'}}>{error}</p>}
      <div style={{position:'relative',width:'100%',aspectRatio:'1',background:'#000a00',borderRadius:'50%',border:'2px solid rgba(0,255,70,0.3)',boxShadow:'0 0 30px rgba(0,255,70,0.08)'}}>
        <canvas ref={canvasRef} width={320} height={320} style={{width:'100%',height:'100%',borderRadius:'50%',cursor:'crosshair',touchAction:'none'}} onClick={handleCanvasTap} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} />
        {loading && <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%',background:'rgba(0,10,0,0.7)'}}><p style={{color:'rgba(0,255,70,0.7)',fontFamily:'monospace',fontSize:'12px',letterSpacing:'0.2em'}}>SCANNING...</p></div>}
      </div>
      <div style={{display:'flex',gap:'8px',fontSize:'9px',fontFamily:'monospace'}}>
        <span style={{color:'rgba(0,255,70,0.5)'}}>? CIVIL</span>
        <span style={{color:'rgba(255,200,0,0.7)'}}>? GOV/MIL</span>
        {myLat && <span style={{color:'rgba(0,255,70,0.3)',marginLeft:'auto'}}>{myLat.toFixed(3)},{myLon.toFixed(3)}</span>}
      </div>
      {selected && !analysis && (
        <div style={{background:'rgba(0,20,0,0.9)',border:'1px solid rgba(0,255,70,0.4)',borderRadius:'12px',padding:'12px',fontFamily:'monospace'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
            <p style={{color:isGovAircraft(selected)?'#ffc800':'#00ff46',fontWeight:'bold',fontSize:'14px',letterSpacing:'0.2em'}}>{selected.callsign}{isGovAircraft(selected)?' [GOV]':''}</p>
            <button onClick={()=>setSelected(null)} style={{color:'rgba(0,255,70,0.4)',background:'none',border:'none',fontSize:'18px',cursor:'pointer',lineHeight:1}}>x</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'10px'}}>
            {[['ICAO',selected.icao.toUpperCase()],['TYPE',selected.type||'???'],['ALT',selected.altitude!=null?selected.altitude+' m':'---'],['SPEED',selected.velocity!=null?selected.velocity+' kt':'---'],['HDG',selected.heading!=null?selected.heading+'deg '+dir(selected.heading):'---'],['SQUAWK',selected.squawk||'----']].map(([k,v])=>(
              <div key={k} style={{background:'rgba(0,255,70,0.05)',borderRadius:'6px',padding:'6px'}}>
                <p style={{color:'rgba(0,255,70,0.4)',fontSize:'8px',letterSpacing:'0.15em',marginBottom:'2px'}}>{k}</p>
                <p style={{color:'rgba(0,255,70,0.9)',fontSize:'11px',fontWeight:'bold'}}>{v}</p>
              </div>
            ))}
          </div>
          <button onClick={()=>analyseAircraft(selected)} disabled={analysing} style={{width:'100%',padding:'8px',background:'rgba(0,255,70,0.15)',border:'1px solid rgba(0,255,70,0.5)',borderRadius:'8px',color:'rgba(0,255,70,0.9)',fontSize:'11px',fontFamily:'monospace',fontWeight:'bold',letterSpacing:'0.15em'}}>
            {analysing?'ANALYSING...':'ANALYSE AIRCRAFT'}
          </button>
        </div>
      )}
      {analysis && (
        <div style={{background:'rgba(0,20,0,0.95)',border:'1px solid '+(analysis.threats.length>0?'rgba(255,100,0,0.6)':'rgba(0,255,70,0.4)'),borderRadius:'12px',padding:'12px',fontFamily:'monospace'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
            <p style={{color:analysis.gov?'#ffc800':'#00ff46',fontWeight:'bold',fontSize:'13px',letterSpacing:'0.2em'}}>{analysis.callsign} ANALYSIS</p>
            <button onClick={()=>setAnalysis(null)} style={{color:'rgba(0,255,70,0.4)',background:'none',border:'none',fontSize:'18px',cursor:'pointer',lineHeight:1}}>x</button>
          </div>
          {analysis.threats.length>0 && (
            <div style={{background:'rgba(255,80,0,0.1)',border:'1px solid rgba(255,80,0,0.4)',borderRadius:'8px',padding:'8px',marginBottom:'8px'}}>
              <p style={{color:'rgba(255,120,0,0.9)',fontSize:'9px',letterSpacing:'0.15em',marginBottom:'4px'}}>ALERTS</p>
              {analysis.threats.map((t,i)=><p key={i} style={{color:'#ff6030',fontSize:'10px',fontWeight:'bold'}}>? {t}</p>)}
            </div>
          )}
          {analysis.threats.length===0 && <p style={{color:'rgba(0,255,70,0.6)',fontSize:'10px',marginBottom:'8px'}}>? NO ANOMALIES DETECTED</p>}
          <div style={{background:'rgba(0,255,70,0.05)',borderRadius:'8px',padding:'8px',marginBottom:'8px'}}>
            <p style={{color:'rgba(0,255,70,0.4)',fontSize:'9px',letterSpacing:'0.15em',marginBottom:'4px'}}>ROUTE INTEL</p>
            <p style={{color:'rgba(0,255,70,0.85)',fontSize:'10px'}}>{analysis.route}</p>
            <p style={{color:'rgba(0,255,70,0.5)',fontSize:'9px',marginTop:'2px'}}>HDG {analysis.heading}deg {analysis.dirLabel} � {analysis.speed}kt � {analysis.altFt}ft</p>
            {analysis.vrate!=null && <p style={{color:'rgba(0,255,70,0.5)',fontSize:'9px'}}>{analysis.vrate>0?'CLIMBING':'DESCENDING'} {Math.abs(analysis.vrate)}fpm</p>}
          </div>
          <div style={{background:'rgba(0,255,70,0.05)',borderRadius:'8px',padding:'8px'}}>
            <p style={{color:'rgba(0,255,70,0.4)',fontSize:'9px',letterSpacing:'0.15em',marginBottom:'4px'}}>PREDICTED POSITION (30min)</p>
            <p style={{color:'rgba(0,255,70,0.85)',fontSize:'10px'}}>{analysis.predLat}N {analysis.predLon}</p>
          </div>
        </div>
      )}
      {!selected && !analysis && (
        <p style={{color:'rgba(0,255,70,0.3)',fontSize:'10px',fontFamily:'monospace',textAlign:'center'}}>{flights.length>0?flights.length+' CONTACTS � TAP BLIP FOR DETAILS':'NO CONTACTS'}</p>
      )}
    </div>
  );
}

export default function App() {
  const [text, setText] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [currentMorse, setCurrentMorse] = useState('');
  const [history, setHistory] = useState(() => { const saved = localStorage.getItem('vibe_history'); return saved ? JSON.parse(saved) : []; });
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(() => { const saved = localStorage.getItem('vibe_settings'); if (saved) { const parsed = JSON.parse(saved); return { ...DEFAULT_SETTINGS, ...parsed, customPatterns: parsed.customPatterns || DEFAULT_SETTINGS.customPatterns }; } return DEFAULT_SETTINGS; });
  const [vibrationSupported, setVibrationSupported] = useState(true);
  const [inputMode, setInputMode] = useState('type');
  const [tapSequence, setTapSequence] = useState('');
  const [isVisualActive, setIsVisualActive] = useState(false);
  const [roomId, setRoomId] = useState(() => { const saved = localStorage.getItem('vibe_room_id'); if (saved) return saved; const newId = Math.random().toString(36).substring(2, 8).toUpperCase(); localStorage.setItem('vibe_room_id', newId); return newId; });
  const [wsConnected, setWsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastReceivedText, setLastReceivedText] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(() => localStorage.getItem('vibe_enc_key') || '');
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const wsRef = useRef(null);
  const transmissionRef = useRef(null);
  const isTapping = useRef(false);
  const tapDownTime = useRef(0);
  const letterTimeout = useRef(null);
  const wordTimeout = useRef(null);
  const visualIntervals = useRef([]);
  useEffect(() => { localStorage.setItem('vibe_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('vibe_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'; const socket = new WebSocket(protocol + '//' + window.location.host); socket.onopen = () => { setWsConnected(true); socket.send(JSON.stringify({ type: 'join', roomId })); }; socket.onmessage = (event) => { const data = JSON.parse(event.data); if (data.type === 'remote_vibe') { const decrypted = encryptionEnabled ? decrypt(data.text, encryptionKey) : data.text; setLastReceivedText(decrypted); handleRemoteVibe(decrypted); } }; socket.onclose = () => setWsConnected(false); wsRef.current = socket; return () => socket.close(); }, [roomId]);
  useEffect(() => { const fn = () => { if (document.visibilityState === 'hidden') clearInput(); }; document.addEventListener('visibilitychange', fn); if (typeof navigator !== 'undefined' && typeof navigator.vibrate !== 'function') setVibrationSupported(false); return () => { document.removeEventListener('visibilitychange', fn); if (letterTimeout.current) clearTimeout(letterTimeout.current); if (wordTimeout.current) clearTimeout(wordTimeout.current); if (transmissionRef.current) clearTimeout(transmissionRef.current); visualIntervals.current.forEach(id => clearTimeout(id)); vibrateSafe(0); }; }, []);
  const vibrateSafe = (pattern) => { if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') { try { if (pattern === 0) { navigator.vibrate(0); } else { navigator.vibrate(Array.isArray(pattern) ? pattern.slice(0, 99) : pattern); } } catch (e) { console.warn('Vibration error:', e); } } };
  const stopTransmission = () => { vibrateSafe(0); if (transmissionRef.current) clearTimeout(transmissionRef.current); visualIntervals.current.forEach(id => clearTimeout(id)); visualIntervals.current = []; setIsVisualActive(false); setIsTransmitting(false); };
  const clearInput = () => { setText(''); setTapSequence(''); if (letterTimeout.current) clearTimeout(letterTimeout.current); if (wordTimeout.current) clearTimeout(wordTimeout.current); if (isTapping.current) { isTapping.current = false; vibrateSafe(0); } stopTransmission(); };
  const switchMode = (mode: any) => { setInputMode(mode); setTapSequence(''); if (letterTimeout.current) clearTimeout(letterTimeout.current); if (wordTimeout.current) clearTimeout(wordTimeout.current); if (isTapping.current) { isTapping.current = false; vibrateSafe(0); } stopTransmission(); };
  const handleTransmit = () => { if (!text.trim()) return; const morse = textToMorse(text); if (!morse) return; const transmitText = encryptionEnabled ? encrypt(text, encryptionKey) : text; if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'vibe', text: transmitText })); setCurrentMorse(morse); setIsTransmitting(true); if (!history.includes(text)) setHistory(prev => [text, ...prev].slice(0, 10)); const pattern = textToVibrationPattern(text, settings); vibrateSafe(pattern); if (settings.visualFlash) { let elapsed = 0; pattern.forEach((duration, index) => { if (index % 2 === 0) { const startId = window.setTimeout(() => setIsVisualActive(true), elapsed); const endId = window.setTimeout(() => setIsVisualActive(false), elapsed + duration); visualIntervals.current.push(startId, endId); } elapsed += duration; }); } const totalDuration = pattern.reduce((a, b) => a + b, 0); transmissionRef.current = window.setTimeout(() => { setIsTransmitting(false); setIsVisualActive(false); }, totalDuration); };
  const handleRemoteVibe = (remoteText) => { if (isTransmitting) return; setIsTransmitting(true); const pattern = textToVibrationPattern(remoteText, settings); vibrateSafe(pattern); if (settings.visualFlash) { let elapsed = 0; pattern.forEach((duration, index) => { if (index % 2 === 0) { const startId = window.setTimeout(() => setIsVisualActive(true), elapsed); const endId = window.setTimeout(() => setIsVisualActive(false), elapsed + duration); visualIntervals.current.push(startId, endId); } elapsed += duration; }); } const totalDuration = pattern.reduce((a, b) => a + b, 0); transmissionRef.current = window.setTimeout(() => { setIsTransmitting(false); setIsVisualActive(false); }, totalDuration); };
  const copyWebhook = () => { navigator.clipboard.writeText(window.location.origin + '/api/webhook/' + roomId); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handlePointerDown = (e) => { if (!e.isPrimary) return; e.preventDefault(); if (isTapping.current) return; isTapping.current = true; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {} vibrateSafe(50); setIsVisualActive(true); tapDownTime.current = Date.now(); if (letterTimeout.current) clearTimeout(letterTimeout.current); if (wordTimeout.current) clearTimeout(wordTimeout.current); };
  const handlePointerUp = (e) => { if (!e.isPrimary) return; e.preventDefault(); if (!isTapping.current) return; isTapping.current = false; try { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {} setIsVisualActive(false); const duration = Date.now() - tapDownTime.current; const symbol = duration < (settings.dotDuration + settings.dashDuration) / 2 ? '.' : '-'; setTapSequence(prev => prev + symbol); if (letterTimeout.current) clearTimeout(letterTimeout.current); if (wordTimeout.current) clearTimeout(wordTimeout.current); letterTimeout.current = window.setTimeout(() => { setTapSequence(currentSeq => { if (currentSeq) { const char = MORSE_TO_CHAR[currentSeq]; if (char) setText(prevText => prevText + char); } return ''; }); wordTimeout.current = window.setTimeout(() => { setText(prevText => (!prevText.endsWith(' ') && prevText.length > 0) ? prevText + ' ' : prevText); }, settings.wordSpace - settings.letterSpace); }, settings.letterSpace); };
  const modes = ['type', 'tap', 'img', 'qr', 'sound', 'flash', 'remote', 'atc'];
  const modeLabels = { type: 'Keys', tap: 'Tap', img: 'Img', qr: 'QR', sound: 'Sound', flash: 'Flash', remote: 'Remote', atc: 'Air' };
  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto p-6 relative transition-colors duration-75 ${isVisualActive ? 'bg-vibe-primary/20' : 'bg-vibe-bg'}`}>
      <header className='flex justify-between items-center mb-8'>
        <div className='flex items-center gap-2'>
          <div className='w-10 h-10 bg-vibe-primary rounded-lg flex items-center justify-center shadow-lg shadow-vibe-primary/20'><Zap className='text-white w-6 h-6' fill='currentColor' /></div>
          <div><h1 className='font-bold text-xl tracking-tight leading-none'>MORSE VIBE</h1><p className='text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1'>Tactile Transmitter</p></div>
        </div>
        <div className='flex gap-2'>
          <button onClick={() => setShowSettings(true)} className='p-2 rounded-full hover:bg-white/5 transition-colors'><Settings className='w-5 h-5 text-white/60' /></button>
          <button onClick={() => setShowHistory(true)} className='p-2 rounded-full hover:bg-white/5 transition-colors'><History className='w-5 h-5 text-white/60' /></button>
        </div>
      </header>
      <main className='flex-1 flex flex-col gap-4'>
        <div className='flex bg-vibe-surface/50 p-1 rounded-xl border border-white/5 overflow-x-auto gap-1'>
          {modes.map(mode => (<button key={mode} onClick={() => switchMode(mode)} className={`py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap flex-shrink-0 ${inputMode === mode ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>{modeLabels[mode]}</button>))}
        </div>
        {inputMode === 'type' ? (<KeyboardMode text={text} setText={setText} isTransmitting={isTransmitting} clearInput={clearInput} />) : inputMode === 'tap' ? (<TelegraphMode text={text} tapSequence={tapSequence} isTransmitting={isTransmitting} handlePointerDown={handlePointerDown} handlePointerUp={handlePointerUp} clearInput={clearInput} />) : inputMode === 'img' ? (<ImageMode setText={setText} isTransmitting={isTransmitting} />) : inputMode === 'qr' ? (<QRMode setText={setText} isTransmitting={isTransmitting} />) : inputMode === 'sound' ? (<SoundMode text={text} isTransmitting={isTransmitting} />) : inputMode === 'flash' ? (<FlashMode text={text} isTransmitting={isTransmitting} />) : inputMode === 'atc' ? (<ATCMode />) : (
          <div className='flex flex-col gap-4 flex-1'>
            <div className='bg-vibe-surface border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center gap-4'>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${wsConnected ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}><Globe className='w-8 h-8' /></div>
              <div><h3 className='font-bold text-lg'>Remote Control</h3><p className='text-xs text-white/40 mt-1'>Connect multiple devices</p></div>
              <div className='w-full bg-black/20 rounded-xl p-4 border border-white/5'><p className='text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1'>Room ID</p><p className='text-3xl font-bold tracking-[0.2em] text-vibe-primary'>{roomId}</p></div>
              <div className='w-full text-left'><p className='text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2'>Webhook URL</p><div className='flex gap-2'><div className='flex-1 bg-black/20 rounded-lg p-2 text-[10px] font-mono text-white/60 truncate border border-white/5'>{window.location.origin}/api/webhook/{roomId}</div><button onClick={copyWebhook} className='p-2 bg-vibe-primary rounded-lg'>{copied ? <Check className='w-4 h-4' /> : <Copy className='w-4 h-4' />}</button></div></div>
            </div>
            <ImageDecoder receivedText={lastReceivedText} />
            <QRDecoder receivedText={lastReceivedText} />
            <MorseDecoder receivedText={lastReceivedText} />
          </div>
        )}
        <AnimatePresence>{text && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className='bg-vibe-surface/50 border border-white/5 rounded-xl p-4'><span className='text-[10px] font-mono uppercase tracking-wider text-white/40'>Morse Translation</span><div className='font-mono text-lg break-all tracking-widest text-vibe-primary/80'>{textToMorse(text)}</div><MorseDecoder receivedText={textToMorse(text)} /></motion.div>)}</AnimatePresence>
      </main>
      <div className='mt-8 mb-4'><button onClick={isTransmitting ? stopTransmission : handleTransmit} disabled={!text.trim() && !isTransmitting} className={`w-full py-6 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${isTransmitting ? 'bg-white text-vibe-bg' : 'bg-vibe-primary text-white disabled:opacity-30 disabled:grayscale'}`}>{isTransmitting ? (<><Square className='w-6 h-6' fill='currentColor' /><span className='font-bold text-lg uppercase tracking-widest'>Stop Transmission</span></>) : (<><Play className='w-6 h-6' fill='currentColor' /><span className='font-bold text-lg uppercase tracking-widest'>Start Vibe</span></>)}</button></div>
      <footer className='mt-auto pt-8 text-center'><p className='text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]'>Optimised for Wearable Browsers</p></footer>
      <AnimatePresence>
        {showSettings && (<><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" /><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-vibe-surface border-t border-white/10 rounded-t-3xl p-6 z-50 max-h-[85vh] overflow-y-auto"><div className="flex justify-between items-center mb-6"><h2 className="font-bold text-lg uppercase tracking-widest">Signal Settings</h2><button onClick={() => setSettings(DEFAULT_SETTINGS)} className="text-[10px] font-mono text-white/40 px-3 py-1.5 rounded-full border border-white/10">Reset</button></div><div className="flex flex-col gap-6"><div className="flex items-center justify-between p-4 bg-white/5 rounded-xl"><div><p className="text-sm font-bold">Visual Flash</p></div><button onClick={() => setSettings({...settings, visualFlash: !settings.visualFlash})} className={settings.visualFlash ? "w-12 h-6 rounded-full bg-vibe-primary relative" : "w-12 h-6 rounded-full bg-white/10 relative"}><motion.div animate={{ x: settings.visualFlash ? 24 : 4 }} className="w-4 h-4 bg-white rounded-full absolute top-1" /></button></div><div className="flex flex-col gap-4"><h3 className="text-xs font-mono uppercase tracking-wider text-white/60">Encryption</h3><div className="flex items-center justify-between p-4 bg-white/5 rounded-xl"><div><p className="text-sm font-bold">AES-256 Encryption</p></div><button onClick={() => setEncryptionEnabled(!encryptionEnabled)} className={encryptionEnabled ? "w-12 h-6 rounded-full bg-vibe-primary relative" : "w-12 h-6 rounded-full bg-white/10 relative"}><motion.div animate={{ x: encryptionEnabled ? 24 : 4 }} className="w-4 h-4 bg-white rounded-full absolute top-1" /></button></div>{encryptionEnabled && (<div className="flex flex-col gap-2"><input type="text" value={encryptionKey} onChange={e => { setEncryptionKey(e.target.value); localStorage.setItem("vibe_enc_key", e.target.value); }} placeholder="Enter secret key..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none" /><button onClick={() => { const k = generateKey(); setEncryptionKey(k); localStorage.setItem("vibe_enc_key", k); }} className="w-full py-2 border border-dashed border-white/10 rounded-lg text-xs text-white/40">Generate Random Key</button></div>)}</div></div><button onClick={() => setShowSettings(false)} className="w-full mt-8 py-4 rounded-xl bg-white/10 text-white font-bold uppercase tracking-widest">Done</button></motion.div></>)}
      </AnimatePresence>
      <AnimatePresence>
        {showHistory && (<><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistory(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" /><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-vibe-surface border-t border-white/10 rounded-t-3xl p-6 z-50 max-h-[70vh] overflow-y-auto"><div className="flex justify-between items-center mb-6"><h2 className="font-bold text-lg uppercase tracking-widest">Recent</h2><button onClick={() => setHistory([])} className="p-2 text-white/40 hover:text-vibe-primary"><Trash2 className="w-5 h-5" /></button></div>{history.length === 0 ? (<div className="py-12 text-center text-white/20 font-mono text-sm">No history</div>) : (<div className="flex flex-col gap-3">{history.map((item, idx) => (<button key={idx} onClick={() => { setText(item); setShowHistory(false); }} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 text-left"><span className="font-medium truncate mr-4">{item}</span><ChevronRight className="w-4 h-4 text-white/20" /></button>))}</div>)}</motion.div></>)}
      </AnimatePresence>
    </div>
  );
}
