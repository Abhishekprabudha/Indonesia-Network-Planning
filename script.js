<!-- script.js -->
/* =========================================================================
   Agentic Twin — Java Edition (v7.0)
   Disrupt → Correct → Normal + Hub Addition (Yogyakarta) + City Addition (Malang)
   ======================================================================= */

/* -------------------- tiny debug pill -------------------- */
let __DBG=null;
function debug(msg){
  if(!__DBG){
    __DBG=document.createElement("div");
    __DBG.style.cssText="position:fixed;left:8px;bottom:8px;z-index:9999;background:rgba(0,0,0,.55);color:#eaf1f7;font:12px system-ui;padding:6px 8px;border-radius:6px;pointer-events:none";
    document.body.appendChild(__DBG);
  }
  __DBG.textContent=msg||"";
}
window.addEventListener("error",(e)=>debug(`Error: ${e.message||e}`));

/* -------------------- config (INDONESIA / JAVA) -------------------- */
const STYLE_URL = "style.json";
const MAP_INIT = { center: [110.0, -7.2], zoom: 6.6, minZoom: 3, maxZoom: 12 }; // Java focus
const WAREHOUSE_ICON_SRC = "warehouse_iso.png";
const AUTO_FIT = false;
const HUB_ID = "H_JOG";                   // Yogyakarta hub
const DEFAULT_CAPACITY_UNITS = 10;
const DEFAULT_SPEED_KMPH = 55;

/* -------------------- anchors (Java island) -------------------- */
const CITY = {
  WH1: { name: "WH1 — Jakarta",  lat: -6.2088, lon: 106.8456 },
  WH2: { name: "WH2 — Surabaya", lat: -7.2575, lon: 112.7521 },
  WH3: { name: "WH3 — Bandung",  lat: -6.9175, lon: 107.6191 },
  WH4: { name: "WH4 — Semarang", lat: -6.9667, lon: 110.4167 }
};
const HUB = { H_JOG: { name: "Hub — Yogyakarta", lat: -7.7956, lon: 110.3695 } };

// New market (City Addition)
const NEW_CITY = { id: "C_MLG", name: "C_MLG — Malang", lat: -7.9819, lon: 112.6265 };

/* -------------------- helpers (DECLARED BEFORE USE) -------------------- */
function keyFor(a,b){ return `${a}-${b}`; }
function toLonLat(ll){ return ll.map(p=>[p[1],p[0]]); }
function getAnchor(id){
  return CITY[id] || HUB[id] || (id==="C_MLG" ? {name:NEW_CITY.name,lat:NEW_CITY.lat,lon:NEW_CITY.lon} : null);
}
function getRoadLatLon(a,b){
  const k1 = keyFor(a,b), k2 = keyFor(b,a);
  if (RP[k1]) return RP[k1];
  if (RP[k2]) return [...RP[k2]].reverse();
  const ca = getAnchor(a), cb = getAnchor(b);
  if(!ca||!cb) return [[-7.2,110],[-7.2,110.5]];
  return [[ca.lat,ca.lon],[cb.lat,cb.lon]];
}
function expandIDsToLatLon(ids){
  const out=[]; for(let i=0;i<ids.length-1;i++){
    const seg=getRoadLatLon(ids[i],ids[i+1]); if(i>0) seg.shift(); out.push(...seg);
  }
  return out;
}

/* -------------------- (Java) route polylines (lat,lon) -------------------- */
const RP = {
  // Main corridors
  "WH1-WH3": [ [-6.2088,106.8456], [-6.42,107.05], [-6.65,107.35], [-6.9175,107.6191] ],                // Jakarta ↔ Bandung
  "WH3-WH4": [ [-6.9175,107.6191], [-6.94,108.7], [-6.95,109.6], [-6.9667,110.4167] ],                   // Bandung ↔ Semarang
  "WH4-WH2": [ [-6.9667,110.4167], [-7.20,111.5], [-7.25,112.2], [-7.2575,112.7521] ],                   // Semarang ↔ Surabaya
  "WH1-WH4": [ [-6.2088,106.8456], [-6.40,108.2], [-6.75,109.5], [-6.9667,110.4167] ],                   // Jakarta ↔ Semarang
  "WH1-WH2": [ [-6.2088,106.8456], [-6.60,108.8], [-6.95,110.4], [-7.10,111.6], [-7.2575,112.7521] ],    // Jakarta ↔ Surabaya
  "WH3-WH2": [ [-6.9175,107.6191], [-7.05,108.3], [-7.10,109.9], [-7.20,111.0], [-7.2575,112.7521] ],    // Bandung ↔ Surabaya

  // Hub spokes (Yogyakarta)
  "WH1-H_JOG": [ [-6.2088,106.8456], [-6.60,108.2], [-6.95,109.8], [-7.40,110.2], [-7.7956,110.3695] ],
  "WH2-H_JOG": [ [-7.2575,112.7521], [-7.25,112.2], [-7.20,111.5], [-7.40,110.9], [-7.7956,110.3695] ],
  "WH3-H_JOG": [ [-6.9175,107.6191], [-7.05,108.3], [-7.20,109.4], [-7.50,110.0], [-7.7956,110.3695] ],
  "WH4-H_JOG": [ [-6.9667,110.4167], [-7.20,110.45], [-7.50,110.40], [-7.7956,110.3695] ],

  // City Addition: Surabaya ↔ Malang (baseline)
  "WH2-C_MLG": [ [-7.2575,112.7521], [-7.65,112.70], [-7.9819,112.6265] ],
  "C_MLG-WH2": [ [-7.9819,112.6265], [-7.65,112.70], [-7.2575,112.7521] ],

  // City Addition: Hub ↔ Malang (proposal)
  "H_JOG-C_MLG": [ [-7.7956,110.3695], [-7.80,111.1], [-7.90,112.1], [-7.9819,112.6265] ],
  "C_MLG-H_JOG": [ [-7.9819,112.6265], [-7.90,112.1], [-7.80,111.1], [-7.7956,110.3695] ]
};

/* -------------------- Indonesia toggles -------------------- */
let SHOW_HUB=false;        // show Yogyakarta spokes & marker
let SHOW_CITY=false;       // show Malang flows
let CITY_PROPOSAL=false;   // baseline: Surabaya↔Malang; proposal: Hub↔Malang

/* -------------------- Disruption steps (Java) -------------------- */
const STEPS = [
  { id: "D1",
    route:   ["WH1","WH2"],                                 // Jakarta ↔ Surabaya
    reroute: [["WH1","WH4"],["WH4","WH2"]],                 // via Semarang
    cause: [
      "Disruption one.",
      "Jakarta ↔ Surabaya corridor is blocked near Pekalongan.",
      "All trucks on this corridor are safely paused.",
      "Please click the Correct button to apply the AI detour via Semarang."
    ],
    fix: [
      "AI has corrected the disruption.",
      "We’re rerouting via Jakarta → Semarang → Surabaya.",
      "Green links show the new safe detour. Flows are resuming."
    ]
  },
  { id: "D2",
    route:   ["WH3","WH4"],                                 // Bandung ↔ Semarang
    reroute: [["WH3","WH1"],["WH1","WH4"]],                 // via Jakarta
    cause: [
      "Disruption two.",
      "Bandung ↔ Semarang faces lane closures in mid-Java.",
      "Trucks are paused on this corridor.",
      "Click Correct to rebalance via Jakarta."
    ],
    fix: [
      "AI has corrected the disruption.",
      "We divert Bandung → Jakarta → Semarang.",
      "Green segments confirm the detour is active."
    ]
  },
  { id: "D3",
    route:   ["WH3","WH2"],                                 // Bandung ↔ Surabaya
    reroute: [["WH3","WH4"],["WH4","WH2"]],                 // via Semarang
    cause: [
      "Disruption three.",
      "Bandung ↔ Surabaya constrained by a long work zone.",
      "All trucks on this link are held.",
      "Click Correct to divert through Semarang."
    ],
    fix: [
      "AI has corrected the disruption.",
      "We route Bandung → Semarang → Surabaya.",
      "Green links indicate the detour now in effect."
    ]
  }
];

/* -------------------- DEFAULT_BEFORE (Java) -------------------- */
const DEFAULT_BEFORE = {
  warehouses: Object.keys(CITY).map(id => ({ id, location: CITY[id].name.split("—")[1].trim(), inventory: 500 })),
  trucks: [
    { id: "T1", origin: "WH1", destination: "WH3", status: "On-Time",  delay_hours: 0, units: 3, speed_kmph: 55, od: "WH1-WH3" }, // JKT→BDG
    { id: "T2", origin: "WH3", destination: "WH4", status: "On-Time",  delay_hours: 0, units: 3, speed_kmph: 55, od: "WH3-WH4" }, // BDG→SMG
    { id: "T3", origin: "WH4", destination: "WH2", status: "On-Time",  delay_hours: 0, units: 3, speed_kmph: 55, od: "WH4-WH2" }, // SMG→SBY
    { id: "T4", origin: "WH2", destination: "WH1", status: "Delayed",  delay_hours: 3, units: 3, speed_kmph: 55, od: "WH2-WH1" }, // SBY→JKT (D1 target)
    { id: "T5", origin: "WH1", destination: "WH2", status: "On-Time",  delay_hours: 0, units: 3, speed_kmph: 55, od: "WH1-WH2" }  // JKT→SBY (D1 target)
  ],
  policies: { capacity_units: 10, default_speed_kmph: 55, use_hub: false }
};

/* -------------------- Map setup -------------------- */
const map=new maplibregl.Map({
  container:"map", style:STYLE_URL,
  center:MAP_INIT.center, zoom:MAP_INIT.zoom,
  minZoom:MAP_INIT.minZoom, maxZoom:MAP_INIT.maxZoom,
  attributionControl:true
});
map.addControl(new maplibregl.NavigationControl({visualizePitch:false}),"top-left");

/* -------------------- overlay canvas for trucks & labels -------------------- */
let overlay=null, ctx=null;
function ensureCanvas(){
  overlay=document.getElementById("trucksCanvas");
  if(!overlay){
    overlay=document.createElement("canvas");
    overlay.id="trucksCanvas";
    overlay.style.cssText="position:absolute;inset:0;pointer-events:none;z-index:2;";
    map.getContainer().appendChild(overlay);
  }
  ctx=overlay.getContext("2d");
  resizeCanvas();
}
function resizeCanvas(){
  if(!overlay) return;
  const base=map.getCanvas(), dpr=window.devicePixelRatio||1;
  overlay.width=base.clientWidth*dpr; overlay.height=base.clientHeight*dpr;
  overlay.style.width=base.clientWidth+"px"; overlay.style.height=base.clientHeight+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener("resize",resizeCanvas);

/* -------------------- base network + highlight layers -------------------- */
function networkGeoJSON(includeHub){
  const keys = Object.keys(RP).filter(k=>{
    if(!includeHub && k.includes("H_JOG")) return false;
    if(!SHOW_CITY && k.includes("C_MLG")) return false;
    if(SHOW_CITY && !CITY_PROPOSAL && (k.includes("H_JOG-")||k.includes("-H_JOG"))) return false; // baseline city mode hides hub links
    if(SHOW_CITY && CITY_PROPOSAL && (k.includes("WH2-C_MLG")||k.includes("C_MLG-WH2"))) return false; // proposal hides direct SBY link
    return true;
  });
  const features = keys.map(k=>({
    type:"Feature", properties:{id:k},
    geometry:{type:"LineString",coordinates:toLonLat(RP[k])}
  }));
  return {type:"FeatureCollection",features};
}

function ensureRoadLayers(){
  const net=networkGeoJSON(SHOW_HUB);
  if(!map.getSource("routes")) map.addSource("routes",{type:"geojson",data:net});
  else map.getSource("routes").setData(net);

  if(!map.getLayer("routes-halo")){
    map.addLayer({id:"routes-halo",type:"line",source:"routes",
      paint:{"line-color":"#9fb4ff","line-opacity":0.22,"line-width":7.5},
      layout:{"line-cap":"round","line-join":"round"}});
  }
  if(!map.getLayer("routes-base")){
    map.addLayer({id:"routes-base",type:"line",source:"routes",
      paint:{"line-color":"#ffffff","line-opacity":0.9,"line-width":3.0},
      layout:{"line-cap":"round","line-join":"round"}});
  }

  if(!map.getSource("alert")) map.addSource("alert",{type:"geojson",data:{type:"FeatureCollection",features:[]}});
  if(!map.getLayer("alert-red")){
    map.addLayer({id:"alert-red",type:"line",source:"alert",
      paint:{"line-color":"#ff6b6b","line-opacity":0.98,"line-width":4.6},
      layout:{"line-cap":"round","line-join":"round"}});
  }

  if(!map.getSource("fix")) map.addSource("fix",{type:"geojson",data:{type:"FeatureCollection",features:[]}});
  if(!map.getLayer("fix-green")){
    map.addLayer({id:"fix-green",type:"line",source:"fix",
      paint:{"line-color":"#00d08a","line-opacity":0.98,"line-width":5.8},
      layout:{"line-cap":"round","line-join":"round"}});
  }

  try { map.moveLayer("fix-green"); } catch(e) {}
}
function refreshRoadNetwork(){
  const src=map.getSource("routes");
  if(src) src.setData(networkGeoJSON(SHOW_HUB));
}

/* helpers for sources */
function featureForRoute(ids){
  return {type:"Feature",properties:{id:ids.join("-")},
    geometry:{type:"LineString",coordinates:toLonLat(expandIDsToLatLon(ids))}};
}
function setSourceFeatures(srcId,features){
  const src=map.getSource(srcId); if(!src) return;
  src.setData({type:"FeatureCollection",features:features||[]});
}

/* -------------------- warehouse icons + labels -------------------- */
const WH_IMG=new Image(); let WH_READY=false;
WH_IMG.onload=()=>{WH_READY=true;}; WH_IMG.onerror=()=>{WH_READY=false; debug("warehouse_iso.png missing at root");};
WH_IMG.src=`${WAREHOUSE_ICON_SRC}?v=${Date.now()}`;

const WH_BASE=26, WH_MIN=16, WH_MAX=34;
const sizeByZoom=z=>Math.max(WH_MIN,Math.min(WH_MAX, WH_BASE*(0.9+(z-5)*0.18)));
function drawLabelBox(text, p, z){
  const S=sizeByZoom(z);
  const label=text, pad=6, h=16, w=ctx.measureText(label).width+pad*2, py=p.y+S/2+12;
  ctx.fillStyle="rgba(10,10,12,.78)"; ctx.fillRect(p.x-w/2,py-h/2,w,h);
  ctx.fillStyle="#e8eef2"; ctx.textBaseline="middle"; ctx.fillText(label,p.x-w/2+pad,py);
}
function drawWarehouses(){
  if(!ctx) return; const z=map.getZoom();
  ctx.font="bold 11px system-ui, Segoe UI, Roboto, sans-serif";

  // base four
  for(const id of Object.keys(CITY)){
    const c=CITY[id], p=map.project({lng:c.lon,lat:c.lat}), S=sizeByZoom(z);
    if(WH_READY) ctx.drawImage(WH_IMG, p.x-S/2, p.y-S/2, S, S);
    drawLabelBox(c.name, p, z);
  }

  // Yogyakarta hub marker when enabled
  if(SHOW_HUB || (SHOW_CITY && CITY_PROPOSAL)){
    const c=HUB[HUB_ID]; const p=map.project({lng:c.lon,lat:c.lat}); const S=sizeByZoom(z);
    if(WH_READY) ctx.drawImage(WH_IMG, p.x-S/2, p.y-S/2, S, S);
    drawLabelBox(c.name, p, z);
  }

  // Malang marker only in City Addition
  if(SHOW_CITY){
    const c=NEW_CITY; const p=map.project({lng:c.lon,lat:c.lat}); const S=sizeByZoom(z);
    if(WH_READY) ctx.drawImage(WH_IMG, p.x-S/2, p.y-S/2, S, S);
    drawLabelBox(c.name, p, z);
  }
}

/* -------------------- trucks -------------------- */
const trucks=[]; const truckNumberById=new Map();
const SPEED_MULTIPLIER=8.6, MIN_GAP_PX=50, CROSS_GAP_PX=34, LANES_PER_ROUTE=3, LANE_WIDTH_PX=6.5, MIN_STEP=0.010;

function defaultPathIDs(o,d){
  const k1=keyFor(o,d), k2=keyFor(d,o);
  if(RP[k1]||RP[k2]) return [o,d];
  if(getAnchor(o) && getAnchor(d)) return [o,d];
  return (o!=="WH4"&&d!=="WH4") ? [o,"WH4",d] : [o,d];
}
function hashStr(s){ let h=0; for(let i=0;i<s.length;i++){ h=((h<<5)-h)+s.charCodeAt(i); h|=0; } return Math.abs(h); }
function segProject(pt){ return map.project({lng:pt[1],lat:pt[0]}); }

function spawnTruck(tr, idx){
  const delayed=(tr.status||"").toLowerCase()==="delayed" || (tr.delay_hours||0)>0;
  const ids=defaultPathIDs(tr.origin,tr.destination);
  const latlon=expandIDsToLatLon(ids); if(latlon.length<2) return;

  const startT=Math.random()*0.55;
  const base=delayed?2.88:4.00;
  const speed=base*(0.92+Math.random()*0.16);
  const startDelay=300+Math.random()*800;
  const laneIndex=((hashStr(tr.id)%LANES_PER_ROUTE)+LANES_PER_ROUTE)%LANES_PER_ROUTE;

  trucks.push({
    id:tr.id, origin:tr.origin, dest:tr.destination,
    latlon, seg:0, t:startT, dir:1, speed,
    delayed, laneIndex,
    startAt:performance.now()+startDelay,
    paused:false, savedPath:null
  });
  truckNumberById.set(tr.id, idx+1);
}
function drawVectorTruck(g,w,h,delayed,number){
  const trW=w*0.78,trH=h*0.72;
  g.fillStyle="rgba(0,0,0,.25)"; g.beginPath(); g.ellipse(0,trH*0.35,trW*0.9,trH*0.42,0,0,Math.PI*2); g.fill();
  const grad=g.createLinearGradient(-trW/2,0,trW/2,0); grad.addColorStop(0,"#eef2f6"); grad.addColorStop(1,"#cfd7df");
  g.fillStyle=grad; g.strokeStyle="#6f7a86"; g.lineWidth=1.2; g.beginPath(); g.roundRect(-trW/2,-trH/2,trW,trH,3); g.fill(); g.stroke();
  const cw=w*0.34,ch=h*0.72,cg=g.createLinearGradient(-cw/2,0,cw/2,0); cg.addColorStop(0,"#b3bcc6"); cg.addColorStop(1,"#9aa5b2");
  g.fillStyle=cg; g.strokeStyle="#5f6771"; g.beginPath(); g.roundRect(-w/2,-ch/2,cw,ch,3); g.fill(); g.stroke();
  g.fillStyle="#26303a"; g.fillRect(-w/2+2,-ch*0.44,cw-4,ch*0.32);
  const R=7; g.fillStyle="#fff"; g.strokeStyle="#20262e"; g.lineWidth=1.2;
  g.beginPath(); g.arc(trW*0.18,-trH*0.2,R,0,Math.PI*2); g.fill(); g.stroke();
  g.fillStyle="#111"; g.font="bold 9px system-ui"; g.textAlign="center"; g.textBaseline="middle";
  g.fillText(String(number), trW*0.18, -trH*0.2);
  g.fillStyle=delayed?"#ff3b30":"#00c853"; g.beginPath(); g.arc(trW*0.32,-trH*0.28,3.2,0,Math.PI*2); g.fill();
}

/* animation */
let __lastTS=performance.now(), __dt=1/60;
function drawFrame(){
  if(!ctx) return;
  ctx.clearRect(0,0,overlay.width,overlay.height);
  const now=performance.now();

  for(const T of trucks){
    if(now<T.startAt) continue;

    const a=T.latlon[T.seg], b=T.latlon[T.seg+T.dir]||a;
    const aP=segProject(a), bP=segProject(b);
    const segLenPx=Math.max(1,Math.hypot(bP.x-aP.x,bP.y-aP.y));

    if(!T.paused){
      let pxPerSec=SPEED_MULTIPLIER*T.speed*(0.9+(map.getZoom()-4)*0.12);
      let step=(pxPerSec*__dt)/segLenPx;

      const myProg=T.t*segLenPx; let minLead=Infinity;
      for(const O of trucks){
        if(O===T||now<O.startAt) continue;
        if(O.latlon[O.seg]===T.latlon[T.seg] && O.latlon[O.seg+O.dir]===T.latlon[T.seg+T.dir] && O.dir===T.dir){
          const a2=segProject(O.latlon[O.seg]), b2=segProject(O.latlon[O.seg+O.dir]);
          const seg2=Math.max(1,Math.hypot(b2.x-a2.x,b2.y-a2.y));
          const oProg=O.t*seg2; if(oProg>myProg) minLead=Math.min(minLead,oProg-myProg);
        }
      }
      if(isFinite(minLead)&&minLead<MIN_GAP_PX) step*=Math.max(0.25,(minLead/MIN_GAP_PX)*0.7);

      const x1=aP.x+(bP.x-aP.x)*T.t, y1=aP.y+(bP.y-aP.y)*T.t; let nearest=Infinity;
      for(const O of trucks){ if(O===T||now<O.startAt) continue;
        const aO=segProject(O.latlon[O.seg]), bO=segProject(O.latlon[O.seg+O.dir]);
        const xO=aO.x+(bO.x-aO.x)*O.t, yO=aO.y+(bO.y-aO.y)*O.t;
        nearest=Math.min(nearest,Math.hypot(xO-x1,yO-y1));
      }
      if(isFinite(nearest)&&nearest+CROSS_GAP_PX< C ROSS_GAP_PX) step*=Math.max(0.30,(nearest/CROSS_GAP_PX)*0.6);
      step=Math.max(step,MIN_STEP);

      T.t+=step;
      if(T.t>=1){ T.seg+=T.dir; T.t-=1; if(T.seg<=0){T.seg=0;T.dir=1;} else if(T.seg>=T.latlon.length-1){T.seg=T.latlon.length-1;T.dir=-1;} }
    }

    const theta=Math.atan2(bP.y-aP.y,bP.x-aP.x);
    const nx=-(bP.y-aP.y), ny=(bP.x-aP.x), nL=Math.max(1,Math.hypot(nx,ny));
    const laneZero=T.laneIndex-(LANES_PER_ROUTE-1)/2, off=laneZero*LANE_WIDTH_PX;
    const x=aP.x+(bP.x-aP.x)*T.t+(nx/nL)*off, y=aP.y+(bP.y-aP.y)*T.t+(ny/nL)*off;

    const z=map.getZoom(), scale=1.0+(z-4)*0.12, w=28*scale, h=14*scale;
    const num=truckNumberById.get(T.id)||0;
    ctx.save(); ctx.translate(x,y); ctx.rotate(theta); drawVectorTruck(ctx,w,h,T.delayed,num); ctx.restore();
  }
  drawWarehouses();
}

/* -------------------- Narration + Chat -------------------- */
const synth=window.speechSynthesis; let VOICE=null;
function pickVoice(){
  const vs=synth?.getVoices?.()||[];
  const prefs=[/en-IN/i,/English.+India/i,/Neural|Natural/i,/Microsoft|Google/i,/en-GB/i,/en-US/i];
  for(const p of prefs){ const v=vs.find(v=>p.test(v.name)||p.test(v.lang)); if(v) return v; }
  return vs[0]||null;
}
VOICE=pickVoice(); if(!VOICE&&synth) synth.onvoiceschanged=()=>{VOICE=pickVoice();};

const ChatUI = (() => {
  const msgs = document.getElementById('msgs');
  const input = document.getElementById('chatInput');
  const send = document.getElementById('chatSend');
  const muteBtn = document.getElementById('muteBtn');
  const clearBtn = document.getElementById('clearBtn');

  let onCommand = null;
  let muted = false;

  function stamp() {
    const d = new Date();
    return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  }
  function pushBubble(text, kind='system') {
    const div = document.createElement('div');
    div.className = `msg ${kind}`;
    div.innerHTML = `${escapeHTML(text)}<small>${stamp()}</small>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight + 200;
  }
  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  function handleSend(){
    const raw = (input.value||'').trim();
    if(!raw) return;
    pushBubble(raw, 'user');
    input.value = '';
    const cmd = raw.toLowerCase();
    if(onCommand){
      if(cmd === 'disrupt' || cmd === 'correct' || cmd === 'normal' || cmd === 'hub' || cmd === 'add hub' || cmd === 'hub addition' || cmd === 'city' || cmd === 'city addition'){
        onCommand(cmd);
      } else {
        pushBubble('Valid commands: Disrupt, Correct, Normal, Hub Addition, City Addition.', 'system');
      }
    }
  }

  send.addEventListener('click', handleSend);
  input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ handleSend(); }});
  muteBtn.addEventListener('click', ()=>{ muted = !muted; muteBtn.setAttribute('aria-pressed', String(muted)); muteBtn.textContent = muted ? '🔇 Unmute' : '🔊 Mute'; Narrator.setMuted(muted); });
  clearBtn.addEventListener('click', ()=>{ msgs.innerHTML = ''; });

  document.addEventListener('keydown', (e)=>{ if((e.ctrlKey||e.metaKey) && (e.key==='m' || e.key==='M')){ e.preventDefault(); muteBtn.click(); }});

  return {
    appendSystem: (t)=>pushBubble(t, 'system'),
    appendUser:   (t)=>pushBubble(t, 'user'),
    onCommand:    (fn)=>{ onCommand = fn; },
    setMuted:     (val)=>{ muted = !!val; muteBtn.setAttribute('aria-pressed', String(muted)); muteBtn.textContent = muted ? '🔇 Unmute' : '🔊 Mute'; }
  };
})();

/* ---- Narrator ---- */
const Narrator = (() => {
  let muted = false;
  let currentRun = 0;
  const PASS_IDLE_GAP_MS = 700;

  function newRunToken(){ currentRun += 1; return currentRun; }
  function clearTTS(){ try{ synth?.cancel?.(); }catch(e){} }
  function wait(ms){ return new Promise(res=>setTimeout(res, ms)); }

  function speakOnceAsync(text, rate=0.95, runToken){
    return new Promise((resolve) => {
      if(muted || !synth || !text || runToken!==currentRun){ return resolve(); }
      const u = new SpeechSynthesisUtterance(String(text));
      if(VOICE) u.voice = VOICE;
      u.rate = rate; u.pitch = 1.0; u.volume = 1.0;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      synth.speak(u);
    });
  }
  async function queueOnce(lines, gap=950, rate=0.95, runToken, preClear=false){
    if(preClear){ clearTTS(); }
    for(const line of lines){
      if(runToken!==currentRun) return;
      ChatUI.appendSystem(line);
      await speakOnceAsync(line, rate, runToken);
      if(runToken!==currentRun) return;
      if(gap>0) await wait(gap);
    }
  }

  return {
    sayLinesTwice: async (lines, gap=950, rate=0.95)=>{
      const run = newRunToken(); clearTTS();
      await queueOnce(lines, gap, rate, run, false);
      if(run!==currentRun) return;
      await wait(PASS_IDLE_GAP_MS);
      if(run!==currentRun) return;
      await queueOnce(lines, gap, rate, run, false);
    },
    sayLinesOnce: async (lines, gap=950, rate=0.95) => {
      const run = newRunToken(); clearTTS();
      await queueOnce(lines, gap, rate, run, false);
    },
    sayOnce: (line)=>{
      const run = newRunToken(); clearTTS();
      ChatUI.appendSystem(line);
      speakOnceAsync(line, 0.95, run);
    },
    clear: ()=>{ newRunToken(); clearTTS(); },
    setMuted: (m)=>{ muted = !!m; if(muted){ newRunToken(); clearTTS(); } }
  };
})();

/* -------------------- stats helpers -------------------- */
const baseStats={}; let beforeStats=null; let afterStats=null; let hubStats=null;

function computeStatsFromScenario(scn){
  const inC={}, outC={};
  (scn.trucks||[]).forEach(t=>{ outC[t.origin]=(outC[t.origin]||0)+1; inC[t.destination]=(inC[t.destination]||0)+1; });
  const stats={};
  (scn.warehouses||[]).forEach(w=>{
    stats[w.id]={ inv:w.inventory??0, in:inC[w.id]||0, out:outC[w.id]||0 };
  });
  return stats;
}
function renderStatsTable(pred){
  const tbody=document.querySelector("#statsTable tbody"); if(!tbody) return; tbody.innerHTML="";
  const ids = [...Object.keys(CITY), ...(SHOW_CITY? [NEW_CITY.id] : [])];
  for(const id of ids){
    const label = getAnchor(id)?.name || id;
    const s=pred[id]||{inv:"-",in:0,out:0};
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${label}</td><td>${s.inv}</td><td class="pos">+${s.in}</td><td class="neg">-${s.out}</td>`;
    tbody.appendChild(tr);
  }
}

/* -------------------- metrics (for Hub lines) -------------------- */
function haversineKm(a,b){ const toRad=v=>v*Math.PI/180, R=6371;
  const dLat=toRad(b[0]-a[0]), dLon=toRad(b[1]-a[1]); const lat1=toRad(a[0]), lat2=toRad(b[0]);
  const x=Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(x));
}
function pathDistanceKm(ids){ const pts=expandIDsToLatLon(ids); let d=0; for(let i=0;i<pts.length-1;i++) d+=haversineKm([pts[i][0],pts[i][1]],[pts[i+1][0],pts[i+1][1]]); return d; }
function truckDistanceKm(tr){ return pathDistanceKm([tr.origin, tr.destination]); }
function truckDriveMin(tr, scn){ const speed = tr.speed_kmph || scn?.policies?.default_speed_kmph || DEFAULT_SPEED_KMPH; const km = truckDistanceKm(tr); return (km / speed) * 60; }
function weightedStats(samples){ const totalW = samples.reduce((s,x)=>s+(x.w||1),0) || 1;
  const mean = samples.reduce((s,x)=>s+(x.min*(x.w||1)),0)/totalW;
  const arr=[...samples].sort((a,b)=>a.min-b.min); let acc=0, p90T=0; const target=0.9*totalW;
  for(const x of arr){ acc += (x.w||1); if(acc>=target){ p90T=x.min; break; } } return { mean, p90:p90T, totalW };
}
function summarizeScenario(scn){
  const cap = scn?.policies?.capacity_units ?? DEFAULT_CAPACITY_UNITS;
  const useHub = !!(scn?.policies?.use_hub);
  const dwell = scn?.policies?.hub_dwell_min ?? 0;
  const batch = scn?.policies?.consolidation_window_min ?? 0;
  const movements = (scn.trucks||[]).length;
  const truckKm = (scn.trucks||[]).reduce((s,t)=>s+truckDistanceKm(t),0);

  let samples=[]; if(useHub || (scn.trucks||[]).some(t=>t.origin.startsWith("H_")||t.destination.startsWith("H_"))){
    for(const t of (scn.trucks||[])) samples.push({min:truckDriveMin(t, scn)+dwell+batch, w:t.units||1});
  } else { for(const t of (scn.trucks||[])) samples.push({min:truckDriveMin(t, scn), w:t.units||1}); }

  const {mean, p90, totalW} = weightedStats(samples.length? samples : [{min:0,w:1}]);
  const util = (scn.trucks||[]).reduce((s,t)=>s+((t.units||0)/cap),0) / Math.max(1,(scn.trucks||[]).length);
  return { movements, truckKm, meanEta:Math.round(mean), p90Eta:Math.round(p90), utilization:Math.round(util*100), totalUnits:totalW };
}
const fmtInt=(n)=>Math.round(n).toLocaleString("en-US");
const roundKm=(km)=>Math.round(km/10)*10;
const fmtKm=(km)=>`${fmtInt(roundKm(km))} kilometers`;

/* -------------------- pause / reroute control -------------------- */
function odMatch(ids,o,d){ const a=ids[0], b=ids[ids.length-1]; return (a===o&&b===d)||(a===d&&b===o); }
function setTruckPath(T,latlon,toMid=false){ if(!latlon||latlon.length<2) return; T.latlon=latlon; T.seg=0; T.dir=1; T.t=toMid?0.5:0.0; }
function pauseAllOnRoute(step){
  const ids=step.route; const latlon=expandIDsToLatLon(ids);
  for(const T of trucks){
    const baseIDs=defaultPathIDs(T.origin,T.dest);
    if(odMatch(baseIDs, ids[0], ids[1])){
      if(!T.savedPath) T.savedPath={ latlon:[...T.latlon], seg:T.seg, t:T.t, dir:T.dir };
      setTruckPath(T, latlon, true);
      T.paused=true;
    }
  }
}
function unpauseAll(resetToSaved){
  for(const T of trucks){
    if(T.paused){
      if(resetToSaved && T.savedPath) setTruckPath(T, T.savedPath.latlon, false);
      T.paused=false; T.savedPath=null;
    }
  }
}
function reroutePaused(step){
  const full=step.reroute?.length ? expandIDsToLatLon(step.reroute.flat()) : null;
  if(!full) return 0;
  let released=0;
  for(const T of trucks){
    if(!T.paused) continue;
    setTruckPath(T, full, false);
    T.paused=false; T.savedPath=null; released++;
  }
  return released;
}

/* -------------------- state machine -------------------- */
let mode="normal"; let currentStepIdx=-1;
function setAlert(ids){ setSourceFeatures("alert",[featureForRoute(ids)]); }
function clearAlert(){ setSourceFeatures("alert",[]); }
function setFix(pairs){ setSourceFeatures("fix",(pairs||[]).map(pair=>featureForRoute(pair))); }
function clearFix(){ setSourceFeatures("fix",[]); }

function activateTrucksFromScenario(scn){
  trucks.length=0; truckNumberById.clear();
  (scn.trucks||[]).forEach((t,i)=>spawnTruck(t,i));
}

/* -------------------- Disrupt/Correct/Normal -------------------- */
function startDisrupt(){
  if(mode==="disrupt"){ Narrator.sayLinesTwice(["A disruption is already active. Click Correct to proceed."],900,0.92); return; }
  SHOW_HUB=false; SHOW_CITY=false; CITY_PROPOSAL=false; refreshRoadNetwork();
  currentStepIdx = (currentStepIdx + 1) % STEPS.length;
  const step=STEPS[currentStepIdx];
  clearFix(); setAlert(step.route);
  pauseAllOnRoute(step);

  renderStatsTable(beforeStats);
  Narrator.sayLinesTwice([...step.cause,"Once ready, click Correct."], 950, 0.9);
  mode="disrupt";
}
function applyCorrect(){
  if(mode!=="disrupt"){ Narrator.sayLinesTwice(["No active disruption. Click Disrupt first."],800,0.95); return; }
  SHOW_HUB=false; SHOW_CITY=false; CITY_PROPOSAL=false; refreshRoadNetwork();
  const step=STEPS[currentStepIdx];
  clearAlert(); setFix(step.reroute);
  reroutePaused(step);
  renderStatsTable(afterStats);
  Narrator.sayLinesTwice(step.fix, 950, 0.92);
  mode="fixed";
}
function backToNormal(){
  SHOW_HUB=false; SHOW_CITY=false; CITY_PROPOSAL=false; refreshRoadNetwork();
  Narrator.clear();
  clearAlert(); clearFix();
  activateTrucksFromScenario(SCN_BEFORE);
  renderStatsTable(beforeStats);
  Narrator.sayLinesTwice(["Returning to normal operations. All corridors white and flowing."], 900, 0.95);
  mode="normal";
}

/* -------------------- Hub Addition flow -------------------- */
function hubAddition(){
  if(!SCN_HUB){ Narrator.sayLinesTwice(["Hub scenario not found in scenario_after.json (key 'hub')."], 800, 0.95); return; }
  Narrator.clear(); clearAlert(); clearFix();

  SHOW_CITY=false; CITY_PROPOSAL=false;
  SHOW_HUB=true; refreshRoadNetwork();

  activateTrucksFromScenario(SCN_HUB);
  renderStatsTable(hubStats||beforeStats);

  const baseS = summarizeScenario(SCN_BEFORE);
  const hubS  = summarizeScenario(SCN_HUB);

  const lines=[
    "Hub Addition engaged — evaluating Yogyakarta as a consolidation hub.",
    `Truck movements changed by ${Math.abs(Math.round((hubS.movements-baseS.movements)/Math.max(1,baseS.movements)*100))}% (base ${fmtInt(baseS.movements)} → hub ${fmtInt(hubS.movements)}).`,
    `Distance traveled changed by ${Math.abs(Math.round((hubS.truckKm-baseS.truckKm)/Math.max(1,baseS.truckKm)*100))}% (base ${fmtKm(baseS.truckKm)} → hub ${fmtKm(hubS.truckKm)}).`
  ];
  Narrator.sayLinesTwice(lines, 850, 0.92);
  mode="hub";
}

/* -------------------- City Addition (Malang) -------------------- */
async function cityAddition(){
  Narrator.clear(); clearAlert(); clearFix();

  // Stage 1 — Baseline: Surabaya ↔ Malang direct; keep base flows
  SHOW_HUB=false; SHOW_CITY=true; CITY_PROPOSAL=false; refreshRoadNetwork();

  const CITY_BASE = {
    warehouses: [{id:NEW_CITY.id, location:"Malang", inventory:120}],
    trucks: [
      {id:"MLG1", origin:"WH2", destination:"C_MLG", units:5, speed_kmph:55},
      {id:"MLG2", origin:"C_MLG", destination:"WH2", units:5, speed_kmph:55}
    ],
    policies:{ use_hub:false, capacity_units:10, default_speed_kmph:55 }
  };

  const COMBINED_BASE = {
    warehouses: [...(SCN_BEFORE.warehouses||[]), ...CITY_BASE.warehouses],
    trucks: [...(SCN_BEFORE.trucks||[]), ...CITY_BASE.trucks],
    policies: SCN_BEFORE.policies
  };
  activateTrucksFromScenario(COMBINED_BASE);
  renderStatsTable(computeStatsFromScenario(COMBINED_BASE));

  await Narrator.sayLinesOnce([
    "City Addition — Baseline: Opening Malang served directly from Surabaya.",
    "Existing Java corridors continue as-is."
  ], 900, 0.92);

  // Stage 2 — Proposal: Hub fan-out Yogyakarta ↔ Malang
  await new Promise(r=>setTimeout(r,900));
  SHOW_HUB=false; SHOW_CITY=true; CITY_PROPOSAL=true; refreshRoadNetwork();

  const CITY_PROP = {
    warehouses: [{id:NEW_CITY.id, location:"Malang", inventory:120}, {id:HUB_ID, location:"Yogyakarta Hub", inventory:80}],
    trucks: [
      {id:"MLG3", origin:"H_JOG", destination:"C_MLG", units:8, speed_kmph:55},
      {id:"MLG4", origin:"C_MLG", destination:"H_JOG", units:8, speed_kmph:55},
      // ensure some feed to hub is visible
      {id:"FEED1", origin:"WH2", destination:"H_JOG", units:7, speed_kmph:55},
      {id:"FEED2", origin:"H_JOG", destination:"WH2", units:7, speed_kmph:55}
    ],
    policies:{ use_hub:true, hubs:[HUB_ID], hub_dwell_min:45, consolidation_window_min:25, capacity_units:10, default_speed_kmph:55 }
  };

  const COMBINED_PROP = {
    warehouses: [...(SCN_BEFORE.warehouses||[]), ...CITY_PROP.warehouses],
    trucks: [...(SCN_BEFORE.trucks||[]), ...CITY_PROP.trucks],
    policies: SCN_BEFORE.policies
  };
  activateTrucksFromScenario(COMBINED_PROP);
  renderStatsTable(computeStatsFromScenario(COMBINED_PROP));

  await Narrator.sayLinesOnce([
    "Proposal: Serve Malang via Yogyakarta hub to improve consolidation.",
    "Direct Surabaya ↔ Malang leg is replaced with Hub ↔ Malang."
  ], 900, 0.92);

  mode="city";
}

/* -------------------- camera helper -------------------- */
function fitToBoundsOfAnchors(ids){
  const b=new maplibregl.LngLatBounds();
  ids.forEach(id=>{ const a=getAnchor(id); if(a) b.extend([a.lon,a.lat]); });
  if(b.isEmpty()) return;
  map.fitBounds(b,{padding:{top:60,left:60,right:320,bottom:60},duration:800,maxZoom:6.8});
}

/* -------------------- boot -------------------- */
let SCN_BEFORE=null, SCN_AFTER=null, SCN_HUB=null;

const mapReady=new Promise(res=>map.on("load",res));
(async function start(){
  await mapReady;
  ensureCanvas(); ensureRoadLayers();

  // top-left buttons
  const ui=document.getElementById("ui")||document.body;
  const btnBefore=document.getElementById("btnBefore");
  const btnAfter=document.getElementById("btnAfter");
  if(btnBefore) btnBefore.textContent="Disrupt";
  if(btnAfter)  btnAfter.textContent="Correct";

  let btnNormal=document.getElementById("btnNormal");
  if(!btnNormal){
    btnNormal=document.createElement("button");
    btnNormal.id="btnNormal"; btnNormal.textContent="Normal";
    btnNormal.style.marginLeft="8px";
    ui.appendChild(btnNormal);
  }
  let btnHub=document.getElementById("btnHub");
  if(!btnHub){
    btnHub=document.createElement("button");
    btnHub.id="btnHub"; btnHub.textContent="Hub Addition";
    btnHub.style.marginLeft="8px";
    ui.appendChild(btnHub);
  }
  let btnCity=document.getElementById("btnCity");
  if(!btnCity){
    btnCity=document.createElement("button");
    btnCity.id="btnCity"; btnCity.textContent="City Addition";
    btnCity.style.marginLeft="8px";
    ui.appendChild(btnCity);
  }

  // wire buttons
  if(btnBefore) btnBefore.onclick=()=>startDisrupt();
  if(btnAfter)  btnAfter.onclick =()=>applyCorrect();
  btnNormal.onclick=()=>backToNormal();
  btnHub.onclick=()=>hubAddition();
  btnCity.onclick=()=>cityAddition();

  // wire chat commands
  ChatUI.onCommand((cmd)=>{
    if(cmd==='disrupt') startDisrupt();
    else if(cmd==='correct') applyCorrect();
    else if(cmd==='normal') backToNormal();
    else if(cmd==='hub' || cmd==='add hub' || cmd==='hub addition') hubAddition();
    else if(cmd==='city' || cmd==='city addition') cityAddition();
  });

  // load scenarios
  const beforeRaw = await fetchOrDefault("scenario_before.json", DEFAULT_BEFORE);
  SCN_BEFORE = beforeRaw;
  const afterRaw  = await fetchOrDefault("scenario_after.json",  DEFAULT_BEFORE);
  SCN_AFTER = { warehouses: afterRaw.warehouses, trucks: afterRaw.trucks, policies: afterRaw.policies||{} };
  SCN_HUB   = afterRaw.hub ? { warehouses: afterRaw.hub.warehouses, trucks: afterRaw.hub.trucks, policies: afterRaw.hub.policies } : null;

  // compute stats snapshots
  beforeStats = computeStatsFromScenario(SCN_BEFORE);
  afterStats  = computeStatsFromScenario(SCN_AFTER);
  hubStats    = SCN_HUB ? computeStatsFromScenario(SCN_HUB) : null;
  Object.assign(baseStats, beforeStats);

  // spawn trucks from BEFORE scenario
  activateTrucksFromScenario(SCN_BEFORE);

  // initial camera — include base nodes
  const b=new maplibregl.LngLatBounds(); Object.values(CITY).forEach(c=>b.extend([c.lon,c.lat]));
  map.fitBounds(b,{padding:{top:60,left:60,right:320,bottom:60},duration:800,maxZoom:6.8});

  // start clean
  renderStatsTable(beforeStats);
  Narrator.sayLinesTwice([
    "Type Disrupt, Correct, Normal — or Hub Addition — or City Addition — to drive the simulation.",
    "🔊 Toggle narration with the Mute button or press Ctrl+M."
  ]);
})();

/* -------------------- fetch helper & tick -------------------- */
async function fetchOrDefault(file, fallback){
  try{ const r=await fetch(`${file}?v=${Date.now()}`,{cache:"no-store"}); if(!r.ok) throw new Error(`HTTP ${r.status}`); return await r.json(); }
  catch(e){ debug(`Using default scenario (${e.message})`); return fallback; }
}
function tick(){ const now=performance.now(); const dt=Math.min(0.05,(now-__lastTS)/1000); __lastTS=now; __dt=dt; drawFrame(); requestAnimationFrame(tick); }
requestAnimationFrame(tick);
