const fs = require('fs');
let c = fs.readFileSync('src/components/RemoteTab.tsx', 'utf8');

const oldList = `                {foundDevices.map(d=>(
                  <button key={d.deviceId} onClick={()=>connectToDevice(d)} disabled={btConnecting} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-50">
                    <div className="flex items-center gap-2">
                      <Bluetooth className="w-4 h-4 text-blue-400"/>
                      <div className="text-left">
                        <p className="text-xs font-bold">{d.name}</p>
                        <p className="text-[9px] font-mono text-white/30">{d.deviceId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.rssi && <span className="text-[9px] font-mono text-white/30">{d.rssi}dBm</span>}
                      <span className="text-[9px] font-mono text-blue-400">{btConnecting?'Connecting...':'Connect'}</span>
                    </div>
                  </button>
                ))}`;

const newList = `                {[...foundDevices].sort((a,b)=>(b.rssi||-100)-(a.rssi||-100)).map(d=>{
                  const isPhone = d.name !== 'Unknown Device';
                  const sig = d.rssi||-100;
                  const bars = sig>-60?4:sig>-70?3:sig>-80?2:1;
                  return (
                  <button key={d.deviceId} onClick={()=>connectToDevice(d)} disabled={btConnecting}
                    className={"flex items-center justify-between p-3 border rounded-xl hover:bg-white/10 disabled:opacity-50 "+(isPhone?'bg-blue-500/10 border-blue-500/30':'bg-white/5 border-white/10')}>
                    <div className="flex items-center gap-2">
                      <Bluetooth className={"w-4 h-4 "+(isPhone?'text-blue-400':'text-white/30')}/>
                      <div className="text-left">
                        <p className={"text-xs font-bold "+(isPhone?'text-white':'text-white/50')}>{d.name}{isPhone?' 📱':''}</p>
                        <p className="text-[9px] font-mono text-white/20">{d.deviceId.slice(0,12)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5 items-end">
                        {[1,2,3,4].map(b=><div key={b} className={"w-1 rounded-sm "+(b<=bars?'bg-blue-400':'bg-white/10')} style={{height:(b*3+4)+'px'}}/>)}
                      </div>
                      <span className="text-[9px] font-mono text-blue-400">{btConnecting?'...':'Connect'}</span>
                    </div>
                  </button>
                  );
                })}`;

if(c.includes(oldList)) {
  c = c.replace(oldList, newList);
  fs.writeFileSync('src/components/RemoteTab.tsx', c);
  console.log('Patch applied successfully');
} else {
  console.log('OLD TEXT NOT FOUND - no change made');
}
