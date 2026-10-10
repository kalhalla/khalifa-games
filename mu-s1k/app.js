(()=>{
const $=s=>document.querySelector(s);
const SCALES={minor:[0,2,3,5,7,8,10],dorian:[0,2,3,5,7,9,10],phrygian:[0,1,3,5,7,8,10],major:[0,2,4,5,7,9,11]};
const NOTE=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const DR=[{id:'kick',name:'Kick'},{id:'clap',name:'Clap'},{id:'hat',name:'Hat'},{id:'open',name:'Open hat'},{id:'perc',name:'Perc'}];
const BARS=[1,2,4,8,16];
const MAXL=12,MAXS=16;
const P=s=>[...s.padEnd(16,'.')].slice(0,16).map(c=>c==='x'?1:0);
const Z=()=>Array(16).fill(0);
const clone=o=>JSON.parse(JSON.stringify(o));
const blankAcid=()=>Array.from({length:16},()=>({on:0,d:0,a:0,s:0}));
const acidFrom=l=>{const a=blankAcid();l.forEach(([i,d,ac,sl])=>a[i]={on:1,d,a:ac,s:sl});return a};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const PRESETS={
glue:{name:'Euphoric break',bpm:130,swing:.1,root:5,scale:'minor',
drums:{kick:'x.........x.....',clap:'....x.......x...',hat:'..x...xx..x...x.',open:'..............x.',perc:'...x.......x.x..'},
acid:{steps:[[0,0,1,0],[3,0,0,0],[7,7,0,1],[8,4,0,0],[11,0,1,0],[14,2,0,0]],cutoff:.24,res:.25,env:.3,decay:.45,dist:.12,vol:.5,wave:'saw',follow:true},
chords:{mode:'pad',prog:[0,5,2,6],stab:'..x.....x.....x.',cutoff:.58,vol:.8,ext:true},
fx:{rev:.5,dly:.3,pump:.6}},
acid:{name:'Acid 303',bpm:125,swing:.06,root:9,scale:'minor',
drums:{kick:'x...x...x...x...',clap:'....x.......x...',hat:'..x...x...x...x.',open:'',perc:'.......x......x.'},
acid:{steps:[[0,0,1,0],[1,0,0,0],[2,7,0,1],[3,7,0,0],[4,3,0,0],[6,0,1,0],[7,-2,0,1],[8,0,0,0],[10,9,1,0],[11,7,0,1],[12,4,0,0],[13,0,0,0],[14,2,1,0],[15,0,0,1]],cutoff:.34,res:.8,env:.6,decay:.35,dist:.45,vol:.7,wave:'saw',follow:false},
chords:{mode:'off',prog:[0,0,5,6],stab:'',cutoff:.5,vol:.6,ext:false},
fx:{rev:.25,dly:.35,pump:.3}},
house:{name:'Deep house',bpm:122,swing:.2,root:2,scale:'dorian',
drums:{kick:'x...x...x...x...',clap:'....x.......x...',hat:'.x.x.x.x.x.x.x.x',open:'..x...x...x...x.',perc:'...x......x.....'},
acid:{steps:[[0,0,0,0],[3,0,0,0],[6,0,1,0],[10,7,0,0],[11,0,0,0]],cutoff:.18,res:.12,env:.2,decay:.4,dist:.05,vol:.6,wave:'square',follow:true},
chords:{mode:'stab',prog:[0,3,1,4],stab:'..x..x...x..x...',cutoff:.5,vol:.75,ext:true},
fx:{rev:.35,dly:.25,pump:.35}},
techno:{name:'Warehouse techno',bpm:133,swing:0,root:4,scale:'phrygian',
drums:{kick:'x...x...x...x...',clap:'',hat:'.x.x.x.x.x.x.x.x',open:'..x...x...x...x.',perc:'.x....x...x..x..'},
acid:{steps:[[0,0,1,0],[2,0,0,1],[3,1,0,0],[5,0,0,0],[6,7,1,1],[7,8,0,0],[9,0,0,0],[10,0,1,0],[12,3,0,1],[13,1,0,0],[15,0,0,0]],cutoff:.2,res:.85,env:.7,decay:.25,dist:.7,vol:.6,wave:'square',follow:false},
chords:{mode:'stab',prog:[0,0,1,0],stab:'...x.......x....',cutoff:.4,vol:.6,ext:true},
fx:{rev:.4,dly:.55,pump:.25}},
arp:{name:'Sunrise arp',bpm:128,swing:.08,root:0,scale:'minor',
drums:{kick:'x...x...x...x...',clap:'....x.......x...',hat:'..x...x...x...x.',open:'',perc:'..........x..x..'},
acid:{steps:[[0,0,0,0],[4,0,0,0],[8,0,0,0],[10,0,1,0],[12,0,0,0]],cutoff:.2,res:.2,env:.25,decay:.4,dist:.1,vol:.5,wave:'saw',follow:true},
chords:{mode:'arp',prog:[0,5,2,4],stab:'',cutoff:.6,vol:.75,ext:true},
fx:{rev:.55,dly:.45,pump:.55}}
};
/* Pad sounds: built-in vocal chops, drums and effects, or your own sample */
const PADS_DEF=[['v:ah','Ah'],['v:oh','Oh'],['v:ooh','Ooh'],['v:ee','Ee'],['v:hey','Hey!'],['v:yeah','Yeah'],['v:ohoh','Oh-oh'],['v:choir','Choir'],['d:kick','Kick'],['d:clap','Clap'],['d:hat','Hat'],['d:open','Open hat'],['d:perc','Perc'],['fx:stab','Stab'],['fx:riser','Riser'],['fx:drop','Sub drop']];
const SND_NAME=Object.fromEntries(PADS_DEF);
const defPads=()=>PADS_DEF.map(([snd])=>({snd,pitch:0,vol:snd.startsWith('d:')?.8:.75}));
const blankPh=()=>Array.from({length:16},()=>[]);
const PAD_DEMO={glue:{B:{0:[14]},C:{6:[0],11:[1]},D:{0:[7]}},house:{C:{3:[4],11:[4]}},arp:{C:{8:[2]},D:{0:[7]}},techno:{B:{0:[14]}},acid:{B:{0:[14]}}};
/* ---------- layers: the track is a stack of layers, and the song switches them on and off per section ---------- */
const COLS=['var(--kick)','var(--acid)','var(--chords)','var(--mix)','var(--perc)','var(--hat)','var(--open)','var(--clap)'];
const TCOL={drums:'var(--kick)',acid:'var(--acid)',chords:'var(--chords)',pads:'var(--mix)'};
const TNAME={drums:'drums',acid:'acid synth',chords:'chords',pads:'pads & samples'};
const ACID_DEF={cutoff:.3,res:.6,env:.5,decay:.4,dist:.3,wave:'saw',follow:false,oct:0};
let uidN=0;const uid=()=>'L'+Date.now().toString(36)+(uidN++).toString(36);
const emptyDrums=()=>Object.fromEntries(DR.map(d=>[d.id,Z()]));
function mkLayer(type,o={}){
const L={id:uid(),type,name:o.name||type,col:o.col||TCOL[type],vol:o.vol!=null?o.vol:.8,mute:false,solo:false,ev:0};
if(type==='drums'){L.pats=o.pats||[emptyDrums(),emptyDrums()];L.dvol=o.dvol||{kick:.9,clap:.6,hat:.4,open:.35,perc:.5};L.dtune=o.dtune||{kick:0,clap:0,hat:0,open:0,perc:0};L.dmute=o.dmute||{}}
else if(type==='acid'){L.pats=o.pats||[blankAcid(),blankAcid()];Object.assign(L,ACID_DEF,o.p||{})}
else if(type==='chords'){L.pats=o.pats||[{mode:'pad',prog:[0,5,2,6],stab:Z()},{mode:'off',prog:[0,5,2,6],stab:Z()}];Object.assign(L,{cutoff:.55,ext:true},o.p||{})}
else{L.pats=o.pats||[blankPh(),blankPh()];L.pads=o.pads||defPads()}
return L;
}
function norm(o){
if(!o||!Array.isArray(o.layers))return null;
const F={rev:.35,dly:.3,pump:.4,filter:1,master:.8};o.fx=o.fx||{};for(const k in F)if(o.fx[k]==null)o.fx[k]=F[k];
if(!SCALES[o.scale])o.scale='minor';o.root=(o.root|0)%12;o.bpm=Math.max(90,Math.min(160,o.bpm||124));if(o.swing==null)o.swing=0;
o.layers=o.layers.filter(L=>L&&TCOL[L.type]&&Array.isArray(L.pats)&&L.pats.length).slice(0,MAXL);
o.layers.forEach(L=>{
if(L.pats.length<2)L.pats.push(clone(L.pats[0]));L.ev=L.ev?1:0;if(L.vol==null)L.vol=.8;L.col=L.col||TCOL[L.type];
if(L.type==='drums'){L.dmute=L.dmute||{};L.dvol=L.dvol||{kick:.9,clap:.6,hat:.4,open:.35,perc:.5};L.dtune=L.dtune||{kick:0,clap:0,hat:0,open:0,perc:0}}
if(L.type==='acid')for(const k in ACID_DEF)if(L[k]==null)L[k]=ACID_DEF[k];
if(L.type==='chords'){if(L.cutoff==null)L.cutoff=.55;if(L.ext==null)L.ext=true}
if(L.type==='pads'&&(!Array.isArray(L.pads)||L.pads.length!==16))L.pads=defPads();
});
if(!o.layers.length){const d=mkLayer('drums',{name:'drums',vol:.9});d.pats[0].kick=P('x...x...x...x...');o.layers.push(d)}
if(!Array.isArray(o.secs)||!o.secs.length)o.secs=[{name:'loop',bars:4,on:Object.fromEntries(o.layers.map(L=>[L.id,1]))}];
o.secs=o.secs.slice(0,MAXS);o.secs.forEach(s=>{s.on=s.on||{};if(!BARS.includes(s.bars))s.bars=4;s.name=s.name||'section'});
if(!o.layers.some(L=>L.id===o.sel))o.sel=o.layers[0].id;
o.cs=Math.min(Math.max(0,o.cs|0),o.secs.length-1);
if(o.mode!=='song')o.mode='loop';o.v=3;
return o;
}
/* Older saves (one pattern, or patterns A to D) become layers. For each part, the most-used content becomes
its main pattern and the next different one its alt; the song order becomes the section grid. */
function fromV2(o){
if(!(o.pats&&o.song)){
if(!o.drums||!o.acid)return null;
const pat={name:'main',drums:o.drums,steps:o.acid.steps||blankAcid(),mode:(o.chords&&o.chords.mode)||'off',prog:(o.chords&&o.chords.prog)||[0,0,0,0],stab:(o.chords&&o.chords.stab)||Z()};
o.pats={A:clone(pat)};o.song=[{p:'A',bars:4}];o.cur='A';o.mode='loop';
}
const pats=o.pats,K=Object.keys(pats);
K.forEach(k=>{if(!Array.isArray(pats[k].ph)||pats[k].ph.length!==16)pats[k].ph=blankPh()});
const cnt={};o.song.forEach(e=>cnt[e.p]=(cnt[e.p]||0)+e.bars);
const order=[o.cur,...K.slice().sort((x,y)=>(cnt[y]||0)-(cnt[x]||0))].filter(k=>pats[k]);
const mute=o.mute||{},fx=o.fx||{},Ls=[];
const lay=(get,empty,mk)=>{const c={};K.forEach(k=>c[k]=JSON.stringify(get(pats[k])));let m=null,a=null;
for(const k of order){if(empty(pats[k]))continue;if(m==null)m=c[k];else if(c[k]!==m&&a==null)a=c[k]}
if(m==null)return;const L=mk(JSON.parse(m),a&&JSON.parse(a));L._m=k=>!pats[k]||empty(pats[k])?0:c[k]===a?2:1;Ls.push(L)};
lay(p=>p.drums,p=>DR.every(d=>!(p.drums[d.id]||[]).some(Boolean)),(m,a)=>mkLayer('drums',{name:'drums',pats:[m,a||emptyDrums()],vol:fx.drums!=null?fx.drums:.9,dvol:o.dvol,dtune:o.dtune,dmute:Object.fromEntries(DR.filter(d=>mute[d.id]).map(d=>[d.id,true]))}));
const A=o.acid||{};
lay(p=>p.steps,p=>!(p.steps||[]).some(s=>s.on),(m,a)=>{const L=mkLayer('acid',{name:'acid',pats:[m,a||blankAcid()],vol:A.vol!=null?A.vol:.6,p:{cutoff:A.cutoff,res:A.res,env:A.env,decay:A.decay,dist:A.dist,wave:A.wave,follow:!!A.follow}});L.mute=!!mute.acid;return L});
const C=o.chords||{};
lay(p=>({mode:p.mode,prog:p.prog,stab:p.stab}),p=>!p.mode||p.mode==='off',(m,a)=>{const L=mkLayer('chords',{name:'chords',pats:[m,a||{mode:'off',prog:[...m.prog],stab:Z()}],vol:C.vol!=null?C.vol*.9:.7,p:{cutoff:C.cutoff,ext:C.ext}});L.mute=!!mute.chords;return L});
const pads=(Array.isArray(o.pads)&&o.pads.length===16?o.pads:defPads()).map((q,i)=>q.snd==='user'?{...q,sid:'pad'+i}:q);
lay(p=>p.ph,p=>p.ph.every(a=>!a.length),(m,a)=>mkLayer('pads',{name:'pads',pats:[m,a||blankPh()],vol:fx.pads!=null?fx.pads:.9,pads}));
if(!Ls.some(L=>L.type==='pads')&&pads.some(q=>q.snd==='user'))Ls.push(Object.assign(mkLayer('pads',{name:'pads',pads}),{_m:()=>0}));
const secs=o.song.map(e=>({name:String((pats[e.p]||{}).name||'section').toLowerCase().slice(0,12),bars:e.bars,on:Object.fromEntries(Ls.map(L=>[L.id,L._m(e.p)]))}));
Ls.forEach(L=>delete L._m);
return{v:3,preset:o.preset||null,name:o.name||'',bpm:o.bpm,swing:o.swing,root:o.root,scale:o.scale,fx:{rev:fx.rev,dly:fx.dly,pump:fx.pump,filter:fx.filter,master:fx.master},layers:Ls,secs,mode:o.mode==='song'?'song':'loop',sel:Ls[0]&&Ls[0].id,cs:0};
}
function load(o){if(!o||typeof o!=='object')return null;try{return o.v===3?norm(o):norm(fromV2(o))}catch(e){return null}}
function build(k){
if(k==='glue')return buildGlue();
const p=PRESETS[k],pd=PAD_DEMO[k]||{};
const full=Object.fromEntries(DR.map(d=>[d.id,P(p.drums[d.id]||'')])),bl=clone(full);bl.kick=Z();bl.clap=P('x.x.x.x.x.x.x.x.');
const dr=mkLayer('drums',{name:'drums',pats:[full,bl],vol:.9});
const ac=mkLayer('acid',{name:'acid',vol:p.acid.vol,pats:[acidFrom(p.acid.steps),blankAcid()],p:{cutoff:p.acid.cutoff,res:p.acid.res,env:p.acid.env,decay:p.acid.decay,dist:p.acid.dist,wave:p.acid.wave,follow:p.acid.follow}});
const Ls=[dr,ac];let ch=null;
if(p.chords.mode!=='off'){ch=mkLayer('chords',{name:p.chords.mode==='arp'?'arp':p.chords.mode==='stab'?'stabs':'chord pad',vol:p.chords.vol*.9,pats:[{mode:p.chords.mode,prog:[...p.chords.prog],stab:P(p.chords.stab||'')},{mode:'pad',prog:[...p.chords.prog],stab:Z()}],p:{cutoff:p.chords.cutoff,ext:p.chords.ext}});Ls.push(ch)}
const ph=(...m)=>{const a=blankPh();m.forEach(x=>x&&Object.entries(x).forEach(([s,v])=>v.forEach(i=>{if(!a[+s].includes(i))a[+s].push(i)})));return a};
const vx=mkLayer('pads',{name:'vocals',vol:.9,pats:[ph(pd.C),ph(pd.B,pd.D)]});Ls.push(vx);
const on=(d,a,c,v)=>{const o={[dr.id]:d,[ac.id]:a,[vx.id]:v};if(ch)o[ch.id]=c;return o};
const secs=[{name:'intro',bars:4,on:on(1,0,0,0)},{name:'build',bars:4,on:on(2,1,1,2)},{name:'drop',bars:8,on:on(1,1,1,1)},{name:'break',bars:4,on:on(0,ch?0:1,1,2)},{name:'build',bars:2,on:on(2,1,1,2)},{name:'drop',bars:8,on:on(1,1,1,1)}];
return norm({v:3,preset:k,name:p.name,bpm:p.bpm,swing:p.swing,root:p.root,scale:p.scale,fx:{...p.fx,filter:1,master:.8},layers:Ls,secs,mode:'song',sel:dr.id,cs:0});
}
/* "Euphoric break": an original track in the UK breaks / emotional-house style: broken beat, sub bass,
   warm minor pads, plucked arpeggio, drifting vocal "ooh"s, filter-rise build-ups and a long arrangement. */
function buildGlue(){
const p=PRESETS.glue,z=()=>Object.fromEntries(DR.map(d=>[d.id,Z()])),dr=o=>{const x=z();for(const k in o)x[k]=P(o[k]);return x};
const beat=mkLayer('drums',{name:'beat',vol:.92,pats:[dr({kick:'x.........x.....',clap:'....x.......x...'}),dr({clap:'....x.......x.xx'})],dvol:{kick:.95,clap:.55,hat:.4,open:.35,perc:.5}});
const hats=mkLayer('drums',{name:'hats & shakers',col:'var(--hat)',vol:.8,pats:[dr({hat:'x.xxx.x.x.xxx.xx',open:'......x.......x.',perc:'..x....x..x...x.'}),dr({hat:'x.x.x.x.x.x.x.x.',perc:'..x.......x.....'})],dvol:{kick:.9,clap:.6,hat:.26,open:.2,perc:.3}});
const bass=mkLayer('acid',{name:'sub bass',col:'var(--perc)',vol:.78,pats:[acidFrom([[0,0,0,1],[1,0,0,0],[6,0,0,0],[8,0,0,1],[9,0,0,0],[14,0,0,0]]),blankAcid()],p:{wave:'square',cutoff:.1,res:.06,env:.1,decay:.6,dist:.04,follow:true}});
const pads=mkLayer('chords',{name:'warm pads',vol:.78,pats:[{mode:'pad',prog:[0,5,3,4],stab:Z()},{mode:'pad',prog:[0,5,3,4],stab:Z()}],p:{cutoff:.5,ext:true}});
const plucks=mkLayer('chords',{name:'plucks',col:'var(--acid)',vol:.5,pats:[{mode:'arp',prog:[0,5,3,4],stab:Z()},{mode:'off',prog:[0,5,3,4],stab:Z()}],p:{cutoff:.66,ext:true}});
const vph=m=>{const a=blankPh();Object.entries(m).forEach(([s,v])=>a[+s]=[...v]);return a};
const vox=mkLayer('pads',{name:'vocals',vol:.85,pats:[vph({0:[2],6:[0],11:[1]}),vph({0:[7,14]})]});
vox.pads[2].pitch=0;vox.pads[0].pitch=3;vox.pads[1].pitch=-2;vox.pads[7].vol=.6;vox.pads[14].vol=.55;
const Ls=[beat,hats,bass,pads,plucks,vox];
const on=o=>Object.fromEntries(Ls.map(L=>[L.id,o[L.name]||0]));
const secs=[
{name:'intro',bars:8,on:on({'hats & shakers':2,'warm pads':1})},
{name:'build',bars:4,rise:true,on:on({beat:2,'hats & shakers':1,'warm pads':1,vocals:2})},
{name:'drop',bars:8,on:on({beat:1,'hats & shakers':1,'sub bass':1,'warm pads':1,plucks:1,vocals:1})},
{name:'break',bars:8,on:on({'warm pads':1,plucks:1,vocals:1})},
{name:'build',bars:4,rise:true,on:on({beat:2,'hats & shakers':1,'warm pads':1,plucks:1,vocals:2})},
{name:'drop',bars:8,on:on({beat:1,'hats & shakers':1,'sub bass':1,'warm pads':1,plucks:1,vocals:1})},
{name:'outro',bars:4,on:on({'hats & shakers':2,'warm pads':1})}];
return norm({v:3,preset:'glue',name:p.name,bpm:130,swing:.14,root:p.root,scale:'minor',fx:{rev:.58,dly:.36,pump:.55,filter:1,master:.82},layers:Ls,secs,mode:'song',sel:beat.id,cs:0});
}
function blank(){
const dr=mkLayer('drums',{name:'drums',vol:.9});dr.pats[0].kick=P('x...x...x...x...');
return norm({v:3,preset:null,name:'',bpm:S?S.bpm:124,swing:.06,root:S?S.root:9,scale:S?S.scale:'minor',fx:{rev:.35,dly:.3,pump:.4,filter:1,master:.8},layers:[dr],secs:[{name:'loop',bars:4,on:{[dr.id]:1}}],mode:'loop',sel:dr.id,cs:0});
}
const KEY='afterglow.v1';
/* saved tracks handed over from the old mu-s1k.vercel.app address arrive in the URL hash */
try{const h=location.hash.match(/^#move=([A-Za-z0-9_-]+)/);if(h){
const js=JSON.parse(decodeURIComponent(escape(atob(h[1].replace(/-/g,'+').replace(/_/g,'/')))));
for(const [k,v] of Object.entries(js||{})){if(!/^(cur|prev|slot[1-4])$/.test(k)||typeof v!=='string')continue;const kk=KEY+'.'+k;
if(k==='cur'&&localStorage.getItem(kk)){localStorage.setItem(KEY+'.prev',v);continue}
if(!localStorage.getItem(kk))localStorage.setItem(kk,v)}
history.replaceState(null,'',location.pathname+location.search)}}catch(e){}
let S=null;
try{const raw=localStorage.getItem(KEY+'.cur');S=raw?load(JSON.parse(raw)):null}catch(e){S=null}
if(!S)S=build('glue');
let saveT;
function save(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(KEY+'.cur',JSON.stringify(S))}catch(e){}},300)}
const LI=()=>Math.max(0,S.layers.findIndex(L=>L.id===S.sel));
const CL=()=>S.layers[LI()];
const anySolo=()=>S.layers.some(x=>x.solo);
const lg=L=>L.mute||(anySolo()&&!L.solo)?0:L.vol;
/* which pattern a layer plays: in loop mode the one you are editing; in song mode the grid decides (-1 = off) */
const layerVar=(L,sec)=>{if(!sec)return L.ev;const o=sec.on[L.id]|0;return o?o-1:-1};
const semi=d=>{const sc=SCALES[S.scale];const o=Math.floor(d/7);const i=((d%7)+7)%7;return sc[i]+12*o};
const acidMidi=(L,d,sh=0)=>36+S.root+semi(d+sh)+12*(L.oct|0);
const nn=m=>NOTE[((m%12)+12)%12]+(Math.floor(m/12)-1);
const hz=m=>440*Math.pow(2,(m-69)/12);
function chordNotes(deg,L){const n=L.ext?4:3,r=[];for(let k=0;k<n;k++){let m=48+S.root+semi(deg+2*k);while(m>71)m-=12;while(m<50)m+=12;r.push(m)}return r.sort((a,b)=>a-b)}
function chordInfo(deg,L){const r=semi(deg),t=semi(deg+2)-r,f=semi(deg+4)-r,s=semi(deg+6)-r;let q=t===3?(f===6?'dim':'m'):'';
if(L.ext){q=q==='dim'?'m7♭5':q+(s===11?'maj7':'7')}
let ro=['i','ii','iii','iv','v','vi','vii'][deg];if(t===4)ro=ro.toUpperCase();if(f===6)ro+='°';
return{name:NOTE[(S.root+r)%12]+q,ro}}
/* ---------- audio ---------- */
let ctx=null;let N={};
function bq(type,f,q=.7){const b=ctx.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q;return b}
function gn(v=1){const g=ctx.createGain();g.gain.value=v;return g}
function makeIR(sec){const len=Math.floor(ctx.sampleRate*sec),b=ctx.createBuffer(2,len,ctx.sampleRate);
for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++){d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2)}}return b}
function initAudio(){
ctx=new (window.AudioContext||window.webkitAudioContext)();
try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
buildGraph();applyParams();renderBuiltins();loadUserSamples();
}
function buildGraph(){
const nb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;N.noise=nb;
N.mfilt=bq('lowpass',20000,.9);N.comp=ctx.createDynamicsCompressor();
N.comp.threshold.value=-12;N.comp.ratio.value=4;N.comp.attack.value=.005;N.comp.release.value=.15;
N.master=gn(.8);N.an=ctx.createAnalyser();N.an.fftSize=1024;
N.mfilt.connect(N.comp).connect(N.master).connect(N.an).connect(ctx.destination);
N.revIn=gn(1);N.rev=ctx.createConvolver();N.rev.buffer=makeIR(2.8);N.revRet=gn(.4);N.revIn.connect(N.rev).connect(N.revRet).connect(N.mfilt);
N.dlyIn=gn(1);N.dly=ctx.createDelay(2);N.dfb=gn(.4);N.dlp=bq('lowpass',2800);N.dhp=bq('highpass',260);N.dlyRet=gn(.3);
N.dlyIn.connect(N.dly);N.dly.connect(N.dlp).connect(N.dhp);N.dhp.connect(N.dfb).connect(N.dly);N.dhp.connect(N.dlyRet).connect(N.mfilt);N.dlyRet.connect(gn(.25)).connect(N.revIn);
N.cBus=gn(1);N.pump=gn(1);N.cBus.connect(N.pump).connect(N.mfilt);
N.L={};
}
/* every layer gets its own channel: level, mute and solo act here, with its own reverb and delay sends */
function lnode(L){
let n=N.L[L.id];if(n)return n;
n=N.L[L.id]={out:gn(0),fr:gn(0),fd:gn(0)};
n.out.connect(L.type==='chords'?N.cBus:N.mfilt);
n.fr.connect(N.revIn);n.fd.connect(N.dlyIn);
const sr={acid:[.12,.22],chords:[.6,.35],pads:[.25,.18],drums:[0,0]}[L.type];
if(sr[0])n.out.connect(gn(sr[0])).connect(N.revIn);if(sr[1])n.out.connect(gn(sr[1])).connect(N.dlyIn);
n.dRev=gn(.3);n.dRev.connect(n.fr);n.dDly=gn(.35);n.dDly.connect(n.fd);
if(L.type==='acid'){n.osc=ctx.createOscillator();n.osc.type='sawtooth';n.osc.frequency.value=110;n.f1=bq('lowpass',400,8);n.f2=bq('lowpass',400,.7);n.amp=gn(0);
n.osc.connect(n.f1).connect(n.f2);n.amp.connect(n.out);n.osc.start()}
applyLayer(L,n);return n;
}
function applyLayer(L,n){
const t=ctx.currentTime,g=lg(L);[n.out,n.fr,n.fd].forEach(x=>x.gain.setTargetAtTime(g,t,.02));
if(L.type==='acid'){
n.osc.type=L.wave==='square'?'square':'sawtooth';n.f1.Q.setTargetAtTime(.7+L.res*22,t,.02);
if(n.distV!==L.dist){n.distV=L.dist;const k=1+L.dist*28,c=new Float32Array(1024);
for(let i=0;i<1024;i++){const x=i/511.5-1;c[i]=Math.tanh(k*x)/Math.tanh(k)*(1-L.dist*.35)}
/* a fresh shaper per drive change: some engines refuse to replace a curve */
const sh=ctx.createWaveShaper();sh.oversample='2x';sh.curve=c;try{n.f2.disconnect()}catch(e){}if(n.sh){try{n.sh.disconnect()}catch(e){}}
n.f2.connect(sh);sh.connect(n.amp);n.sh=sh}
}
}
function applyParams(){
if(!ctx)return;const t=ctx.currentTime,F=S.fx;
const set=(p,v)=>p.setTargetAtTime(v,t,.02);
set(N.master.gain,F.master);set(N.revRet.gain,F.rev*.9);set(N.dlyRet.gain,F.dly*.8);
set(N.mfilt.frequency,120*Math.pow(2,F.filter*7.4));
N.dly.delayTime.setTargetAtTime(3*stepDur(),t,.05);
const ids=new Set(S.layers.map(L=>L.id));
for(const id in N.L)if(!ids.has(id)){const n=N.L[id];try{n.out.disconnect();n.fr.disconnect();n.fd.disconnect();if(n.osc)n.osc.stop()}catch(e){}delete N.L[id]}
S.layers.forEach(L=>{const n=N.L[L.id];if(n)applyLayer(L,n);else lnode(L)});
}
const stepDur=()=>60/S.bpm/4;
function noise(){const s=ctx.createBufferSource();s.buffer=N.noise;return s}
function pump(t){const g=N.pump.gain;g.cancelScheduledValues(t);g.setValueAtTime(1-S.fx.pump*.85,t);g.setTargetAtTime(1,t+.01,.05+.12*S.fx.pump)}
const VOICE={
kick(t,v,p,n){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(165*p,t);o.frequency.exponentialRampToValueAtTime(48*p,t+.11);
g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.48);
o.connect(g).connect(n.out);o.start(t);o.stop(t+.5);
const s=noise(),h=bq('highpass',2500),ng=gn(0);ng.gain.setValueAtTime(v*.35,t);ng.gain.setTargetAtTime(0,t+.001,.004);s.connect(h).connect(ng).connect(n.out);s.start(t,Math.random()*.5);s.stop(t+.05);
if(lg(n.L||{})>0||!n.L)pump(t)},
clap(t,v,p,n){const s=noise(),b=bq('bandpass',1150*p,.9),g=gn(0);[0,.011,.022].forEach(o=>{g.gain.setValueAtTime(v,t+o);g.gain.setTargetAtTime(0,t+o+.001,.004)});
g.gain.setValueAtTime(v*.8,t+.033);g.gain.setTargetAtTime(0,t+.034,.07);s.connect(b).connect(g);g.connect(n.out);g.connect(n.dRev);s.start(t,Math.random()*.5);s.stop(t+.45)},
hat(t,v,p,n){const s=noise(),h=bq('highpass',7200*p),g=gn(0);g.gain.setValueAtTime(v,t);g.gain.setTargetAtTime(0,t+.001,.018);s.connect(h).connect(g).connect(n.out);s.start(t,Math.random()*.5);s.stop(t+.2);
if(n.openG){n.openG.gain.cancelScheduledValues(t);n.openG.gain.setTargetAtTime(0,t,.006)}},
open(t,v,p,n){const s=noise(),h=bq('highpass',6800*p),b=bq('peaking',10000*p,1),g=gn(0);b.gain.value=6;g.gain.setValueAtTime(v,t);g.gain.setTargetAtTime(0,t+.002,.11);
s.connect(h).connect(b).connect(g);g.connect(n.out);g.connect(n.dRev);s.start(t,Math.random()*.4);s.stop(t+.9);n.openG=g},
perc(t,v,p,n){const o=ctx.createOscillator(),g=gn(0);o.type='sine';o.frequency.setValueAtTime(430*p,t);o.frequency.exponentialRampToValueAtTime(330*p,t+.05);
g.gain.setValueAtTime(v,t);g.gain.setTargetAtTime(0,t+.002,.045);o.connect(g);g.connect(n.out);g.connect(n.dDly);o.start(t);o.stop(t+.35)}
};
const tune=(L,id)=>Math.pow(2,(L.dtune[id]||0)/12);
function trigAcid(L,n,midi,t,acc,glide){
const f=hz(midi),o=n.osc.frequency;n.gate=true;
if(glide){o.setTargetAtTime(f,t,.028);return}
o.cancelScheduledValues(t);o.setValueAtTime(f,t);
const g=n.amp.gain,lv=acc?.95:.6;g.cancelScheduledValues(t);g.setValueAtTime(0,t);g.linearRampToValueAtTime(lv,t+.003);n.lv=lv;
const base=50*Math.pow(2,L.cutoff*7.5),peak=Math.min(base*Math.pow(2,L.env*4.5*(acc?1.35:1))+(acc?700:0),18000),tc=(.05+L.decay*.85)/3;
[n.f1,n.f2].forEach(fl=>{fl.frequency.cancelScheduledValues(t);fl.frequency.setTargetAtTime(peak,t,.003);fl.frequency.setTargetAtTime(base,t+.01,tc)});
}
function gateOff(n,t){n.gate=false;const g=n.amp.gain;g.setValueAtTime(n.lv||.6,t);g.linearRampToValueAtTime(0,t+.012)}
/* acid lines can follow the chord progression of the first chords layer */
function followShift(L,cb,sec){if(!L.follow)return 0;const C=S.layers.find(x=>x.type==='chords');if(!C)return 0;const v=layerVar(C,sec);return C.pats[v<0?0:v].prog[cb]||0}
function playAcid(L,n,steps,s,cb,t,sd,sec){
const st=steps[s];if(!st.on)return;
const prev=steps[(s+15)%16],next=steps[(s+1)%16];
trigAcid(L,n,acidMidi(L,st.d,followShift(L,cb,sec)),t,st.a,prev.on&&prev.s&&n.gate);
if(!(st.s&&next.on))gateOff(n,t+sd*.6);
}
function voice(m,t,dur,peak,att,rel,cut,dest){
const fl=bq('lowpass',cut*.55,.8),g=gn(0);fl.frequency.linearRampToValueAtTime(cut,t+att+.08);
g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+att);g.gain.setValueAtTime(peak,t+Math.max(att,dur));g.gain.setTargetAtTime(0,t+Math.max(att,dur),rel/3);
fl.connect(g).connect(dest);
[-8,8].forEach(dt=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=hz(m);o.detune.value=dt;o.connect(fl);o.start(t);o.stop(t+dur+rel*2+.1)});
}
function playChords(L,n,pp,s,cb,t,sd){
if(pp.mode==='off')return;
const notes=chordNotes(pp.prog[cb],L),cut=200*Math.pow(2,L.cutoff*6.5);
if(pp.mode==='pad'){if(s===0)notes.forEach(m=>voice(m,t,16*sd-.05,.075,.35,1.3,cut,n.out))}
else if(pp.mode==='stab'){if(pp.stab[s])notes.forEach(m=>voice(m,t,sd*1.5,.09,.004,.25,cut*1.4,n.out))}
else{const seq=[...notes,notes[0]+12,notes[1]+12],ix=[0,2,1,3,2,4,3,5][s%8]%seq.length;voice(seq[ix]+12,t,sd*.8,.1,.003,.22,cut*1.5,n.out)}
}
function playLayer(L,v,s,cb,t,sd,sec){
const n=lnode(L),p=L.pats[v];n.L=L;
if(L.type==='drums')DR.forEach(d=>{if(p[d.id][s]&&!L.dmute[d.id])VOICE[d.id](t,L.dvol[d.id],tune(L,d.id),n)});
else if(L.type==='acid')playAcid(L,n,p,s,cb,t,sd,sec);
else if(L.type==='chords')playChords(L,n,p,s,cb,t,sd);
else p[s].forEach(i=>playPad(L,i,t));
}
function stepAll(s,cb,t,sd,sec){
S.layers.forEach(L=>{const v=layerVar(L,sec);
if(v<0){if(L.type==='acid'){const n=lnode(L);if(n.gate)gateOff(n,t)}return}
playLayer(L,v,s,cb,t,sd,sec)});
}
/* build-ups: the master filter opens across a section marked as a rise */
function sweepAt(t,sec,bar,st){const base=120*Math.pow(2,S.fx.filter*7.4);if(sec&&sec.rise){const p=(bar*16+st)/(sec.bars*16);N.mfilt.frequency.setTargetAtTime(Math.min(base,180*Math.pow(2,p*6.6)),t,.03);N.swept=true}else if(N.swept){N.mfilt.frequency.setTargetAtTime(base,t,.01);N.swept=false}}
/* ---------- built-in vocal chops (formant synthesis), effects, user samples ---------- */
const BUF={},USER={};let lastSrc={},BUILT=Promise.resolve();
const FORM={a:[730,1090,2440],o:[570,840,2410],u:[300,870,2240],i:[270,2290,3010],e:[530,1840,2480]};
const VOX={
ah:{dur:.95,f:[[0,261.6]],v:[[0,'a']]},
oh:{dur:.95,f:[[0,261.6]],v:[[0,'o']]},
ooh:{dur:.95,f:[[0,392]],v:[[0,'u']]},
ee:{dur:.95,f:[[0,311.1]],v:[[0,'i']]},
hey:{dur:.5,h:.07,f:[[0,330],[.45,277]],v:[[0,'e'],[.28,'i']]},
yeah:{dur:.7,f:[[0,330],[.62,262]],v:[[0,'i'],[.12,'e'],[.32,'a']]},
ohoh:{dur:.8,f:[[0,392],[.36,392],[.4,311.1]],v:[[0,'o']],gap:[.3,.4]},
choir:{dur:1.8,f:[[0,261.6]],v:[[0,'a'],[1.2,'o']],chord:[0,3,7],att:.2,voices:3}
};
function normPeak(b,target){let pk=0;for(let c=0;c<b.numberOfChannels;c++){const d=b.getChannelData(c);for(let k=0;k<d.length;k++)pk=Math.max(pk,Math.abs(d[k]))}
if(pk>1e-4){const g=target/pk;for(let c=0;c<b.numberOfChannels;c++){const d=b.getChannelData(c);for(let k=0;k<d.length;k++)d[k]*=g}}return b}
function ocNoise(oc,dur){const b=oc.createBuffer(1,Math.ceil(oc.sampleRate*dur),oc.sampleRate),d=b.getChannelData(0);for(let k=0;k<d.length;k++)d[k]=Math.random()*2-1;const s=oc.createBufferSource();s.buffer=b;return s}
async function renderVox(sp,sr){
const T=sp.dur,oc=new OfflineAudioContext(1,Math.ceil(sr*T),sr),att=sp.att||.025;
const env=oc.createGain();env.gain.setValueAtTime(0,0);env.gain.linearRampToValueAtTime(1,att);
if(sp.gap){env.gain.setValueAtTime(1,sp.gap[0]);env.gain.linearRampToValueAtTime(.04,sp.gap[0]+.03);env.gain.setValueAtTime(.04,sp.gap[1]-.01);env.gain.linearRampToValueAtTime(1,sp.gap[1]+.02)}
env.gain.setValueAtTime(1,T-.2);env.gain.linearRampToValueAtTime(0,T);env.connect(oc.destination);
const mix=oc.createGain();mix.gain.value=.5;
const bands=[0,1,2].map(j=>{const b=oc.createBiquadFilter();b.type='bandpass';const g=oc.createGain();g.gain.value=[1,.6,.32][j];mix.connect(b);b.connect(g).connect(env);return b});
sp.v.forEach(([t,vw],n)=>bands.forEach((b,j)=>{const f=FORM[vw][j];if(n===0){b.frequency.setValueAtTime(f,0);b.Q.value=f/[90,110,150][j]}else b.frequency.linearRampToValueAtTime(f,t)}));
const vc=sp.voices||1;
(sp.chord||[0]).forEach(iv=>{for(let k=0;k<vc;k++){
const o=oc.createOscillator(),r=Math.pow(2,iv/12);o.type='sawtooth';
sp.f.forEach(([t,f],n)=>n===0?o.frequency.setValueAtTime(f*r,0):o.frequency.linearRampToValueAtTime(f*r,t));
o.detune.value=(k-(vc-1)/2)*9;
const lfo=oc.createOscillator(),lgn=oc.createGain();lfo.frequency.value=5.2+k*.35;lgn.gain.setValueAtTime(0,0);lgn.gain.linearRampToValueAtTime(sp.f[0][1]*r*.007,.35);
lfo.connect(lgn).connect(o.frequency);const og=oc.createGain();og.gain.value=1/Math.sqrt(vc*(sp.chord?sp.chord.length:1));
o.connect(og).connect(mix);o.start(0);lfo.start(0);o.stop(T);lfo.stop(T)}});
const br=ocNoise(oc,T),bh=oc.createBiquadFilter(),bg=oc.createGain();bh.type='highpass';bh.frequency.value=1800;bg.gain.value=.05;br.connect(bh).connect(bg).connect(mix);br.start(0);
if(sp.h){const hn=ocNoise(oc,sp.h+.02),hb=oc.createBiquadFilter(),hg=oc.createGain();hb.type='bandpass';hb.frequency.value=1900;hb.Q.value=.8;hg.gain.setValueAtTime(.7,0);hg.gain.linearRampToValueAtTime(0,sp.h);hn.connect(hb).connect(hg).connect(oc.destination);hn.start(0)}
return normPeak(await oc.startRendering(),.9);
}
async function renderFx(kind,sr){
const dur={stab:.7,riser:2.2,drop:1.3}[kind],oc=new OfflineAudioContext(1,Math.ceil(sr*dur),sr);
if(kind==='stab'){[0,3,7,10].forEach(iv=>[-7,7].forEach(dt=>{const o=oc.createOscillator(),f=oc.createBiquadFilter(),g=oc.createGain();o.type='sawtooth';o.frequency.value=261.6*Math.pow(2,iv/12);o.detune.value=dt;
f.type='lowpass';f.frequency.setValueAtTime(4200,0);f.frequency.exponentialRampToValueAtTime(500,.45);g.gain.setValueAtTime(.12,0);g.gain.exponentialRampToValueAtTime(.001,dur-.02);o.connect(f).connect(g).connect(oc.destination);o.start(0);o.stop(dur)}))}
if(kind==='riser'){const n=ocNoise(oc,dur),b=oc.createBiquadFilter(),g=oc.createGain();b.type='bandpass';b.Q.value=3;b.frequency.setValueAtTime(300,0);b.frequency.exponentialRampToValueAtTime(9000,dur);g.gain.setValueAtTime(.02,0);g.gain.linearRampToValueAtTime(.7,dur-.05);g.gain.linearRampToValueAtTime(0,dur);n.connect(b).connect(g).connect(oc.destination);n.start(0);
const o=oc.createOscillator(),lp=oc.createBiquadFilter(),og=oc.createGain();o.type='sawtooth';o.frequency.setValueAtTime(110,0);o.frequency.exponentialRampToValueAtTime(880,dur);lp.type='lowpass';lp.frequency.value=2500;og.gain.setValueAtTime(.03,0);og.gain.linearRampToValueAtTime(.18,dur-.05);og.gain.linearRampToValueAtTime(0,dur);o.connect(lp).connect(og).connect(oc.destination);o.start(0);o.stop(dur)}
if(kind==='drop'){const o=oc.createOscillator(),ws=oc.createWaveShaper(),g=oc.createGain(),c=new Float32Array(512);for(let k=0;k<512;k++){const x=k/255.5-1;c[k]=Math.tanh(3*x)}ws.curve=c;
o.frequency.setValueAtTime(150,0);o.frequency.exponentialRampToValueAtTime(30,1.1);g.gain.setValueAtTime(.9,0);g.gain.setValueAtTime(.9,.8);g.gain.linearRampToValueAtTime(0,dur);o.connect(ws).connect(g).connect(oc.destination);o.start(0);o.stop(dur)}
return normPeak(await oc.startRendering(),.9);
}
function renderBuiltins(){
const sr=ctx.sampleRate;
BUILT=(async()=>{try{
for(const k of Object.keys(VOX))BUF['v:'+k]=await renderVox(VOX[k],sr);
for(const k of ['stab','riser','drop'])BUF['fx:'+k]=await renderFx(k,sr);
}catch(e){}})();
}
const IDB={db:null,
open(){return this.db?Promise.resolve(this.db):new Promise((res,rej)=>{const r=indexedDB.open('mu-s1k',1);r.onupgradeneeded=()=>r.result.createObjectStore('s');r.onsuccess=()=>res(this.db=r.result);r.onerror=()=>rej(r.error)})},
async run(mode,fn){const db=await this.open();return new Promise((res,rej)=>{const t=db.transaction('s',mode),rq=fn(t.objectStore('s'));t.oncomplete=()=>res(rq&&rq.result);t.onerror=()=>rej(t.error)})},
put(k,v){return this.run('readwrite',st=>st.put(v,k))},get(k){return this.run('readonly',st=>st.get(k))}};
const toBuf=r=>{const b=new AudioBuffer({length:Math.max(1,r.data.length),numberOfChannels:1,sampleRate:r.sr});b.copyToChannel(r.data,0);return b};
async function loadUserSamples(){
const want=new Set();S.layers.forEach(L=>{if(L.type==='pads')L.pads.forEach(q=>{if(q.snd==='user'&&q.sid&&!USER[q.sid])want.add(q.sid)})});
let got=false;for(const sid of want){try{const r=await IDB.get(sid);if(r&&r.data){USER[sid]=toBuf(r);got=true}}catch(e){return}}
if(got&&tab==='edit'&&CL().type==='pads')renderEdit();
}
function playPad(L,i,t){
const Pd=L.pads[i];if(!Pd)return;const n=lnode(L);
if(Pd.snd.startsWith('d:')){VOICE[Pd.snd.slice(2)](t,Pd.vol,Math.pow(2,Pd.pitch/12),n);return}
const buf=Pd.snd==='user'?USER[Pd.sid]:BUF[Pd.snd];if(!buf)return;
const keyed=Pd.snd.startsWith('v:')||Pd.snd==='fx:stab',sh=keyed?(((S.root+6)%12)-6):0;
const src=ctx.createBufferSource();src.buffer=buf;const rt=Math.pow(2,((+Pd.pitch||0)+(+Pd.fine||0)+sh)/12);src.playbackRate.value=isFinite(rt)?rt:1;
const g=gn(Pd.vol);src.connect(g).connect(n.out);
const key=L.id+':'+i,prev=lastSrc[key];if(prev&&prev.c===ctx&&t<prev.end){try{prev.g.gain.cancelScheduledValues(t);prev.g.gain.setValueAtTime(prev.v,t);prev.g.gain.linearRampToValueAtTime(0,t+.015);prev.s.stop(t+.02)}catch(e){}}
lastSrc[key]={g,s:src,c:ctx,v:Pd.vol,end:t+buf.duration/src.playbackRate.value};src.start(t);
}
function trimNorm(buf){
const n=buf.length,ch=buf.numberOfChannels,sr=buf.sampleRate,m=new Float32Array(n);
for(let c=0;c<ch;c++){const d=buf.getChannelData(c);for(let k=0;k<n;k++)m[k]+=d[k]/ch}
let pk=0;for(let k=0;k<n;k++)pk=Math.max(pk,Math.abs(m[k]));if(pk<1e-4)return null;
const th=pk*.06;let a=0,b=n-1;while(a<n&&Math.abs(m[a])<th)a++;while(b>a&&Math.abs(m[b])<th*.5)b--;
a=Math.max(0,a-Math.floor(sr*.01));b=Math.min(n-1,b+Math.floor(sr*.06));if(b-a>sr*6)b=a+Math.floor(sr*6);
const out=m.slice(a,b+1),g=.9/pk,fi=Math.min(Math.floor(sr*.004),out.length>>2),fo=Math.min(Math.floor(sr*.02),out.length>>2);
for(let k=0;k<out.length;k++){let e=1;if(k<fi)e=k/fi;else if(k>out.length-1-fo)e=(out.length-1-k)/fo;out[k]*=g*e}
return out;
}
function padMsg(t){const m=$('#padMsg');if(m)m.textContent=t}
async function storeSample(L,i,buf,name){
const d=trimNorm(buf);if(!d){padMsg('That was silent. Try again a little closer to the microphone.');return}
const sid='s'+Date.now().toString(36),r={sr:buf.sampleRate,data:d,name};USER[sid]=toBuf(r);
L.pads[i]={snd:'user',sid,name,pitch:0,vol:L.pads[i].vol||.85};save();
let kept=true;try{await IDB.put(sid,r)}catch(e){kept=false}
if(tab==='edit'&&CL()===L)renderEdit();
padMsg(kept?`Sampled into pad ${i+1}. It is saved on this device.`:`Sampled into pad ${i+1} for this session. This browser blocked saving it.`);
if(!playing&&ctx)playPad(L,i,ctx.currentTime+.02);
}
/* microphone: say exactly why it failed, because the fix is different each time */
function micProblem(e){
const n=e&&e.name;
if(n==='NotAllowedError'||n==='SecurityError')return 'Microphone access is blocked for this site. In Safari, tap aA in the address bar, then Website Settings, then Microphone, and choose Allow. Also check Settings › Apps › Safari › Microphone is set to Ask or Allow. Then tap sample mic again.';
if(n==='NotFoundError'||n==='OverconstrainedError')return 'No microphone was found on this device.';
if(n==='NotReadableError'||n==='AbortError')return 'The microphone is busy. Close any call or recording app, then try again.';
return 'The microphone could not start'+(n?' ('+n+')':'')+'. Try reloading the page.';
}
let recState=null;
async function capture(L,i){
if(recState){recState.stop();return}
if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){padMsg(window.isSecureContext===false?'The microphone only works on a secure (https) page.':'This browser window cannot use the microphone. If you opened the link inside another app, open khalifa.games/mu-s1k in Safari itself, or from your home-screen icon.');return}
if(!window.MediaRecorder){padMsg('This browser cannot record audio. Update iOS, or use Safari.');return}
if(!ctx)initAudio();if(ctx.state!=='running')ctx.resume();
let stream;
try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}})}
catch(e){
if(e&&e.name==='OverconstrainedError'){try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e2){padMsg(micProblem(e2));return}}
else{padMsg(micProblem(e));return}
}
try{if(navigator.audioSession)navigator.audioSession.type='play-and-record'}catch(e){}
let mr;try{mr=new MediaRecorder(stream)}catch(e){stream.getTracks().forEach(t=>t.stop());padMsg('This browser cannot record audio.');return}
const chunks=[];let to;
mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
mr.onstop=async()=>{clearTimeout(to);stream.getTracks().forEach(t=>t.stop());recState=null;try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
try{const ab=await new Blob(chunks,{type:mr.mimeType||'audio/mp4'}).arrayBuffer();const buf=await ctx.decodeAudioData(ab);
await storeSample(L,i,buf,'mic '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}))}
catch(e){if(tab==='edit')renderEdit();padMsg('That recording could not be read. Try again.')}};
mr.start();recState={stop:()=>{if(mr.state!=='inactive')mr.stop()}};
to=setTimeout(()=>recState&&recState.stop(),4000);if(tab==='edit')renderEdit();padMsg('Recording for up to 4 seconds. Tap stop when you are done.');
}
async function importFile(L,i,file){
if(!file)return;if(!ctx)initAudio();
try{const buf=await ctx.decodeAudioData(await file.arrayBuffer());await storeSample(L,i,buf,file.name.replace(/\.[^.]+$/,'').slice(0,18))}
catch(e){padMsg('That file could not be read. Try a WAV, MP3 or M4A.')}
}
/* ---------- render to WAV ---------- */
let EXP=null,exporting=false;
function wavBlob(b){
const ch=b.numberOfChannels,n=b.length,sr=b.sampleRate,ab=new ArrayBuffer(44+n*ch*2),v=new DataView(ab);
const w=(o,str)=>{for(let k=0;k<str.length;k++)v.setUint8(o+k,str.charCodeAt(k))};
w(0,'RIFF');v.setUint32(4,36+n*ch*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);
v.setUint32(24,sr,true);v.setUint32(28,sr*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*ch*2,true);
const d=[];for(let c=0;c<ch;c++)d.push(b.getChannelData(c));let o=44;
for(let k=0;k<n;k++)for(let c=0;c<ch;c++){const x=Math.max(-1,Math.min(1,d[c][k]));v.setInt16(o,x<0?x*32768:x*32767,true);o+=2}
return new Blob([ab],{type:'audio/wav'});
}
async function exportWav(){
if(exporting)return;exporting=true;
const msg=t=>{const m=$('#expMsg');if(m)m.textContent=t};
try{
if(!ctx)initAudio();msg('Rendering. This takes a few seconds.');await BUILT;await new Promise(r=>setTimeout(r,30));
const songMode=S.mode==='song',sr=44100,sd=stepDur(),plan=[];
if(songMode)S.secs.forEach((e,si)=>{for(let b=0;b<e.bars;b++)plan.push({si,b})});else for(let b=0;b<4;b++)plan.push({si:-1,b});
const off=new OfflineAudioContext(2,Math.ceil((plan.length*16*sd+3)*sr),sr);
const lc=ctx,lN=N,ls=lastSrc;ctx=off;N={};lastSrc={};
try{
buildGraph();applyParams();
let t0=.05;
plan.forEach(({si,b})=>{const sec=si<0?null:S.secs[si],cb=b%4;
for(let st=0;st<16;st++){const tt=t0+st*sd+(st%2?S.swing*sd*.6:0);stepAll(st,cb,tt,sd,sec);sweepAt(tt,sec,b,st)}
t0+=16*sd});
}finally{ctx=lc;N=lN;lastSrc=ls;applyParams()}
const buf=normPeak(await off.startRendering(),.97);
const nm=(S.name||'MU-S1K').replace(/[\\/:*?"<>|]/g,'').trim()||'MU-S1K';
const blob=wavBlob(buf),name=`${nm} ${songMode?'song':'loop'} ${S.bpm}bpm.wav`;
if(EXP)URL.revokeObjectURL(EXP.url);
EXP={url:URL.createObjectURL(blob),name,file:new File([blob],name,{type:'audio/wav'}),secs:Math.round(buf.duration),mb:(blob.size/1048576).toFixed(1)};
if(tab==='song')renderSong();
}catch(e){msg('Export failed in this browser.'+(e&&e.message?' '+e.message:''))}
finally{exporting=false}
}
async function shareExp(){
if(!EXP)return;
try{if(navigator.canShare&&navigator.canShare({files:[EXP.file]})){await navigator.share({files:[EXP.file],title:EXP.name});return}}
catch(e){if(e&&e.name==='AbortError')return}
const m=$('#expMsg');if(m)m.textContent='Sharing is not available here. Use save wav instead.';
}
/* ---------- transport ---------- */
let playing=false,nextT=0,step=0,secBar=0,secIdx=0,jumpTo=null,timer=null,q=[],wl=null,hist=[];
let cur={s:-1,b:0,i:0};
const curSec=()=>S.mode==='song'?S.secs[secIdx]:null;
function advanceBar(){
if(S.mode==='song'){
if(jumpTo!=null){secIdx=jumpTo;secBar=0;jumpTo=null}
else{secBar++;const e=S.secs[secIdx];if(!e||secBar>=e.bars){secBar=0;secIdx=(secIdx+1)%S.secs.length}}
}else secBar++;
}
function sched(){
while(nextT<ctx.currentTime+.12){
if(secIdx>=S.secs.length)secIdx=0;
const sd=stepDur(),t=nextT+(step%2?S.swing*sd*.6:0),cb=secBar%4;
stepAll(step,cb,t,sd,curSec());sweepAt(t,curSec(),secBar,step);
hist.push({s:step,t,si:secIdx});while(hist.length>64)hist.shift();
q.push({s:step,b:secBar,i:secIdx,t});nextT+=sd;step++;if(step===16){step=0;advanceBar()}
}
}
function start(from){
if(!ctx)initAudio();ctx.resume();playing=true;step=0;secBar=0;
secIdx=(from!=null?from:0);if(secIdx>=S.secs.length)secIdx=0;jumpTo=null;
q=[];nextT=ctx.currentTime+.06;timer=setInterval(sched,25);sched();
try{navigator.wakeLock&&navigator.wakeLock.request('screen').then(l=>wl=l).catch(()=>{})}catch(e){}
paintPlay();
}
function stop(){
playing=false;clearInterval(timer);const t=ctx.currentTime;if(N.swept){N.mfilt.frequency.cancelScheduledValues(t);N.mfilt.frequency.setTargetAtTime(120*Math.pow(2,S.fx.filter*7.4),t,.02);N.swept=false}
for(const id in N.L){const n=N.L[id];if(n.amp){n.amp.gain.cancelScheduledValues(t);n.amp.gain.setValueAtTime(n.amp.gain.value,t);n.amp.gain.linearRampToValueAtTime(0,t+.02);n.gate=false}}
q=[];cur={s:-1,b:0,i:0};highlight();try{wl&&wl.release()}catch(e){}wl=null;paintPlay();
}
function paintPlay(){const lp=document.getElementById('lPlay');if(lp){lp.classList.toggle('on',playing);lp.setAttribute('aria-label',playing?'Stop':'Play');document.getElementById('lIcon').setAttribute('d',playing?'M6 6h12v12H6z':'M7 4.5v15l13-7.5z');const lt=document.getElementById('lPlayT');if(lt)lt.textContent=playing?'playing · tap to stop':'tap to hear your track'}const hp=document.getElementById('hPlay');if(hp){hp.classList.toggle('on',playing);hp.setAttribute('aria-label',playing?'Stop':'Play');document.getElementById('hIcon').setAttribute('d',playing?'M6 6h12v12H6z':'M7 4.5v15l13-7.5z');if(document.documentElement.dataset.view==='home')renderHome()}document.getElementById('pwrLed').classList.toggle('on',playing);$('#play').classList.toggle('on',playing);$('#play').setAttribute('aria-label',playing?'Stop':'Play');
$('#playIcon').setAttribute('d',playing?'M6 6h12v12H6z':'M7 4.5v15l13-7.5z')}
$('#play').addEventListener('click',()=>playing?stop():start());
function highlight(){
document.querySelectorAll('.now').forEach(e=>e.classList.remove('now'));
const on=playing&&cur.s>=0,sec=on&&S.mode==='song'?S.secs[cur.i]:null;
if(on){document.querySelectorAll(`[data-s="${cur.s}"]`).forEach(e=>e.classList.add('now'));
document.querySelectorAll('[data-bar]').forEach(e=>e.classList.toggle('now',+e.dataset.bar===cur.b%4));
if(sec)document.querySelectorAll(`[data-col="${cur.i}"]`).forEach(e=>e.classList.add('now'))}
document.querySelectorAll('.lchip[data-l]').forEach(e=>{const L=S.layers.find(x=>x.id===e.dataset.l);e.classList.toggle('live',!!(on&&L&&lg(L)>0&&layerVar(L,sec)>=0))});
if(!on){$('#posLbl').textContent=S.mode==='song'?'Song':'Loop';$('#posBar').textContent='–';$('#posStep').textContent='stopped';return}
if(sec){$('#posLbl').textContent=`${cur.i+1} · ${sec.name}`;$('#posBar').textContent=`${cur.b+1}/${sec.bars}`}
else{$('#posLbl').textContent=`Loop · ${S.layers.length} layer${S.layers.length>1?'s':''}`;$('#posBar').textContent=`${cur.b%4+1}/4`}
$('#posStep').textContent=`step ${String(cur.s+1).padStart(2,'0')}`;
}
const cvs=[$('#scope'),$('#scope2')].map(c=>({c,x:c.getContext('2d')}));let wave;
function frame(){
if(playing&&ctx){let ch=false;while(q.length&&q[0].t<=ctx.currentTime){const e=q.shift();cur={s:e.s,b:e.b,i:e.i};ch=true}
if(ch){highlight();if(document.documentElement.dataset.view==='home')homeProgress()}}
const dpr=window.devicePixelRatio||1,col=getComputedStyle(document.documentElement).getPropertyValue('--lcd');
if(ctx&&playing&&N.an){if(!wave)wave=new Uint8Array(N.an.fftSize);N.an.getByteTimeDomainData(wave)}
cvs.forEach(({c,x})=>{if(!x||!c.offsetParent)return;const w=c.clientWidth*dpr,h=c.clientHeight*dpr;if(c.width!==w){c.width=w;c.height=h}
x.clearRect(0,0,w,h);x.lineWidth=1.5*dpr;x.strokeStyle=col;x.beginPath();
if(ctx&&playing&&wave){for(let i=0;i<wave.length;i+=4){const px=i/wave.length*w,py=wave[i]/255*h;i?x.lineTo(px,py):x.moveTo(px,py)}}
else{x.moveTo(0,h/2);x.lineTo(w,h/2)}x.stroke()});
requestAnimationFrame(frame)}
requestAnimationFrame(frame);
/* ---------- UI ---------- */
let tab='layers',selTrack='kick',selStep=0,selPad=0,rec=false,padSel=false,delArm=null;
const get=p=>p.split('.').reduce((o,k)=>o[k],S);
const setv=(p,v)=>{const k=p.split('.'),l=k.pop();k.reduce((o,x)=>o[x],S)[l]=v};
const pct=v=>Math.round(v*100)+'%';
const stF=v=>(v>0?'+':'')+v+' st';
function sliders(host,defs){
const box=document.createElement('div');box.className='knobs';host.appendChild(box);
defs.forEach(([label,path,min,max,stp,fmt,after])=>{
const id='kn-'+path.replace(/\./g,'-'),w=document.createElement('div');w.className='kn';
w.innerHTML=`<span class="kl" id="${id}-l">${label}</span><div class="kwrap"><div class="knob" id="${id}" role="slider" tabindex="0" aria-labelledby="${id}-l" aria-valuemin="${min}" aria-valuemax="${max}"><i class="rot"></i></div></div><b class="kv"></b>`;
const k=w.querySelector('.knob'),kv=w.querySelector('.kv'),wrap=w.querySelector('.kwrap');
const paint=()=>{const v=get(path),f=(v-min)/(max-min);wrap.style.setProperty('--v',f);k.style.setProperty('--a',(-135+270*f)+'deg');kv.textContent=fmt(v);k.setAttribute('aria-valuenow',v);k.setAttribute('aria-valuetext',fmt(v))};
const setVal=v=>{v=Math.min(max,Math.max(min,Math.round(v/stp)*stp));v=+v.toFixed(4);if(v===get(path))return;setv(path,v);paint();applyParams();after&&after();save();const bk=Math.round((v-min)/(max-min)*24);if(bk!==lb){lb=bk;uiSound('knob');haptic(3)}};
let sx=null,sy=0,sv=0,lb=Math.round((get(path)-min)/(max-min)*24);
k.addEventListener('pointerdown',e=>{k.setPointerCapture(e.pointerId);sx=e.clientX;sy=e.clientY;sv=get(path);k.classList.add('grab');e.preventDefault();k.focus({preventScroll:true})});
k.addEventListener('pointermove',e=>{if(sx==null)return;setVal(sv+((sy-e.clientY)+(e.clientX-sx))/170*(max-min))});
const end=()=>{sx=null;k.classList.remove('grab')};k.addEventListener('pointerup',end);k.addEventListener('pointercancel',end);
k.addEventListener('keydown',e=>{const st=Math.max(stp,(max-min)/50),m={ArrowUp:st,ArrowRight:st,ArrowDown:-st,ArrowLeft:-st,PageUp:st*5,PageDown:-st*5}[e.key];if(m!=null){e.preventDefault();setVal(get(path)+m)}});
paint();box.appendChild(w)});
}
function preview(L,d){if(!ctx||playing)return;const n=lnode(L),t=ctx.currentTime+.01;trigAcid(L,n,acidMidi(L,d),t,0,false);gateOff(n,t+.22)}
/* layer strip in the sticky bar */
function renderChips(){
$('#lchips').innerHTML=S.layers.map(L=>`<button class="lchip ${tab==='edit'&&L.id===S.sel?'sel':''} ${lg(L)>0?'':'off'}" data-l="${L.id}" style="--c:${L.col}">${esc(L.name)}</button>`).join('')
+(S.layers.length<MAXL?`<button class="lchip addc" data-add="1" aria-label="Add a layer">+</button>`:'');
$('#wmark').innerHTML=`${S.layers.length} layer${S.layers.length>1?'s':''}<br>${S.secs.length} section${S.secs.length>1?'s':''}`;
highlight();
}
$('#lchips').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
if(b.dataset.add){showTab('layers');setTimeout(()=>{const a=$('#addgrid');if(a)a.scrollIntoView({behavior:'smooth',block:'center'})},40);return}
openLayer(b.dataset.l)});
function openLayer(id){S.sel=id;selStep=0;selPad=0;delArm=null;padSel=false;save();showTab('edit')}
/* layers list */
const ADD=[['beat','four to the floor','kick, clap and hats','var(--kick)'],['drums','empty drum kit','build your own beat','var(--clap)'],
['acid','acid line','squelchy 303 riff','var(--acid)'],['bass','bassline','round, follows chords','var(--perc)'],['lead','acid lead','an octave higher','var(--open)'],
['pad','chord pad','long, warm chords','var(--chords)'],['stab','chord stabs','short house hits','var(--chords)'],['arp','arpeggio','rolling chord notes','var(--chords)'],
['vox','vocal chops','16 sung pads','var(--mix)'],['samp','sampler','record your own sounds','var(--hat)']];
function miniSteps(L){const p=L.pats[L.ev];
if(L.type==='drums')return Array.from({length:16},(_,i)=>DR.some(d=>p[d.id][i]));
if(L.type==='acid')return p.map(s=>!!s.on);
if(L.type==='chords')return Array.from({length:16},(_,i)=>p.mode==='pad'?i===0:p.mode==='stab'?!!p.stab[i]:p.mode==='arp');
return p.map(a=>a.length>0)}
const SIMPLE_ADD=['beat','acid','bass','pad','stab','vox'];
function setLvl(v){UI.lvl=v;saveUI();renderAll()}
function renderLayers(){
const p=$('#p-layers'),sm=simple();
p.innerHTML=`<div class="h"><h2>layers</h2><button class="btn lvlb" data-act="lvl">${sm?'show advanced':'simple view'}</button></div>
<p class="meta" style="margin:0">${sm?'Each layer is one part of your track, like the drums or the bass. Tap a layer to change it.':(S.mode==='song'?'Song mode: the song grid decides what plays.':'Loop mode plays every unmuted layer.')}</p>
<div class="pair adv"><div><label for="rootSel">key</label><select id="rootSel">${NOTE.map((n,i)=>`<option value="${i}" ${i===S.root?'selected':''}>${n}</option>`).join('')}</select></div>
<div><label for="scaleSel">scale</label><select id="scaleSel">${Object.keys(SCALES).map(k=>`<option ${k===S.scale?'selected':''}>${k}</option>`).join('')}</select></div></div>
<div class="lrows">${S.layers.map(L=>`<div class="lrow ${lg(L)>0?'':'muted'}" style="--c:${L.col}">
<button class="lname" data-open="${L.id}"><span class="t">${esc(L.name)}<small>${TNAME[L.type]}${L.ev&&!sm?' · alt':''}</small></span><span class="dots">${miniSteps(L).map((v,i)=>`<i class="dot ${v?'on':''}" data-s="${i}"></i>`).join('')}</span></button>
<button class="ms ${sm?'w':''} ${L.mute?'on':''}" data-mute="${L.id}" aria-label="Mute ${esc(L.name)}" aria-pressed="${L.mute}" style="--tc:var(--hat)">${sm?(L.mute?'muted':'mute'):'M'}</button>
<button class="ms adv ${L.solo?'on':''}" data-solo="${L.id}" aria-label="Solo ${esc(L.name)}" aria-pressed="${L.solo}" style="--tc:var(--signal)">S</button></div>`).join('')}</div>
<button class="addsnd cap" data-act="addsound"><b>+ add a sound</b><small>your voice, a ready-made vocal or a sound file</small></button>
${S.layers.length<MAXL?`<div><div class="meta" style="margin-bottom:8px">${sm?'add an instrument':'add a layer'}${S.mode==='song'?` · it starts switched on in section ${S.cs+1}`:''}</div><div class="addgrid" id="addgrid">${ADD.map(([k,n,d,c])=>`<button class="addb cap ${SIMPLE_ADD.includes(k)?'':'adv'}" data-addk="${k}" style="--c:${c}"><b>${n}</b><small>${d}</small></button>`).join('')}</div></div>`:`<p class="meta" style="margin:0">That is the maximum of ${MAXL} layers.</p>`}`;
highlight();
}
$('#p-layers').addEventListener('change',e=>{if(e.target.id==='rootSel')S.root=+e.target.value;else if(e.target.id==='scaleSel')S.scale=e.target.value;else return;save();paintKey()});
$('#p-layers').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
if(b.dataset.act==='lvl'){setLvl(simple()?'adv':'simple');return}
if(b.dataset.act==='addsound'){openSheet({});return}
if(b.dataset.open){openLayer(b.dataset.open);return}
if(b.dataset.addk){addLayer(b.dataset.addk);return}
const id=b.dataset.mute||b.dataset.solo;if(!id)return;const L=S.layers.find(x=>x.id===id);if(!L)return;
if(b.dataset.mute)L.mute=!L.mute;else L.solo=!L.solo;
applyParams();save();renderLayers();renderChips()});
function uniq(L){
const used=new Set(S.layers.map(x=>x.col));if(used.has(L.col)){const c=COLS.find(x=>!used.has(x));if(c)L.col=c}
const names=new Set(S.layers.map(x=>x.name));if(names.has(L.name)){let i=2;while(names.has(L.name+' '+i))i++;L.name+=' '+i}
}
function addLayer(k){
if(S.layers.length>=MAXL)return;let L;
switch(k){
case 'beat':L=mkLayer('drums',{name:'beat',vol:.9});Object.assign(L.pats[0],{kick:P('x...x...x...x...'),clap:P('....x.......x...'),hat:P('..x...x...x...x.')});break;
case 'drums':L=mkLayer('drums',{name:'drums',vol:.9});break;
case 'acid':L=mkLayer('acid',{name:'acid',vol:.6,pats:[acidFrom([[0,0,1,0],[3,0,0,0],[6,7,0,1],[8,0,0,0],[11,3,1,0],[14,0,0,0]]),blankAcid()]});break;
case 'bass':L=mkLayer('acid',{name:'bass',vol:.7,pats:[acidFrom([[2,0,0,0],[6,0,0,0],[10,0,0,0],[14,0,0,0]]),blankAcid()],p:{wave:'square',cutoff:.16,res:.12,env:.2,decay:.35,dist:.08,follow:true}});break;
case 'lead':L=mkLayer('acid',{name:'lead',vol:.45,pats:[acidFrom([[0,7,1,0],[3,4,0,0],[6,2,0,1],[7,0,0,0],[10,4,0,0],[12,7,1,0]]),blankAcid()],p:{oct:1,cutoff:.42,res:.5,env:.45,decay:.5,dist:.2,follow:true}});break;
case 'pad':L=mkLayer('chords',{name:'chord pad',vol:.7});break;
case 'stab':L=mkLayer('chords',{name:'stabs',vol:.7,pats:[{mode:'stab',prog:[0,3,1,4],stab:P('..x.....x.....x.')},{mode:'off',prog:[0,3,1,4],stab:Z()}]});break;
case 'arp':L=mkLayer('chords',{name:'arp',vol:.7,pats:[{mode:'arp',prog:[0,5,2,4],stab:Z()},{mode:'off',prog:[0,5,2,4],stab:Z()}]});break;
case 'vox':L=mkLayer('pads',{name:'vocals',vol:.9});break;
default:L=mkLayer('pads',{name:'sampler',vol:.9,pads:Array.from({length:16},()=>({snd:'user',pitch:0,vol:.85}))});
}
uniq(L);
S.layers.push(L);S.secs[S.cs].on[L.id]=1;
applyParams();save();openLayer(L.id);
}
function deleteLayer(L){
S.layers=S.layers.filter(x=>x!==L);S.secs.forEach(s=>delete s.on[L.id]);
if(!S.layers.length){S=norm(S)}
S.sel=S.layers[0].id;delArm=null;applyParams();save();showTab('layers');
}
/* layer editor: one screen per layer type, each with a main and an alt pattern */
const PCAT=x=>x.startsWith('v:')?'var(--chords)':x.startsWith('d:')?`var(--${x.slice(2)})`:x==='user'?'var(--hat)':'var(--mix)';
const padName=(L,i)=>{const Pd=L.pads[i];return Pd.snd==='user'?(Pd.sid?(Pd.name||'sample'):'empty'):SND_NAME[Pd.snd]};
const simple=()=>UI.lvl!=='adv';
const DPAT={house:{kick:'x...x...x...x...',clap:'....x.......x...',hat:'..x...x...x...x.'},breakbeat:{kick:'x.........x.....',clap:'....x.......x...',hat:'x.xxx.x.x.xxx.xx',perc:'..x....x..x...x.'},techno:{kick:'x...x...x...x...',hat:'.x.x.x.x.x.x.x.x',open:'..x...x...x...x.',perc:'.x....x...x..x..'}};
const RIFFS=[['rolling',[[0,0,0,0],[2,0,0,0],[3,0,0,0],[6,0,0,0],[8,0,0,0],[10,0,0,0],[11,0,0,0],[14,0,0,0]]],['off-beat',[[2,0,0,0],[6,0,0,0],[10,0,0,0],[14,0,0,0]]],['squelchy',PRESETS.acid.acid.steps],['bouncy',[[0,0,1,0],[3,0,0,0],[6,7,0,1],[8,0,0,0],[11,3,1,0],[14,0,0,0]]]];
const MOODS={happy:{scale:'major',prog:[0,4,5,3],ext:false,d:'bright and uplifting'},sad:{scale:'minor',prog:[0,5,2,6],ext:false,d:'emotional, a little melancholy'},dreamy:{scale:'dorian',prog:[0,3,5,4],ext:true,d:'soft and floating, late at night'},dark:{scale:'phrygian',prog:[0,1,0,6],ext:false,d:'tense, warehouse techno'}};
const MODEN={pad:'long',stab:'short',arp:'rolling',off:'off'};
const EDIT={
drums(L){const D=L.pats[L.ev],pat=D[selTrack],d=DR.find(x=>x.id===selTrack);
return `<div class="ov">${DR.map(t=>`<button class="ovrow ${t.id===selTrack?'sel':''} ${L.dmute[t.id]?'muted':''}" data-track="${t.id}" style="--c:var(--${t.id})"><span>${t.name}</span><span class="dots">${D[t.id].map((v,i)=>`<i class="dot ${v?'on':''}" data-s="${i}"></i>`).join('')}</span></button>`).join('')}</div>
<p class="meta simp" style="margin:0">Choose a drum above, then tap steps to switch it on or off.</p>
<div class="grid8" style="--tc:var(--${selTrack})">${pat.map((v,i)=>`<button class="pad ${v?'on':''} ${i%4===0?'beat':''}" data-s="${i}" data-pad="${i}" aria-pressed="${!!v}" aria-label="${d.name} step ${i+1}">${i+1}</button>`).join('')}</div>
<div class="simp"><div class="meta" style="margin-bottom:8px">ready-made beats</div><div class="tools">${Object.keys(DPAT).map(k=>`<button class="btn" data-act="dpat" data-p="${k}">${k}</button>`).join('')}<button class="btn" data-act="dpat" data-p="clear">clear all</button></div></div>
<div class="tools adv"><button class="btn ${L.dmute[selTrack]?'on':''}" data-act="vmute" style="--tc:var(--hat)">${L.dmute[selTrack]?d.name+' muted':'mute '+d.name.toLowerCase()}</button><button class="btn" data-act="clear">clear</button><button class="btn" data-act="four">every beat</button><button class="btn" data-act="off">offbeats</button></div>`},
acid(L){const steps=L.pats[L.ev],st=steps[selStep];
return `<div class="grid8">${steps.map((s,i)=>`<button class="pad acid ${s.on?'on':''} ${s.a?'acc':''} ${s.s&&s.on?'sl':''} ${i===selStep&&!simple()?'sel':''} ${i%4===0?'beat':''}" data-s="${i}" data-astep="${i}" aria-label="Step ${i+1}">${s.on?nn(acidMidi(L,s.d)):''}</button>`).join('')}</div>
<div class="simp"><div class="meta" style="margin-bottom:8px">ready-made riffs · tap a step to switch a note on or off</div><div class="tools">${RIFFS.map(([n],i)=>`<button class="btn" data-act="riff" data-r="${i}">${n}</button>`).join('')}<button class="btn" data-act="rand">surprise me</button></div></div>
<div class="editor adv"><span class="lbl">step ${selStep+1}</span>
<div class="row">
<div class="stepper"><button class="btn" data-act="dn" aria-label="Note down">▼</button><b>${st.on?nn(acidMidi(L,st.d)):'—'}</b><button class="btn" data-act="up" aria-label="Note up">▲</button></div>
<button class="btn ${st.on?'on':''}" data-act="on">${st.on?'on':'off'}</button>
<button class="btn ${st.a?'on':''}" data-act="acc">accent</button>
<button class="btn ${st.s?'on':''}" data-act="slide">slide</button>
</div></div>
<div class="tools adv"><button class="btn" data-act="rand">randomise</button><button class="btn" data-act="left" aria-label="Shift pattern left">◀ shift</button><button class="btn" data-act="right" aria-label="Shift pattern right">shift ▶</button><button class="btn" data-act="clear">clear</button></div>
<div class="tools adv"><div class="seg" style="flex:1"><button class="${L.wave!=='square'?'on':''}" data-act="saw">saw</button><button class="${L.wave==='square'?'on':''}" data-act="sq">square</button></div>
<button class="btn ${L.oct?'on':''}" data-act="oct">octave up</button><button class="btn ${L.follow?'on':''}" data-act="follow">follow chords</button></div>`},
chords(L){const pt=L.pats[L.ev],sm=simple();
return `<div class="simp"><div class="meta" style="margin-bottom:8px">mood · this sets the key for the whole track</div><div class="choices two">${Object.entries(MOODS).map(([k,m])=>`<button class="choice cap ${L.mood===k?'on':''}" data-act="mood" data-m="${k}"><b>${k}</b><small>${m.d}</small></button>`).join('')}</div></div>
<div><div class="meta simp" style="margin-bottom:8px">style</div><div class="seg">${['pad','stab','arp','off'].map(m=>`<button class="${pt.mode===m?'on':''}" data-mode="${m}">${sm?MODEN[m]:m}</button>`).join('')}</div></div>
<div class="bars adv">${pt.prog.map((dg,i)=>`<div class="slot" data-bar="${i}"><label for="bar${i}">bar ${i+1}</label><select id="bar${i}" data-bsel="${i}">${[0,1,2,3,4,5,6].map(x=>{const ci=chordInfo(x,L);return`<option value="${x}" ${x===dg?'selected':''}>${ci.ro} · ${ci.name}</option>`}).join('')}</select></div>`).join('')}</div>
${pt.mode==='stab'?`<div><div class="meta" style="margin-bottom:8px">stab rhythm</div><div class="grid8">${pt.stab.map((v,i)=>`<button class="pad ${v?'on':''} ${i%4===0?'beat':''}" data-s="${i}" data-stab="${i}" aria-pressed="${!!v}" aria-label="Stab step ${i+1}">${i+1}</button>`).join('')}</div></div>`:''}
<div class="tools adv"><button class="btn ${L.ext?'on':''}" data-act="ext">add 7ths</button></div>`},
pads(L){const Pd=L.pads[selPad],ph=L.pats[L.ev],has=Pd.snd!=='user'||USER[Pd.sid];
return `<p class="meta simp" style="margin:0">Tap a pad to hear it. Tap steps below to make the selected pad play there.</p>
<div class="pp-grid">${L.pads.map((x,i)=>`<button class="pp ${(padSel||simple())&&i===selPad?'psel':''} ${x.snd==='user'&&!USER[x.sid]?'empty':''}" data-pp="${i}" style="--pc:${PCAT(x.snd)}" aria-label="Pad ${i+1}, ${esc(padName(L,i))}"><span>${esc(padName(L,i))}</span><small>${i+1}</small></button>`).join('')}</div>
<div class="tools simp"><button class="btn on" data-act="addsound" style="--tc:var(--hat)">+ add a sound</button><button class="btn ${rec?'on':''}" data-act="rec" style="--tc:var(--kick)">${rec?'● recording what you play':'● record what I play'}</button></div>
<div class="tools adv"><button class="btn ${rec?'on':''}" data-act="rec" style="--tc:var(--kick)">${rec?'● recording':'● rec'}</button><button class="btn ${padSel?'on':''}" data-act="sel">select pad</button><button class="btn" data-act="clrpad">clear pad ${selPad+1}</button><button class="btn" data-act="clrall">clear all</button></div>
<div><div class="meta" style="margin-bottom:8px">pad ${selPad+1} · ${esc(padName(L,selPad))}. Tap a step to place it.</div>
<div class="grid8">${ph.map((a,st)=>`<button class="pad ${a.includes(selPad)?'on':''} ${st%4===0?'beat':''}" data-s="${st}" data-ps="${st}" style="--tc:${PCAT(Pd.snd)}" aria-pressed="${a.includes(selPad)}" aria-label="Step ${st+1}">${a.length&&!a.includes(selPad)?'•'.repeat(Math.min(3,a.length)):st+1}</button>`).join('')}</div></div>
<div class="editor adv"><label class="lbl" for="padSnd">pad ${selPad+1} sound</label><div class="row" style="min-width:0"><select id="padSnd" style="max-width:100%">${PADS_DEF.map(([id,n])=>`<option value="${id}" ${Pd.snd===id?'selected':''}>${n}</option>`).join('')}<option value="user" ${Pd.snd==='user'?'selected':''}>${Pd.snd==='user'&&USER[Pd.sid]?'your sample: '+esc(Pd.name||''):'your sample (record one)'}</option></select></div></div>
<div class="tools adv"><button class="btn ${recState?'on':''}" data-act="mic" style="--tc:var(--kick)">${recState?'■ stop':'● sample mic'}</button><button class="btn" data-act="file">load a sound file</button><button class="btn" data-act="addsound">+ add a sound</button><input type="file" id="padFile" accept="audio/*" hidden></div>
<div class="status" id="padMsg" role="status">${has?'':'This pad is empty. Tap + add a sound to record or pick one.'}</div>`}
};
const KNOBS={
drums(L,i){if(simple())return[['volume',`layers.${i}.vol`,0,1,.01,pct]];const d=DR.find(x=>x.id===selTrack);return[[d.name.toLowerCase()+' level',`layers.${i}.dvol.${selTrack}`,0,1,.01,pct],[d.name.toLowerCase()+' tune',`layers.${i}.dtune.${selTrack}`,-12,12,1,stF],['layer level',`layers.${i}.vol`,0,1,.01,pct]]},
acid(L,i){if(simple())return[['brightness',`layers.${i}.cutoff`,0,1,.01,pct],['squelch',`layers.${i}.res`,0,1,.01,pct],['volume',`layers.${i}.vol`,0,1,.01,pct]];return[['cutoff',`layers.${i}.cutoff`,0,1,.01,pct],['resonance',`layers.${i}.res`,0,1,.01,pct],['env mod',`layers.${i}.env`,0,1,.01,pct],['decay',`layers.${i}.decay`,0,1,.01,pct],['drive',`layers.${i}.dist`,0,1,.01,pct],['level',`layers.${i}.vol`,0,1,.01,pct]]},
chords(L,i){return[['brightness',`layers.${i}.cutoff`,0,1,.01,pct],[simple()?'volume':'level',`layers.${i}.vol`,0,1,.01,pct]]},
pads(L,i){if(simple())return[['volume',`layers.${i}.vol`,0,1,.01,pct]];return[[`pad ${selPad+1} pitch`,`layers.${i}.pads.${selPad}.pitch`,-12,12,1,stF],[`pad ${selPad+1} level`,`layers.${i}.pads.${selPad}.vol`,0,1,.01,pct],['layer level',`layers.${i}.vol`,0,1,.01,pct]]}
};
function renderEdit(){
const L=CL(),i=LI(),p=$('#p-edit');p.style.setProperty('--tc',L.col);
p.innerHTML=`<div class="h"><button class="btn back" data-act="back">‹ all layers</button><span class="meta">${TNAME[L.type]}</span></div>
<div class="ehead"><input type="text" id="lname" maxlength="16" value="${esc(L.name)}" aria-label="Layer name"><div class="seg adv" role="group" aria-label="Pattern">${['main','alt'].map((n,v)=>`<button class="${L.ev===v?'on':''}" data-ev="${v}">${n}</button>`).join('')}</div></div>
<div class="tools"><button class="btn ${L.mute?'on':''}" data-act="mute" style="--tc:var(--hat)">${L.mute?'muted':'mute'}</button><button class="btn adv ${L.solo?'on':''}" data-act="solo" style="--tc:var(--signal)">solo</button><button class="btn adv" data-act="copyv">copy to ${L.ev?'main':'alt'}</button><button class="btn ${delArm===L.id?'on':''}" data-act="del" style="--tc:var(--kick)">${delArm===L.id?'tap again to delete':'delete layer'}</button></div>
${EDIT[L.type](L)}`;
sliders(p,KNOBS[L.type](L,i));
highlight();
}
const ECLICK={
drums(L,b,a){const pat=L.pats[L.ev][selTrack],hit=()=>{if(ctx&&!playing)VOICE[selTrack](ctx.currentTime+.01,L.dvol[selTrack],tune(L,selTrack),lnode(L))};
if(b.dataset.track){selTrack=b.dataset.track;hit()}
else if(b.dataset.pad){const i=+b.dataset.pad;pat[i]=pat[i]?0:1;if(pat[i])hit()}
else if(a==='dpat'){const np=emptyDrums(),k=b.dataset.p;if(k!=='clear')for(const [v,s] of Object.entries(DPAT[k]))np[v]=P(s);L.pats[L.ev]=np;if(!playing)start()}
else if(a==='vmute')L.dmute[selTrack]=!L.dmute[selTrack];
else if(a==='clear')pat.fill(0);
else if(a==='four')pat.forEach((_,i)=>pat[i]=i%4===0?1:0);
else if(a==='off')pat.forEach((_,i)=>pat[i]=i%4===2?1:0);
else return false},
acid(L,b,a){const pt=L.pats[L.ev],st=pt[selStep];
if(b.dataset.astep){const i=+b.dataset.astep,s=pt[i];if(simple())s.on=s.on?0:1;else if(i===selStep||!s.on){s.on=i===selStep&&s.on?0:1}selStep=i;if(s.on)preview(L,s.d)}
else if(a==='riff'){L.pats[L.ev]=acidFrom(RIFFS[+b.dataset.r][1]);L.follow=true;if(!playing)start()}
else if(a==='up'||a==='dn'){st.on=1;st.d=Math.max(-7,Math.min(14,st.d+(a==='up'?1:-1)));preview(L,st.d)}
else if(a==='on')st.on=st.on?0:1;
else if(a==='acc'){st.a=st.a?0:1;st.on=1}
else if(a==='slide'){st.s=st.s?0:1;st.on=1}
else if(a==='rand'){const pool=[0,0,0,0,7,3,5,-2,2,4,10,7];L.pats[L.ev]=pt.map((_,i)=>({on:Math.random()<(i%4===0?.85:.6)?1:0,d:pool[Math.floor(Math.random()*pool.length)],a:Math.random()<.25?1:0,s:Math.random()<.22?1:0}));if(!playing&&simple())start()}
else if(a==='left')pt.push(pt.shift());
else if(a==='right')pt.unshift(pt.pop());
else if(a==='clear')L.pats[L.ev]=blankAcid();
else if(a==='saw'||a==='sq'){L.wave=a==='sq'?'square':'saw';applyParams()}
else if(a==='oct')L.oct=L.oct?0:1;
else if(a==='follow')L.follow=!L.follow;
else return false;
updWheel()},
chords(L,b,a){const pt=L.pats[L.ev];
if(b.dataset.mode)pt.mode=b.dataset.mode;
else if(b.dataset.stab){const i=+b.dataset.stab;pt.stab[i]=pt.stab[i]?0:1}
else if(a==='mood'){const m=MOODS[b.dataset.m];S.scale=m.scale;pt.prog=[...m.prog];L.ext=m.ext;L.mood=b.dataset.m;paintKey();if(!playing)start()}
else if(a==='ext')L.ext=!L.ext;
else return false},
pads(L,b,a){const ph=L.pats[L.ev];
if(b.dataset.ps){const st=+b.dataset.ps,arr=ph[st],ix=arr.indexOf(selPad);if(ix<0){arr.push(selPad);if(ctx&&!playing)playPad(L,selPad,ctx.currentTime+.01)}else arr.splice(ix,1)}
else if(a==='rec')rec=!rec;
else if(a==='sel')padSel=!padSel;
else if(a==='clrpad')ph.forEach(arr=>{const ix=arr.indexOf(selPad);if(ix>=0)arr.splice(ix,1)});
else if(a==='clrall')ph.forEach(arr=>arr.length=0);
else if(a==='addsound'){openSheet({});return false}
else if(a==='mic'){capture(L,selPad);return false}
else if(a==='file'){const f=$('#padFile');if(f)f.click();return false}
else return false}
};
$('#p-edit').addEventListener('click',e=>{
const b=e.target.closest('button');if(!b||b.dataset.pp)return;const L=CL(),a=b.dataset.act;
if(a!=='del')delArm=null;
if(a==='back'){showTab('layers');return}
if(b.dataset.ev!=null){L.ev=+b.dataset.ev;save();renderEdit();renderChips();return}
if(a==='mute'||a==='solo'){L[a]=!L[a];applyParams();save();renderEdit();renderChips();return}
if(a==='copyv'){L.pats[L.ev?0:1]=clone(L.pats[L.ev]);save();renderEdit();return}
if(a==='del'){if(delArm!==L.id){delArm=L.id;renderEdit();return}deleteLayer(L);return}
if(ECLICK[L.type](L,b,a)!==false){save();renderEdit()}
});
$('#p-edit').addEventListener('change',e=>{const L=CL(),t=e.target;
if(t.dataset.bsel!=null){const pt=L.pats[L.ev];pt.prog[+t.dataset.bsel]=+t.value;save();
if(ctx&&!playing){const n=lnode(L),tt=ctx.currentTime+.01,cut=200*Math.pow(2,L.cutoff*6.5);chordNotes(+t.value,L).forEach(m=>voice(m,tt,.5,.07,.02,.6,cut,n.out))}}
else if(t.id==='padSnd'){L.pads[selPad].snd=t.value;save();renderEdit();if(ctx&&!playing)playPad(L,selPad,ctx.currentTime+.01)}
else if(t.id==='padFile')importFile(L,selPad,t.files&&t.files[0]);
});
$('#p-edit').addEventListener('input',e=>{if(e.target.id!=='lname')return;CL().name=e.target.value.trim()||TNAME[CL().type];save();renderChips()});
function hitPad(L,i){
if(!ctx)initAudio();if(ctx.state!=='running')ctx.resume();
const now=ctx.currentTime;playPad(L,i,now+.005);
const el=document.querySelector(`[data-pp="${i}"]`);if(el){el.classList.add('hit');setTimeout(()=>el.classList.remove('hit'),130)}
if(rec&&playing){let best=null,bd=1e9;for(const h of hist){const d=Math.abs(h.t-now);if(d<bd){bd=d;best=h}}
if(best&&bd<stepDur()*.75){const sec=S.mode==='song'?S.secs[best.si]:null;let v=layerVar(L,sec);if(v<0)v=L.ev;const arr=L.pats[v][best.s];
if(!arr.includes(i)){arr.push(i);save();if(v===L.ev&&i===selPad){const c=document.querySelector(`[data-ps="${best.s}"]`);if(c)c.classList.add('on')}}}}
}
$('#p-edit').addEventListener('pointerup',e=>{if(e.target.closest('[data-pp]'))haptic(10)});
$('#p-edit').addEventListener('pointerdown',e=>{const b=e.target.closest('[data-pp]');if(!b)return;e.preventDefault();const L=CL(),i=+b.dataset.pp;hitPad(L,i);if(padSel&&i!==selPad){selPad=i;renderEdit()}});
/* song: the arrangement grid */
function songLength(){const bars=S.secs.reduce((a,e)=>a+e.bars,0),sec=Math.round(bars*4*60/S.bpm);return{bars,time:`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`}}
let arrArm=false;
function renderSong(){
const p=$('#p-song'),old=p.querySelector('.agw'),sl=old?old.scrollLeft:0,L=songLength(),cs=S.secs[S.cs],sm=simple();
p.innerHTML=`<div class="h"><h2>song</h2><span class="meta">${L.bars} bars · ${L.time}</span></div>
<div><label class="meta" for="trkName" style="display:block;margin-bottom:5px">track name</label><input type="text" id="trkName" maxlength="28" value="${esc(S.name||'')}" placeholder="Untitled track"></div>
<div class="tools"><button class="btn on" data-act="arr" style="--tc:var(--chords)">${arrArm?'tap again: this replaces your sections':'✦ arrange it for me'}</button></div>
<div class="seg"><button class="${S.mode==='loop'?'on':''}" data-pm="loop">loop all layers</button><button class="${S.mode==='song'?'on':''}" data-pm="song">play song</button></div>
<div class="agw"><table class="agrid"><thead><tr><th class="ln"></th>${S.secs.map((s,i)=>`<th><button class="sech cap ${i===S.cs?'sel':''}" data-sec="${i}" data-col="${i}" aria-label="Section ${i+1}, ${esc(s.name)}${s.rise?', build-up':''}"><b>${i+1}${s.rise?' ↗':''}</b><small>${esc(s.name)}</small><small>${s.bars} bar${s.bars>1?'s':''}</small></button></th>`).join('')}${S.secs.length<MAXS?`<th><button class="sech cap addsec" data-act="addsec" aria-label="Add a section">+</button></th>`:''}</tr></thead>
<tbody>${S.layers.map(Ly=>`<tr><th class="ln" style="--c:${Ly.col}">${esc(Ly.name)}</th>${S.secs.map((s,i)=>{const o=s.on[Ly.id]|0,vc=sm&&o?1:o;return`<td><button class="cell v${vc}" data-cell="${Ly.id}" data-ci="${i}" data-col="${i}" style="--c:${Ly.col}" aria-label="${esc(Ly.name)} in section ${i+1}: ${sm?(o?'on':'off'):['off','main','alt'][o]}">${o===2&&!sm?'alt':''}</button></td>`}).join('')}</tr>`).join('')}</tbody></table></div>
<p class="meta" style="margin:0">${sm?'Your song plays left to right, one section after another. Tap a square to switch a layer on or off in that section. ↗ marks a build-up, where a filter slowly opens.':'Tap a cell to cycle a layer through off, main and alt for that section. Tap a section number to edit it. ↗ marks a filter rise.'} ${S.mode==='loop'?'Choose play song to hear the arrangement.':''}</p>
<div class="secbox"><div class="ehead"><input type="text" id="secName" maxlength="12" value="${esc(cs.name)}" aria-label="Section ${S.cs+1} name"><div class="stepper adv"><button class="ib" data-act="bars" data-dir="-1" aria-label="Shorter">−</button><b>${cs.bars} bar${cs.bars>1?'s':''}</b><button class="ib" data-act="bars" data-dir="1" aria-label="Longer">+</button></div></div>
<div class="tools"><button class="btn" data-act="playsec">▶ play from ${S.cs+1}</button><button class="btn adv ${cs.rise?'on':''}" data-act="rise" style="--tc:var(--chords)">↗ filter rise</button><button class="btn adv" data-act="mvl" ${S.cs===0?'disabled':''} aria-label="Move section earlier">◀ move</button><button class="btn adv" data-act="mvr" ${S.cs===S.secs.length-1?'disabled':''} aria-label="Move section later">move ▶</button><button class="btn adv" data-act="dupsec" ${S.secs.length>=MAXS?'disabled':''}>duplicate</button><button class="btn adv" data-act="delsec" ${S.secs.length<2?'disabled':''}>delete</button></div></div>
<div><div class="meta" style="margin-bottom:8px">export · saves the ${S.mode==='song'?'whole song':'loop, 4 bars'} as a WAV file</div>
<div class="tools"><button class="btn" data-act="wav">render ${S.mode==='song'?'song':'loop'} to wav</button>${EXP?`<a class="btn" href="${EXP.url}" download="${esc(EXP.name)}" style="display:inline-flex;align-items:center;text-decoration:none">save wav</a><button class="btn" data-act="share">share</button>`:''}</div>
<div class="status" id="expMsg" role="status">${EXP?`Ready: ${esc(EXP.name)}, ${EXP.secs} seconds, ${EXP.mb} MB.`:''}</div></div>`;
const w=p.querySelector('.agw');if(w)w.scrollLeft=sl;
highlight();
}
$('#p-song').addEventListener('click',e=>{
const b=e.target.closest('button');if(!b||b.disabled)return;const a=b.dataset.act;
if(a!=='arr')arrArm=false;
if(a==='wav'){exportWav();return}
if(a==='share'){shareExp();return}
if(a==='arr'){if(S.secs.length>1&&!arrArm){arrArm=true;renderSong();return}arrArm=false;if(playing)stop();autoArrange();save();renderSong();renderChips();start(0);return}
if(b.dataset.pm){S.mode=b.dataset.pm;secBar=0}
else if(b.dataset.cell){const i=+b.dataset.ci,s=S.secs[i],id=b.dataset.cell;s.on[id]=simple()?(s.on[id]?0:1):((s.on[id]|0)+1)%3;S.cs=i}
else if(b.dataset.sec!=null)S.cs=+b.dataset.sec;
else if(a==='addsec'){S.secs.push({name:'section',bars:4,on:{...S.secs[S.secs.length-1].on}});S.cs=S.secs.length-1}
else if(a==='bars'){const s=S.secs[S.cs],ix=BARS.indexOf(s.bars);s.bars=BARS[Math.max(0,Math.min(BARS.length-1,(ix<0?2:ix)+(+b.dataset.dir)))]}
else if(a==='rise'){const s=S.secs[S.cs];s.rise=!s.rise}
else if(a==='playsec'){S.mode='song';if(playing)jumpTo=S.cs;else start(S.cs)}
else if(a==='mvl'||a==='mvr'){const j=S.cs+(a==='mvl'?-1:1);[S.secs[S.cs],S.secs[j]]=[S.secs[j],S.secs[S.cs]];S.cs=j}
else if(a==='dupsec'){S.secs.splice(S.cs+1,0,clone(S.secs[S.cs]));S.cs++}
else if(a==='delsec'){S.secs.splice(S.cs,1);S.cs=Math.min(S.cs,S.secs.length-1);if(secIdx>=S.secs.length)secIdx=0}
else return;
save();renderSong();renderChips();
});
$('#p-song').addEventListener('input',e=>{const t=e.target;
if(t.id==='trkName'){S.name=t.value.trim();save()}
else if(t.id==='secName'){S.secs[S.cs].name=t.value.trim()||'section';save();const h=document.querySelector(`.sech[data-sec="${S.cs}"] small`);if(h)h.textContent=S.secs[S.cs].name}});
/* mix */
function renderMix(){
const p=$('#p-mix'),sm=simple();let slots='';
for(let i=1;i<=4;i++){let info='Empty';try{const r=localStorage.getItem(KEY+'.slot'+i);if(r){const o=JSON.parse(r);info=`${o.name?esc(o.name)+' · ':''}${o.bpm} bpm`}}catch(e){}
slots+=`<div class="slot"><span>slot ${i}<small>${info}</small></span><span class="tools"><button class="btn" data-load="${i}" ${info==='Empty'?'disabled':''}>load</button><button class="btn" data-save="${i}">save</button></span></div>`}
p.innerHTML=`<div class="h"><h2>mix</h2><button class="btn lvlb" data-act="lvl">${sm?'show advanced':'simple view'}</button></div>
<p class="meta simp" style="margin:0">Tempo is the speed. Space adds room and echo. Drag a knob up or down to turn it.</p>`;
sliders(p,[['tempo','bpm',90,160,1,v=>v+' bpm',()=>{$('#bpmVal').textContent=S.bpm;updWheel()}],[sm?'space':'reverb','fx.rev',0,1,.01,pct],[sm?'volume':'master','fx.master',0,1,.01,pct]]);
sliders(p,[['swing','swing',0,.6,.01,pct],['delay','fx.dly',0,1,.01,pct],['pump','fx.pump',0,1,.01,pct],['filter','fx.filter',0,1,.01,v=>v>.98?'open':pct(v)]]);
const ks=p.querySelectorAll('.knobs');ks[ks.length-1].classList.add('adv');
const tg=document.createElement('div');tg.className='tools';tg.innerHTML=`<button class="btn ${UI.snd?'on':''}" data-ui="snd">key sounds</button><button class="btn ${UI.hap?'on':''}" data-ui="hap">haptics</button>`;p.appendChild(tg);
const sw=document.createElement('div');sw.innerHTML=`<div class="meta" style="margin-bottom:8px">saved tracks on this device</div><div class="slots">${slots}</div><div class="status" id="status" role="status"></div>`;p.appendChild(sw);
}
$('#p-mix').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
if(b.dataset.act==='lvl'){setLvl(simple()?'adv':'simple');return}
if(b.dataset.ui){UI[b.dataset.ui]=UI[b.dataset.ui]?0:1;saveUI();renderMix();if(b.dataset.ui==='hap'&&UI.hap)haptic(20);return}
if(b.dataset.save){try{localStorage.setItem(KEY+'.slot'+b.dataset.save,JSON.stringify(S));renderMix();$('#status').textContent=`Saved to slot ${b.dataset.save}.`}catch(er){$('#status').textContent='This browser blocked saving. Your track is still loaded.'}}
else if(b.dataset.load){loadTrack('slot'+b.dataset.load);if(tab==='mix'){renderMix();$('#status').textContent=`Loaded slot ${b.dataset.load}.`}}
});
function paintKey(){$('#keyLbl').textContent=`${NOTE[S.root]} ${S.scale}`}
function renderPresets(){$('#presets').innerHTML=Object.entries(PRESETS).map(([k,p])=>`<button class="chip ${S.preset===k?'sel':''}" data-p="${k}">${p.name}</button>`).join('')}
$('#presets').addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(!b)return;loadTrack('demo:'+b.dataset.p)});
function bump(d){S.bpm=Math.max(90,Math.min(160,S.bpm+d));$('#bpmVal').textContent=S.bpm;applyParams();save();if(tab==='mix')renderMix();if(tab==='song')renderSong();updWheel()}
/* ---------- feel: key sounds, haptics, weighted data wheel ---------- */
let UI={snd:1,hap:1,lvl:'simple',lesson:0};try{const r=localStorage.getItem(KEY+'.ui');if(r)UI=Object.assign(UI,JSON.parse(r))}catch(e){}
const saveUI=()=>{try{localStorage.setItem(KEY+'.ui',JSON.stringify(UI))}catch(e){}};
let lastHap=0;
/* iOS has no vibrate(); toggling a native switch input gives a system tick (iOS 18+), but only
inside a real tap (click/touchend), never on touch-start, drag or animation frames. */
function haptic(ms){
if(!UI.hap)return;const now=performance.now();if(now-lastHap<22)return;lastHap=now;
try{if(navigator.vibrate){navigator.vibrate(ms);return}}catch(e){}
try{const l=document.createElement('label');l.setAttribute('aria-hidden','true');l.style.display='none';
const i=document.createElement('input');i.type='checkbox';i.setAttribute('switch','');l.appendChild(i);
document.head.appendChild(l);l.click();l.remove()}catch(e){}
}
function blip(t,f,dur,v,fEnd){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(f,t);if(fEnd)o.frequency.exponentialRampToValueAtTime(fEnd,t+dur);
g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.0015);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(N.ui);o.start(t);o.stop(t+dur+.02)}
function nzb(t,dur,type,f,qq,v){const n=noise(),b=bq(type,f,qq),g=gn(0);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
n.connect(b).connect(g).connect(N.ui);n.start(t,Math.random()*.5);n.stop(t+dur+.02)}
/* Tuned for phone speakers, which carry little below about 250 Hz: each sound pairs a short
pitched body (the "thump" you would feel) with a bright transient (the "click" you hear). */
const SND={
metal(t,a){blip(t,620,.028,.5*a,380);nzb(t,.008,'bandpass',4200,1.6,.5*a)},
rubber(t,a){blip(t,330,.06,.75*a,200);nzb(t,.018,'lowpass',1400,.7,.35*a)},
detent(t,a){blip(t,900,.016,.35*a,600);nzb(t,.006,'bandpass',5200,1.4,.45*a)},
knob(t,a){blip(t,1300,.01,.22*a);nzb(t,.004,'highpass',5600,.8,.3*a)},
stop(t,a){blip(t,260,.11,.8*a,150);nzb(t,.035,'lowpass',900,.7,.4*a)}
};
function uiSound(kind,a=1){
if(!UI.snd)return;
try{if(!ctx)initAudio();if(ctx.state!=='running')ctx.resume();if(!N.ui){N.ui=gn(.9);N.ui.connect(ctx.destination)}SND[kind](ctx.currentTime+.002,a)}catch(e){}
}
/* iOS only lets audio start from an activating event (touchend/click), so unlock there too */
['touchend','click','keydown'].forEach(ev=>document.addEventListener(ev,()=>{try{if(!ctx)initAudio();if(ctx.state!=='running')ctx.resume()}catch(e){}},{capture:true,passive:true}));
const RUB='.pad.on,.btn.on,.lchip,.chip.sel,.play,.cell.v1,.cell.v2,.ms.on,.tab[aria-selected="true"],.seg button.on,.hk';
document.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(!b||b.disabled||b.dataset.pp)return;uiSound(b.matches(RUB)?'rubber':'metal')},{passive:true});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||b.dataset.pp)return;haptic(b.matches(RUB)?14:7)},{capture:true,passive:true});
/* ---------- player home screen ---------- */
let view='home',hSel=0;
function trackList(){
const L=[{id:'cur',name:S.name||(PRESETS[S.preset]||{}).name||'Untitled track',tag:`loaded ${S.bpm}`}];
const peek=k=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):null}catch(e){return null}};
const pv=peek(KEY+'.prev');if(pv)L.push({id:'prev',name:pv.name||'Last edit',tag:`last ${pv.bpm}`});
for(let i=1;i<=4;i++){const o=peek(KEY+'.slot'+i);if(o)L.push({id:'slot'+i,name:o.name||`Slot ${i}`,tag:`slot${i} ${o.bpm}`})}
Object.entries(PRESETS).forEach(([k,p])=>L.push({id:'demo:'+k,name:p.name,tag:`demo ${p.bpm}`}));
L.push({id:'new',name:'+ new track',tag:'blank'});
return L;
}
function loadTrack(id){
if(id==='cur')return;
let o=null;
try{if(id==='prev')o=JSON.parse(localStorage.getItem(KEY+'.prev'));else if(id.startsWith('slot'))o=JSON.parse(localStorage.getItem(KEY+'.'+id))}catch(e){}
if(id.startsWith('demo:'))o=build(id.slice(5));
if(id==='new')o=blank();
o=load(o);if(!o)return;
try{localStorage.setItem(KEY+'.prev',JSON.stringify(S))}catch(e){}
const was=playing;if(was)stop();
S=o;selStep=0;selPad=0;delArm=null;applyParams();save();
if(id==='new')tab='layers';else if(tab==='edit')tab='layers';
renderAll();hSel=0;if(ctx)loadUserSamples();
if(was)start();
}
const fmtT=sec=>`${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,'0')}`;
function songPos(){
const barSec=4*60/S.bpm;
if(S.mode==='song'){const total=S.secs.reduce((a,e)=>a+e.bars,0)*barSec;if(!playing||cur.s<0)return[0,total];
let bars=0;for(let i=0;i<cur.i&&i<S.secs.length;i++)bars+=S.secs[i].bars;return[(bars+cur.b+cur.s/16)*barSec,total]}
const total=4*barSec;if(!playing||cur.s<0)return[0,total];return[((cur.b%4)+cur.s/16)*barSec,total];
}
function homeProgress(){const [el,tt]=songPos();$('#hTime').textContent=fmtT(el);$('#hTotal').textContent=fmtT(tt);$('#hBar').style.width=(tt?Math.min(100,el/tt*100):0)+'%'}
function renderHome(){
const L=trackList();if(hSel>=L.length)hSel=0;const t=L[hSel],isCur=t.id==='cur',nl=S.layers.length;
$('#hTitle').textContent=L[0].name;
$('#hKey').textContent=`${NOTE[S.root]} ${S.scale} · ${S.bpm} bpm`;
$('#hSub').textContent=isCur?`${nl} layer${nl>1?'s':''} · `+(S.mode==='song'?`${S.secs.length} sections · ${S.secs.reduce((a,e)=>a+e.bars,0)} bars`:'looping'):t.id==='new'?'next: a blank track with just a kick · press compose':`next: ${t.name} · press play to load`;
$('#hState').textContent=playing?'playing':'ready';
$('#hList').innerHTML=L.map((x,i)=>`<button class="trk ${i===hSel?'tsel':''}" data-tr="${i}" role="option" aria-selected="${i===hSel}"><i>${x.id==='cur'?(playing?'▶':'●'):''}</i><b>${esc(x.name)}</b><small>${esc(x.tag)}</small></button>`).join('');
const sel=$('#hList').querySelector('.tsel'),box=$('#hList');if(sel){const top=sel.offsetTop-box.offsetTop;if(top<box.scrollTop+4||top+sel.offsetHeight>box.scrollTop+box.clientHeight-4)box.scrollTop=Math.max(0,top-box.clientHeight/2+sel.offsetHeight/2)}
homeProgress();
}
function setView(v){
if(!['home','learn','compose'].includes(v))v='home';
view=v;document.documentElement.dataset.view=v;$('#homeView').hidden=v!=='home';$('#learnView').hidden=v!=='learn';$('#composeView').hidden=v!=='compose';
document.querySelectorAll('.vsw [data-v]').forEach(b=>b.setAttribute('aria-selected',b.dataset.v===v));
try{localStorage.setItem(KEY+'.view',v)}catch(e){}
if(v==='home'){hSel=0;renderHome()}else if(v==='learn')renderLearn();else showTab(tab);
updWheel();window.scrollTo(0,0);
}
$('#hList').addEventListener('click',e=>{const b=e.target.closest('[data-tr]');if(!b)return;const i=+b.dataset.tr,t=trackList()[i];
if(i===hSel&&i!==0){if(t.id==='new'){loadTrack('new');setView('compose');return}loadTrack(t.id);if(!playing)start();renderHome();return}hSel=i;renderHome();updWheel()});
$('#hPlay').addEventListener('click',()=>{const t=trackList()[hSel];if(t&&t.id==='new'){loadTrack('new');setView('compose');return}if(t&&t.id!=='cur'){loadTrack(t.id);if(!playing)start()}else{playing?stop():start()}renderHome()});
$('#hCompose').addEventListener('click',()=>{const t=trackList()[hSel];if(t&&t.id!=='cur')loadTrack(t.id);setView('compose')});
document.querySelector('.vsw').addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(b&&b.dataset.v!==view)setView(b.dataset.v)});
let lastPrev=0;
function wheelTarget(){
if(view==='home'){const L=trackList();return{name:'track',val:(L[hSel]||{}).name||'',step(d){const n=Math.max(0,Math.min(L.length-1,hSel+d));if(n===hSel)return false;hSel=n;renderHome();return true}}}
const L=CL();
if(tab==='edit'&&L.type==='acid'){const st=L.pats[L.ev][selStep];return{name:`note · step ${selStep+1}`,val:st.on?nn(acidMidi(L,st.d)):'off',
step(d){const b=st.d,wasOn=st.on;st.on=1;st.d=Math.max(-7,Math.min(14,st.d+d));const now=performance.now();if(now-lastPrev>60){lastPrev=now;preview(L,st.d)}save();renderEdit();return st.d!==b||!wasOn}}}
return{name:'tempo',val:S.bpm+' bpm',step(d){const b=S.bpm;bump(d);return S.bpm!==b}};
}
function updWheel(){const t=wheelTarget();$('#wName').textContent=t.name;$('#wVal').textContent=t.val;$('#wheel').setAttribute('aria-valuetext',t.name+' '+t.val)}
function setupWheel(w,drum){
const DET=14,FRICTION=.945;
let dragging=false,lastX=0,lastT=0,vel=0,acc=0,off=0,raf=null;
const stopAnim=()=>{if(raf){cancelAnimationFrame(raf);raf=null}};
const tick=d=>{const moved=wheelTarget().step(d);updWheel();
if(!moved){if(!dragging){stopAnim();vel=0}uiSound('stop',.8);haptic(25);return false}
const sp=Math.min(1,Math.abs(vel)/1.6);uiSound('detent',.55+sp*.45);haptic(4);return true};
const spin=dx=>{off+=dx;drum.style.backgroundPositionX=off+'px';acc+=dx;
while(acc>=DET){acc-=DET;if(!tick(1)){acc=0;return}}
while(acc<=-DET){acc+=DET;if(!tick(-1)){acc=0;return}}};
const settle=()=>{ // ease into the nearest detent, like a sprung ball bearing
const rem=Math.abs(acc)>DET/2?Math.sign(acc)*DET-acc:-acc;if(Math.abs(rem)<.5){acc=0;return}
let done=0,t0=performance.now();const dur=140;
const f=now=>{const k=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-k,3),want=rem*e;spin(want-done);done=want;
if(k<1)raf=requestAnimationFrame(f);else{raf=null;acc=Math.abs(acc)<1?0:acc}};
raf=requestAnimationFrame(f)};
const fling=()=>{let t0=performance.now();
const f=now=>{const dt=Math.min(40,now-t0);t0=now;vel*=Math.pow(FRICTION,dt/16.7);
if(Math.abs(vel)<.035){raf=null;vel=0;settle();return}
spin(vel*dt);if(raf!==null)raf=requestAnimationFrame(f)};
raf=requestAnimationFrame(f)};
w.addEventListener('pointerdown',e=>{stopAnim();w.setPointerCapture(e.pointerId);dragging=true;lastX=e.clientX;lastT=e.timeStamp;vel=0;e.preventDefault();uiSound('knob');haptic(6)});
w.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX,dt=Math.max(1,e.timeStamp-lastT);
vel=vel*.55+(dx/dt)*.45;lastX=e.clientX;lastT=e.timeStamp;spin(dx)});
const end=e=>{if(!dragging)return;dragging=false;haptic(8);if(e.timeStamp-lastT>70)vel=0;vel*=.85;
if(Math.abs(vel)>.12)fling();else settle()};
w.addEventListener('pointerup',end);w.addEventListener('pointercancel',end);
w.addEventListener('keydown',e=>{const m={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1}[e.key];if(m){e.preventDefault();stopAnim();vel=0;spin(m*DET)}});
}
setupWheel($('#wheel'),$('#drum'));setupWheel($('#wheel2'),$('#drum2'));
/* ---------- + add a sound: first choose the sound, then where it plays ---------- */
const SHVOX=[['v:ooh','Ooh'],['v:ah','Ah'],['v:oh','Oh'],['v:ee','Ee'],['v:hey','Hey!'],['v:yeah','Yeah'],['v:ohoh','Oh-oh'],['v:choir','Choir'],['fx:stab','Chord stab'],['fx:riser','Riser']];
const WHERE=[['bar','once a bar','on the first beat: a big, clear statement',[0]],['beat','on every beat','with the kick: steady and hypnotic',[0,4,8,12]],['off','between the beats','with the hi-hats: bouncy',[2,6,10,14]],['drop','only in the drop','twice a bar, saved for the big moment',[0,8]],['tap','I will tap it in','play it live on a pad while the beat runs',[]]];
let SH=null;
function openSheet(o){
SH=Object.assign({step:'src',snd:null,sid:null,pitch:0,fine:0,name:'',note:'',msg:'',from:'src',lesson:false,rec:null},o);
if(S.layers.length>=MAXL)SH.step='full';
$('#sheet').hidden=false;renderSheet();
}
function closeSheet(){if(SH&&SH.rec)SH.rec.cancel();SH=null;$('#sheet').hidden=true}
function renderSheet(){
if(!SH)return;const c=$('#sheetCard');let h='';
const head=(t,back)=>`<div class="h">${back?`<button class="btn back" data-sh="back" data-to="${back}">‹ back</button>`:'<span class="meta">add a sound</span>'}<button class="btn back" data-sh="close" aria-label="Close">✕ close</button></div><h3 class="sh-t">${t}</h3>`;
if(SH.step==='full')h=head('No room for another layer')+`<p class="meta" style="margin:0">A track can have ${MAXL} layers. Delete one on the layers page, then add your sound.</p>`;
else if(SH.step==='src')h=head('Step 1 · choose a sound')+`<div class="choices">
<button class="choice" data-sh="rec" style="--c:var(--kick)"><b>record my voice</b><small>sing, hum, clap or say a word</small></button>
<button class="choice" data-sh="vox" style="--c:var(--chords)"><b>a ready-made vocal</b><small>ooh, hey, a choir and more</small></button>
<button class="choice" data-sh="file" style="--c:var(--perc)"><b>a sound file</b><small>a WAV, MP3 or M4A on this device</small></button></div><input type="file" id="shFile" accept="audio/*" hidden>`;
else if(SH.step==='vox')h=head('Step 1 · choose a vocal','src')+`<p class="meta" style="margin:0">Tap one to hear it. They are already in your key.</p><div class="choices three">${SHVOX.map(([id,n])=>`<button class="choice ${SH.snd===id?'on':''}" data-sh="pick" data-v="${id}" style="--c:var(--chords)"><b>${n}</b></button>`).join('')}</div>
<div class="tools"><button class="btn on" data-sh="next" ${SH.snd?'':'disabled'} style="--tc:var(--signal)">use this ▸</button></div>`;
else if(SH.step==='rec')h=head('Step 1 · record','src')+`<p class="meta" style="margin:0">Sing, hum, clap or say a word. Short is best: under 2 seconds makes the strongest hook. The music pauses while you record, and recording stops by itself after 4 seconds.</p>
<button class="recbtn ${SH.rec?'on':''}" data-sh="recgo">${SH.rec?'■ stop':'● record'}</button><div class="recbar" aria-hidden="true"><i id="recBar"></i></div>`;
else if(SH.step==='review')h=head('Your sound','src')+`<p class="meta" style="margin:0">${esc(SH.note)}</p><div class="tools"><button class="btn" data-sh="hear">▶ hear it</button><button class="btn" data-sh="again">record again</button><button class="btn on" data-sh="next" style="--tc:var(--signal)">use this ▸</button></div>`;
else if(SH.step==='where')h=head('Step 2 · where should it play?',SH.from)+`<div class="choices">${WHERE.filter(w=>!(SH.lesson&&w[0]==='tap')).map(([k,n,d])=>`<button class="choice" data-sh="where" data-w="${k}" style="--c:var(--signal)"><b>${n}</b><small>${d}</small></button>`).join('')}</div>`;
h+=`<div class="status" id="shMsg" role="status">${esc(SH.msg||'')}</div>`;
c.innerHTML=h;
}
async function audition(){
if(!SH||!SH.snd)return;if(!ctx)initAudio();if(ctx.state!=='running')ctx.resume();await BUILT;if(!SH)return;
const buf=SH.snd==='user'?USER[SH.sid]:BUF[SH.snd];if(!buf)return;
const keyed=SH.snd.startsWith('v:')||SH.snd==='fx:stab',sh=keyed?(((S.root+6)%12)-6):0;
const s=ctx.createBufferSource();s.buffer=buf;const rt=Math.pow(2,((+SH.pitch||0)+(+SH.fine||0)+sh)/12);s.playbackRate.value=isFinite(rt)?rt:1;
const g=gn(.8);s.connect(g).connect(N.mfilt);s.start(ctx.currentTime+.01);
}
/* pitch: normalised autocorrelation over short frames, then the median, so one bad frame cannot win */
function detectPitch(d,sr){
const x=new Float32Array(d.length>>1);for(let i=0;i<x.length;i++)x[i]=(d[2*i]+d[2*i+1])*.5;
const fs=sr/2,W=1024,minL=Math.floor(fs/1000),maxL=Math.ceil(fs/70),F=W+maxL+2,len=Math.min(x.length,Math.floor(fs*2));
if(len<F)return null;
let gr=0;for(let i=0;i<len;i++)gr=Math.max(gr,Math.abs(x[i]));
const n=24,hop=Math.max(1,Math.floor((len-F)/n)),res=[],r=new Float32Array(maxL+2);
for(let f=0;f<=n;f++){const o=f*hop;if(o+F>len)break;
let e0=0;for(let i=0;i<W;i++)e0+=x[o+i]*x[o+i];if(Math.sqrt(e0/W)<gr*.06)continue;
let eL=0;for(let i=0;i<W;i++)eL+=x[o+minL+i]*x[o+minL+i];
let best=0;
for(let L=minL;L<=maxL+1;L++){let s=0;for(let i=0;i<W;i++)s+=x[o+i]*x[o+i+L];r[L]=eL>1e-9?s/Math.sqrt(e0*eL):0;if(L<=maxL&&r[L]>best)best=r[L];
eL=Math.max(0,eL+x[o+L+W]*x[o+L+W]-x[o+L]*x[o+L])}
if(best<.72)continue;
let L=minL+1;while(L<maxL&&r[L]<.9*best)L++;while(L<maxL&&r[L+1]>r[L])L++;
const a=r[L-1],b=r[L],c=r[L+1],den=a-2*b+c,lag=L+(den?(a-c)/(2*den):0);
const mm=69+12*Math.log2(fs/lag/440);if(isFinite(mm))res.push(mm)}
if(res.length<3)return null;
res.sort((p,q)=>p-q);return res[res.length>>1];
}
/* the smallest move that lands the sound on a note of the current scale, plus the fine correction */
function fitKey(m){
if(!isFinite(m))return{sh:0,fine:0,to:0};const r=Math.round(m),fine=+(r-m).toFixed(3),pc=((r-S.root)%12+12)%12,sc=SCALES[S.scale];
for(const sh of [0,1,-1,2,-2])if(sc.includes((pc+sh+12)%12))return{sh,fine,to:r+sh};
return{sh:0,fine,to:r};
}
async function processClip(buf,name){
if(!SH)return;
const d=trimNorm(buf);if(!d){SH.step='rec';SH.msg='That was silent. Try again a little closer to the microphone.';renderSheet();return}
const sr=buf.sampleRate,m=detectPitch(d,sr),secs=(d.length/sr).toFixed(1);
SH.pitch=0;SH.fine=0;
if(m!=null){const k=fitKey(m);SH.pitch=k.sh;SH.fine=k.fine;
SH.note=`Trimmed and levelled: ${secs} seconds. `+(k.sh?`It sang about ${nn(Math.round(m))}, so it moves ${Math.abs(k.sh)} semitone${Math.abs(k.sh)>1?'s':''} ${k.sh>0?'up':'down'} to ${nn(k.to)} to fit your key of ${NOTE[S.root]} ${S.scale}.`:`It sang about ${nn(k.to)}, which is already in your key of ${NOTE[S.root]} ${S.scale}, so it only gets a fine tune.`)}
else SH.note=`Trimmed and levelled: ${secs} seconds. There is no clear note in it, so it plays as recorded. That suits claps, words and beatbox.`;
const sid='s'+Date.now().toString(36),rr={sr,data:d,name};USER[sid]=toBuf(rr);
let kept=true;try{await IDB.put(sid,rr)}catch(e){kept=false}
if(!SH)return;
SH.snd='user';SH.sid=sid;SH.name=name;SH.step='review';SH.msg=kept?'':'This browser blocked saving sounds, so this one lasts until you close the page.';
renderSheet();audition();
}
async function sheetRec(){
if(!SH)return;if(SH.rec){SH.rec.stop();return}
const fail=t=>{if(!SH)return;SH.msg=t;renderSheet()};
if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return fail(window.isSecureContext===false?'The microphone only works on a secure (https) page.':'This browser window cannot use the microphone. If you opened the link inside another app, open khalifa.games/mu-s1k in Safari itself, or from your home-screen icon.');
if(!window.MediaRecorder)return fail('This browser cannot record audio. Update iOS, or use Safari.');
if(!ctx)initAudio();if(ctx.state!=='running')ctx.resume();
let stream;
try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}})}
catch(e){if(e&&e.name==='OverconstrainedError'){try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e2){return fail(micProblem(e2).replace('sample mic','record'))}}else return fail(micProblem(e).replace('sample mic','record'))}
if(!SH){stream.getTracks().forEach(t=>t.stop());return}
if(playing)stop();
try{if(navigator.audioSession)navigator.audioSession.type='play-and-record'}catch(e){}
let mr;try{mr=new MediaRecorder(stream)}catch(e){stream.getTracks().forEach(t=>t.stop());return fail('This browser cannot record audio.')}
const chunks=[];let to,cancelled=false;
mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
mr.onstop=async()=>{clearTimeout(to);stream.getTracks().forEach(t=>t.stop());try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
if(cancelled||!SH)return;SH.rec=null;SH.msg='Tidying up your sound…';renderSheet();
try{const buf=await ctx.decodeAudioData(await new Blob(chunks,{type:mr.mimeType||'audio/mp4'}).arrayBuffer());await processClip(buf,'my voice')}
catch(e){fail('That recording could not be read. Try again.')}};
SH.rec={stop:()=>{if(mr.state!=='inactive')mr.stop()},cancel:()=>{cancelled=true;clearTimeout(to);if(mr.state!=='inactive')mr.stop()}};
mr.start();SH.msg='Recording…';renderSheet();
const bar=$('#recBar');if(bar){void bar.offsetWidth;bar.style.transition='width 4s linear';bar.style.width='100%'}
to=setTimeout(()=>SH&&SH.rec&&SH.rec.stop(),4000);
}
function placeSound(w){
const W=WHERE.find(x=>x[0]===w);if(!W||!SH||!SH.snd)return;
const lesson=SH.lesson;
if(lesson&&S.learn&&S.learn.hook){const old=S.layers.find(x=>x.id===S.learn.hook);if(old){S.layers=S.layers.filter(x=>x!==old);S.secs.forEach(s=>delete s.on[old.id])}}
if(S.layers.length>=MAXL){SH.step='full';renderSheet();return}
const pads=defPads();pads[0]={snd:SH.snd,pitch:SH.pitch,fine:SH.fine,vol:.85};if(SH.snd==='user'){pads[0].sid=SH.sid;pads[0].name=SH.name}
const ph=blankPh();W[3].forEach(s=>ph[s].push(0));
const nm=(SH.snd==='user'?SH.name:SND_NAME[SH.snd]||'sound').toLowerCase().replace(/!/g,'').slice(0,16);
const L=mkLayer('pads',{name:nm,vol:.85,pats:[ph,blankPh()],pads});L.where=w;uniq(L);S.layers.push(L);
const song=S.mode==='song'&&S.secs.length>1,hasDrop=S.secs.some(s=>/drop/i.test(s.name));
S.secs.forEach((s,i)=>{s.on[L.id]=!song?(i===S.cs?1:0):(w==='drop'&&hasDrop)?(/drop/i.test(s.name)?1:0):(/intro|outro/i.test(s.name)?0:1)});
closeSheet();applyParams();save();
if(lesson){S.learn.hook=L.id;save();renderLearn()}
else{if(w==='tap')rec=true;if(view!=='compose')setView('compose');openLayer(L.id);
padMsg(w==='tap'?'Tap pad 1 in time with the beat. Every tap is recorded into the pattern. Tap the record button to stop.':'Added. Tap pad 1 to hear it, or tap steps to move it.')}
if(!playing)start();
}
$('#sheet').addEventListener('click',e=>{
if(e.target.id==='sheet'){closeSheet();return}
const b=e.target.closest('[data-sh]');if(!b||b.disabled||!SH)return;const a=b.dataset.sh;SH.msg='';
if(a==='close'){closeSheet();return}
if(a==='back'){if(SH.rec){SH.rec.cancel();SH.rec=null}SH.step=b.dataset.to||'src';renderSheet();return}
if(a==='rec'||a==='again'){SH.step='rec';renderSheet();return}
if(a==='vox'){if(SH.snd==='user')SH.snd=null;SH.pitch=0;SH.fine=0;SH.step='vox';renderSheet();return}
if(a==='file'){const f=$('#shFile');if(f)f.click();return}
if(a==='pick'){SH.snd=b.dataset.v;SH.pitch=0;SH.fine=0;SH.name=SND_NAME[SH.snd]||'';audition();renderSheet();return}
if(a==='recgo'){sheetRec();return}
if(a==='hear'){audition();return}
if(a==='next'){SH.from=SH.step;SH.step='where';renderSheet();return}
if(a==='where')placeSound(b.dataset.w);
});
$('#sheet').addEventListener('change',async e=>{if(e.target.id!=='shFile'||!SH)return;const f=e.target.files&&e.target.files[0];if(!f)return;
if(!ctx)initAudio();SH.msg='Reading the file…';renderSheet();
try{const buf=await ctx.decodeAudioData(await f.arrayBuffer());await processClip(buf,f.name.replace(/\.[^.]+$/,'').slice(0,16))}
catch(er){if(SH){SH.msg='That file could not be read. Try a WAV, MP3 or M4A.';renderSheet()}}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&SH)closeSheet()});
/* ---------- arrange it for me: the classic intro, build, drop, break, build, drop ---------- */
function autoArrange(){
const first=S.layers.find(L=>L.type==='drums');
if(first){const a=first.pats[1];if(DR.every(d=>!a[d.id].some(Boolean))){const al=clone(first.pats[0]);al.kick=Z();al.clap=P('....x.......x.xx');first.pats[1]=al}}
const plan=[['intro',4,0],['build',4,1],['drop',8,2],['break',4,3],['build',2,1],['drop',8,2]];
const role=L=>L===first?[1,2,1,0]:L.type==='drums'?[1,1,1,0]:L.type==='acid'?[0,0,1,0]:L.type==='chords'?[0,1,1,1]:L.where==='drop'?[0,0,1,0]:[0,0,1,1];
S.secs=plan.map(([name,bars,k])=>({name,bars,rise:name==='build',on:Object.fromEntries(S.layers.map(L=>[L.id,role(L)[k]]))}));
S.mode='song';S.cs=0;secBar=0;secIdx=0;jumpTo=null;
}
/* ---------- learn: seven lessons that build one real track ---------- */
const LESSONS=[
{k:'kick',t:'The kick',sub:'the heartbeat',tg:[0,4,8,12],
txt:'Almost all dance music sits on a kick drum on every beat. The 16 squares below are one bar: 4 beats, each split into 4 steps. Tap the four dashed squares, 1, 5, 9 and 13.',
why:'A kick on every beat is called four to the floor. It is the pulse your body locks onto, and it is why house and techno feel like they never stop.'},
{k:'clap',t:'The clap',sub:'the backbeat',tg:[4,12],
txt:'Now a clap on beats 2 and 4. That is steps 5 and 13. Watch how it sits between the kicks in the rows above.',
why:'Boom, clap, boom, clap. Putting weight on beats 2 and 4 is called the backbeat. It is the part that makes you nod your head.'},
{k:'hat',t:'The hi-hats',sub:'the groove',tg:[2,6,10,14],
txt:'Put a hi-hat in each gap between the kicks: steps 3, 7, 11 and 15.',
why:'Hats halfway between the beats are called off-beats. They pull against the kick and give house its tss, tss bounce. That is a complete beat: kick, clap, hats.'},
{k:'bass',t:'The bassline',sub:'the low end',
txt:'A bassline fills the deep sound under the drums. Pick one to hear it. You can switch as often as you like.',
why:'A good bassline leaves room for the kick. The off-beat style plays in the gaps between kicks so the two never fight. It is the oldest trick in house.'},
{k:'chords',t:'Chords',sub:'the feeling',
txt:'Chords are a few notes played together, and they decide the mood. Pick one. Your bassline follows the chords automatically.',
why:'Each mood uses a different scale, the set of notes that sound right together. Minor and dreamy are the sound of emotional, late-night dance music.'},
{k:'hook',t:'The hook',sub:'the bit people remember',
txt:'A hook is a short sound that repeats: a sung ooh, a word, a hum. Record your own voice or pick a ready-made vocal. MU-S1K trims it, levels it and tunes it to your key.',
why:'Producers like Fred again.. and Bicep build whole tracks around one short vocal, repeated. Repetition is what turns a sound into a hook.'},
{k:'arr',t:'Arrange it',sub:'the journey',
txt:'So far you have one loop. A track takes the listener on a journey: a quiet intro, a build-up, the drop where everything comes in, a breakdown, then a second drop. Tap arrange it for me, then listen from the start.',
why:'Taking things away is as powerful as adding them. The drop hits hard because the build-up before it left out the kick and the bass while a filter slowly opened.'}];
const LCOL=['var(--kick)','var(--clap)','var(--hat)','var(--perc)','var(--chords)','var(--mix)','var(--signal)'];
const BASSES=[['off-beat','bouncy, in the gaps between kicks',[[2,0,0,0],[6,0,0,0],[10,0,0,0],[14,0,0,0]],{wave:'square',cutoff:.16,res:.12,env:.2,decay:.35,dist:.08}],
['rolling','driving, a note on most steps',[[0,0,0,0],[2,0,0,0],[3,0,0,0],[6,0,0,0],[8,0,0,0],[10,0,0,0],[11,0,0,0],[14,0,0,0]],{wave:'square',cutoff:.14,res:.1,env:.25,decay:.3,dist:.1}],
['acid','squelchy and wild: the 303 sound',[[0,0,1,0],[3,0,0,0],[6,7,0,1],[8,0,0,0],[11,3,1,0],[14,0,0,0]],{wave:'saw',cutoff:.3,res:.7,env:.55,decay:.4,dist:.35}]];
let lMenu=false;
const lDrums=()=>{let L=S.layers.find(x=>x.id===S.learn.drums)||S.layers.find(x=>x.type==='drums');
if(!L){L=mkLayer('drums',{name:'drums',vol:.9});S.layers.unshift(L);S.secs.forEach(s=>s.on[L.id]=1);applyParams()}S.learn.drums=L.id;return L};
function lessonDone(i){
if(!S.learn)return false;const ls=LESSONS[i];if(!ls)return false;
if(ls.tg){const L=S.layers.find(x=>x.id===S.learn.drums);return !!L&&ls.tg.every(j=>L.pats[0][ls.k][j])}
if(ls.k==='bass')return S.layers.some(x=>x.id===S.learn.bass);
if(ls.k==='chords')return S.layers.some(x=>x.id===S.learn.chords&&x.mood);
if(ls.k==='hook')return S.layers.some(x=>x.id===S.learn.hook);
return !!S.learn.arr;
}
function startLessons(){
const dr=mkLayer('drums',{name:'drums',vol:.9});
const o=norm({v:3,preset:null,name:'My first track',bpm:124,swing:.08,root:9,scale:'minor',fx:{rev:.38,dly:.28,pump:.45,filter:1,master:.82},layers:[dr],secs:[{name:'loop',bars:4,on:{[dr.id]:1}}],mode:'loop',sel:dr.id,cs:0,lesson:true,learn:{drums:dr.id}});
try{localStorage.setItem(KEY+'.prev',JSON.stringify(S))}catch(e){}
if(playing)stop();
S=o;selStep=0;selPad=0;delArm=null;tab='layers';applyParams();save();
UI.lesson=0;saveUI();lMenu=false;renderAll();renderLearn();
}
function lessonBass(j){
const B=BASSES[j];let L=S.layers.find(x=>x.id===S.learn.bass);
if(!L){L=mkLayer('acid',{name:'bass',vol:.7});uniq(L);S.layers.push(L);S.secs.forEach(s=>s.on[L.id]=1);S.learn.bass=L.id}
L.pats[0]=acidFrom(B[2]);Object.assign(L,B[3],{follow:true,oct:0});L.vol=j===2?.5:.7;S.learn.bk=j;
applyParams();save();if(!playing)start();
}
function lessonChords(m){
const M=MOODS[m];let L=S.layers.find(x=>x.id===S.learn.chords);
if(!L){L=mkLayer('chords',{name:'chords',vol:.7});uniq(L);S.layers.push(L);S.secs.forEach(s=>s.on[L.id]=1);S.learn.chords=L.id}
S.scale=M.scale;L.pats.forEach(pt=>pt.prog=[...M.prog]);L.ext=M.ext;L.mood=m;
applyParams();save();paintKey();if(!playing)start();
}
function lessonAuto(i){
const ls=LESSONS[i];
if(ls.tg){const L=lDrums();ls.tg.forEach(j=>L.pats[0][ls.k][j]=1);save();if(!playing)start()}
else if(ls.k==='bass')lessonBass(0);
else if(ls.k==='chords')lessonChords('dreamy');
else if(ls.k==='hook'){SH={snd:'v:ooh',pitch:0,fine:0,name:'Ooh',lesson:true};placeSound('bar');return}
else lessonArr();
renderLearn();
}
function lessonArr(){if(playing)stop();autoArrange();S.learn.arr=true;save();start(0)}
function arrMini(){return`<div class="amini">${S.secs.map((s,i)=>`<div class="asec" data-col="${i}" style="flex:${s.bars}"><b>${esc(s.name)}${s.rise?' ↗':''}</b><small>${s.bars} bars</small></div>`).join('')}</div>`}
const lscreen=(top,title,sub)=>`<div class="bezel pocketed"><div class="screen lscreen"><div class="scr-top"><span>${top}</span><span>${NOTE[S.root]} ${S.scale} · ${S.bpm} bpm</span></div><div class="h-title">${title}</div><div class="h-sub">${sub}</div></div></div>`;
const lplay=()=>`<div class="lplayrow"><button class="play cap lplay ${playing?'on':''}" id="lPlay" data-l="play" aria-label="${playing?'Stop':'Play'}"><svg viewBox="0 0 24 24"><path id="lIcon" d="${playing?'M6 6h12v12H6z':'M7 4.5v15l13-7.5z'}"/></svg></button><span class="meta" id="lPlayT">${playing?'playing · tap to stop':'tap to hear your track'}</span></div>`;
function lessonBody(i){
const ls=LESSONS[i];
if(ls.tg){const L=lDrums(),k=ls.k,pat=L.pats[0][k];
return`<div class="ov lov">${DR.slice(0,3).map(t=>`<div class="ovrow ${t.id===k?'sel':''}" style="--c:var(--${t.id})"><span>${t.name}</span><span class="dots">${L.pats[0][t.id].map((v,j)=>`<i class="dot ${v?'on':''}" data-s="${j}"></i>`).join('')}</span></div>`).join('')}</div>
<div class="grid8" style="--tc:var(--${k})">${pat.map((v,j)=>`<button class="pad ${v?'on':''} ${j%4===0?'beat':''} ${ls.tg.includes(j)&&!v?'tgt':''}" data-l="step" data-i="${j}" data-s="${j}" aria-pressed="${!!v}" aria-label="${k} step ${j+1}">${j+1}</button>`).join('')}</div>`}
if(ls.k==='bass')return`<div class="choices">${BASSES.map(([n,d],j)=>`<button class="choice ${S.learn.bk===j&&lessonDone(i)?'on':''}" data-l="bass" data-i="${j}" style="--c:var(--perc)"><b>${n}</b><small>${d}</small></button>`).join('')}</div>`;
if(ls.k==='chords'){const C=S.layers.find(x=>x.id===S.learn.chords);
return`<div class="choices two">${Object.entries(MOODS).map(([k,m])=>`<button class="choice ${C&&C.mood===k?'on':''}" data-l="mood" data-m="${k}" style="--c:var(--chords)"><b>${k}</b><small>${m.d}</small></button>`).join('')}</div>
${C?`<div><div class="meta" style="margin-bottom:8px">style · how the chords are played</div><div class="seg">${['pad','stab','arp'].map(m=>`<button class="${C.pats[0].mode===m?'on':''}" data-l="style" data-m="${m}">${MODEN[m]}</button>`).join('')}</div></div>`:''}`}
if(ls.k==='hook'){const H=S.layers.find(x=>x.id===S.learn.hook);
if(!H)return`<button class="addsnd cap" data-l="hook"><b>+ add a sound</b><small>record your voice, or pick a ready-made vocal</small></button>`;
const w=WHERE.find(x=>x[0]===H.where);
return`<div class="secbox"><b class="hk-n">${esc(H.name)}</b><span class="meta">plays ${w?w[1]:'in your pattern'}</span><div class="tools"><button class="btn" data-l="hookhear">▶ hear it alone</button><button class="btn" data-l="hook">change it</button></div></div>`}
return S.learn.arr?`${arrMini()}<div class="tools"><button class="btn" data-l="arr">play from the start</button></div>`:`<button class="addsnd cap" data-l="arr" style="--c:var(--signal)"><b>✦ arrange it for me</b><small>intro, build-up, drop, breakdown, build-up, drop</small></button>`;
}
function renderLearn(){
const v=$('#learnView');if(!v)return;const on=!!(S.lesson&&S.learn);let i=Math.max(0,UI.lesson|0);
if(!on||lMenu){
v.innerHTML=`${lscreen('learn','Make your first track','7 short steps · about 10 minutes')}<section class="panel learn" style="--tc:var(--acid)">
<div class="h"><h2>learn</h2><span class="meta">no music knowledge needed</span></div>
<p class="ltxt">You will build a dance track one layer at a time: drums first, then a bassline, chords, a vocal hook, and finally an arrangement with a build-up and a drop. Each step says why it works.</p>
<ol class="lsteps">${LESSONS.map((l,j)=>`<li class="${on&&lessonDone(j)?'ok':''}"><b>${l.t}</b> <span>${l.sub}</span></li>`).join('')}</ol>
<div class="tools">${on?`<button class="btn on" data-l="cont" style="--tc:var(--signal)">continue step ${Math.min(i+1,LESSONS.length)} ▸</button><button class="btn" data-l="start">start over</button>`:`<button class="btn on" data-l="start" style="--tc:var(--signal)">start step 1 ▸</button>`}</div>
<p class="meta" style="margin:0">${on?'Start over begins a new track.':'This starts a fresh track. Whatever you had open stays in the player as “last edit”.'}</p></section>`;
return}
if(i>=LESSONS.length){
v.innerHTML=`${lscreen('all 7 steps done','You made a track',`${S.layers.length} layers · ${songLength().time}`)}<section class="panel learn" style="--tc:var(--signal)">
<div class="ldots">${LESSONS.map(()=>'<i class="ok"></i>').join('')}</div>
<p class="ltxt">That is the recipe most dance tracks follow: a beat, a bassline, chords for the feeling, a hook to remember, and an arrangement that builds and drops.${S.learn.saved?` It is saved in slot ${S.learn.saved}.`:''}</p>
${lplay()}
<div class="why"><b>where to go next</b><p>Open it in compose to change anything: every layer you made is there. Tap show advanced when you want the full controls. Or listen to the demo Euphoric break to hear the same recipe stretched into a longer track.</p></div>
<div class="tools"><button class="btn on" data-l="compose" style="--tc:var(--signal)">open in compose</button><button class="btn" data-l="wav">save as a WAV</button><button class="btn" data-l="demo">hear Euphoric break</button><button class="btn" data-l="start">start again</button></div></section>`;
highlight();return}
const ls=LESSONS[i],done=lessonDone(i);
v.innerHTML=`${lscreen(`step ${i+1} of ${LESSONS.length}`,ls.t,ls.sub)}<section class="panel learn" style="--tc:${LCOL[i]}">
<div class="ldots">${LESSONS.map((_,j)=>`<i class="${lessonDone(j)?'ok':''} ${j===i?'cur':''}"></i>`).join('')}</div>
<p class="ltxt">${ls.txt}</p>
${lessonBody(i)}
${lplay()}
${done?`<div class="why"><b>✓ why it works</b><p>${ls.why}</p></div>`:''}
<div class="lnav"><button class="btn" data-l="prev">‹ ${i?'back':'menu'}</button>${done?'':`<button class="btn" data-l="auto">do it for me</button>`}<button class="btn ${done?'on':''}" data-l="next" ${done?'':'disabled'} style="--tc:var(--signal)">${i===LESSONS.length-1?'finish':'next'} ›</button></div></section>`;
highlight();
}
function saveLessonSlot(){
if(S.learn.saved)return;
for(let k=1;k<=4;k++){let r=null;try{r=localStorage.getItem(KEY+'.slot'+k)}catch(e){return}
if(!r){S.learn.saved=k;try{localStorage.setItem(KEY+'.slot'+k,JSON.stringify(S))}catch(e){S.learn.saved=0}save();return}}
}
$('#learnView').addEventListener('click',e=>{
const b=e.target.closest('[data-l]');if(!b||b.disabled)return;const a=b.dataset.l,i=Math.max(0,UI.lesson|0);
if(a==='start'){startLessons();return}
if(a==='cont'){lMenu=false;renderLearn();return}
if(a==='play'){playing?stop():start();return}
if(a==='prev'){if(i===0)lMenu=true;else UI.lesson=i-1;saveUI();renderLearn();window.scrollTo(0,0);return}
if(a==='next'){UI.lesson=i+1;if(UI.lesson>=LESSONS.length)saveLessonSlot();saveUI();renderLearn();window.scrollTo(0,0);return}
if(a==='auto'){lessonAuto(i);return}
if(a==='step'){const ls=LESSONS[i],L=lDrums(),pat=L.pats[0][ls.k],j=+b.dataset.i;pat[j]=pat[j]?0:1;save();
if(pat[j]&&!playing)start();renderLearn();return}
if(a==='bass'){lessonBass(+b.dataset.i);renderLearn();return}
if(a==='mood'){lessonChords(b.dataset.m);renderLearn();return}
if(a==='style'){const C=S.layers.find(x=>x.id===S.learn.chords);if(C){C.pats[0].mode=b.dataset.m;if(b.dataset.m==='stab'&&!C.pats[0].stab.some(Boolean))C.pats[0].stab=P('..x...x...x...x.');save()}renderLearn();return}
if(a==='hook'){openSheet({lesson:true});return}
if(a==='hookhear'){const H=S.layers.find(x=>x.id===S.learn.hook);if(H){if(!ctx)initAudio();if(ctx.state!=='running')ctx.resume();playPad(H,0,ctx.currentTime+.02)}return}
if(a==='arr'){lessonArr();renderLearn();return}
if(a==='compose'){setView('compose');showTab('song');return}
if(a==='wav'){setView('compose');showTab('song');exportWav();return}
if(a==='demo'){loadTrack('demo:glue');setView('home');if(!playing)start();return}
});
const PANELS={layers:renderLayers,edit:renderEdit,song:renderSong,mix:renderMix};
function showTab(t){if(!PANELS[t])t='layers';tab=t;const nav=t==='edit'?'layers':t;
document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===nav));
Object.keys(PANELS).forEach(x=>$('#p-'+x).hidden=x!==t);PANELS[t]();renderChips();updWheel();try{localStorage.setItem(KEY+'.tab',t)}catch(e){}}
document.querySelector('.tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)showTab(b.dataset.tab)});
function renderAll(){document.documentElement.classList.toggle('simple',UI.lvl!=='adv');paintKey();renderPresets();$('#bpmVal').textContent=S.bpm;showTab(tab)}
try{const t=localStorage.getItem(KEY+'.tab');if(t&&PANELS[t])tab=t}catch(e){}
renderAll();
try{setView(localStorage.getItem(KEY+'.view')||'home')}catch(e){setView('home')}
})();
