const PITCHES=["B4","A#4","A4","G#4","G4","F#4","F4","E4","D#4","D4","C#4","C4"];
const FREQ={C4:261.63,"C#4":277.18,D4:293.66,"D#4":311.13,E4:329.63,F4:349.23,"F#4":369.99,G4:392,"G#4":415.3,A4:440,"A#4":466.16,B4:493.88};
const SAMPLE_BANKS={
  fluteSample:[
    {root:"C4",url:"https://raw.githubusercontent.com/sgossner/VSCO-2-CE/440300901dfe9275fd84e0b7763af1f8443ae62e/Woodwinds/Flute/susNV/LDFlute_susNV_C4_v1_1.wav"},
    {root:"E4",url:"https://raw.githubusercontent.com/sgossner/VSCO-2-CE/440300901dfe9275fd84e0b7763af1f8443ae62e/Woodwinds/Flute/susNV/LDFlute_susNV_E4_v1_1.wav"},
    {root:"A4",url:"https://raw.githubusercontent.com/sgossner/VSCO-2-CE/440300901dfe9275fd84e0b7763af1f8443ae62e/Woodwinds/Flute/susNV/LDFlute_susNV_A4_v1_1.wav"}
  ],
  oboeSample:[
    {root:"D4",url:"https://raw.githubusercontent.com/sgossner/VSCO-2-CE/440300901dfe9275fd84e0b7763af1f8443ae62e/Woodwinds/Oboe/Sus/Oboe_Sus_D4_v1_Main.wav"},
    {root:"F4",url:"https://raw.githubusercontent.com/sgossner/VSCO-2-CE/440300901dfe9275fd84e0b7763af1f8443ae62e/Woodwinds/Oboe/Sus/Oboe_Sus_F4_v1_Main.wav"},
    {root:"A#4",url:"https://raw.githubusercontent.com/sgossner/VSCO-2-CE/440300901dfe9275fd84e0b7763af1f8443ae62e/Woodwinds/Oboe/Sus/Oboe_Sus_A%234_v1_Main.wav"}
  ]
};
const DRUM_SAMPLES={
  kick:"https://raw.githubusercontent.com/sfzinstruments/virtuosity_drums/9f04cf9a734527edfbb0a4eee1f674e45bbf71bc/Samples/oh/kick/oh_kick_snon_vl3_rr1.flac",
  snare:"https://raw.githubusercontent.com/sfzinstruments/virtuosity_drums/9f04cf9a734527edfbb0a4eee1f674e45bbf71bc/Samples/oh/snare/oh_snare_center_vl18.flac",
  tom:"https://raw.githubusercontent.com/sfzinstruments/virtuosity_drums/9f04cf9a734527edfbb0a4eee1f674e45bbf71bc/Samples/oh/htom/oh_htom_center_vl8.flac",
  closedHat:"https://raw.githubusercontent.com/sfzinstruments/virtuosity_drums/9f04cf9a734527edfbb0a4eee1f674e45bbf71bc/Samples/oh/hh/oh_hh_closed_vl3_rr1.flac",
  openHat:"https://raw.githubusercontent.com/sfzinstruments/virtuosity_drums/9f04cf9a734527edfbb0a4eee1f674e45bbf71bc/Samples/oh/hh/oh_hh_open_vl2_rr1.flac",
  crash:"https://raw.githubusercontent.com/sfzinstruments/virtuosity_drums/9f04cf9a734527edfbb0a4eee1f674e45bbf71bc/Samples/oh/crash/oh_crash_crash_vl2_rr1.flac"
};
const DRUM_MAP={
  C4:"kick","C#4":"kick",D4:"snare","D#4":"snare",E4:"tom",F4:"tom",
  "F#4":"closedHat",G4:"closedHat","G#4":"openHat",A4:"openHat","A#4":"crash",B4:"crash"
};
const DRUM_LABELS={
  C4:"Kick","C#4":"Kick+",D4:"Snare","D#4":"Snare+",E4:"Tom",F4:"Tom+",
  "F#4":"Closed hat",G4:"Closed hat+","G#4":"Open hat",A4:"Open hat+","A#4":"Crash",B4:"Crash+"
};
const NOTE_SEMITONES={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const sampleBuffers=new Map();
const sampleFailures=new Set();

const makeTrack=(name,instrument,volume)=>({name,instrument,volume,notes:Array.from({length:16},()=>Array(PITCHES.length).fill(false))});
let state={
  bpm:110, currentTrack:0, selection:[0,15], currentStep:0,
  tracks:[
    makeTrack("Lead","triangle",.62),
    makeTrack("Harmony","sine",.45),
    makeTrack("Bass","square",.38),
    makeTrack("Drums","drumsSample",.42)
  ]
};
let audioCtx=null, timer=null, playing=false, playStep=0, dragStart=null, generatedVariants=[];

const $=s=>document.querySelector(s);
const status=t=>$("#status").textContent=t;
function saveLocal(){localStorage.setItem("mbean1-project",JSON.stringify(state));}
function loadLocal(){
  try{
    const raw=localStorage.getItem("mbean1-project");
    if(raw){const p=JSON.parse(raw);if(p?.tracks?.length===4)state=p;}
  }catch{}
}
function renderTabs(){
  const el=$("#trackTabs");el.innerHTML="";
  state.tracks.forEach((t,i)=>{
    const b=document.createElement("button");
    b.className="track-tab"+(i===state.currentTrack?" active":"");
    b.textContent=`${i+1}. ${t.name}`;
    const meta=document.createElement("small");
    meta.textContent=t.instrument;
    b.appendChild(meta);
    b.onclick=()=>{state.currentTrack=i;generatedVariants=[];renderAll();};
    el.appendChild(b);
  });
}
function renderRoll(){
  const roll=$("#roll");roll.innerHTML="";
  const corner=document.createElement("div");roll.appendChild(corner);
  for(let s=0;s<16;s++){
    const d=document.createElement("div");
    d.className="step-label"+(s>=state.selection[0]&&s<=state.selection[1]?" selected":"");
    d.textContent=s+1;
    d.onmousedown=()=>{dragStart=s;state.selection=[s,s];renderAll();};
    d.onmouseenter=()=>{if(dragStart!==null){state.selection=[Math.min(dragStart,s),Math.max(dragStart,s)];renderAll();}};
    roll.appendChild(d);
  }
  PITCHES.forEach((p,pi)=>{
    const l=document.createElement("div");l.className="pitch-label";l.textContent=state.tracks[state.currentTrack].instrument==="drumsSample"?(DRUM_LABELS[p]||p):p;roll.appendChild(l);
    for(let s=0;s<16;s++){
      const c=document.createElement("div");
      const on=state.tracks[state.currentTrack].notes[s][pi];
      c.className="cell"+(on?" on":"")+(s>=state.selection[0]&&s<=state.selection[1]?" selected-region":"")+(playing&&s===playStep?" playing":"");
      c.onclick=()=>{state.tracks[state.currentTrack].notes[s][pi]=!on;state.currentStep=s;saveLocal();renderAll();};
      roll.appendChild(c);
    }
  });
  $("#selectionLabel").textContent=`Selection: steps ${state.selection[0]+1}–${state.selection[1]+1}`;
}
function renderControls(){
  const t=state.tracks[state.currentTrack];
  $("#instrumentSelect").value=t.instrument;$("#volumeInput").value=t.volume;$("#bpmInput").value=state.bpm;
}
function renderVariants(){
  const el=$("#variants");
  if(!generatedVariants.length){el.innerHTML='<p class="muted">Select a region, then generate variants.</p>';return;}
  el.innerHTML="";
  generatedVariants.forEach((notes,i)=>{
    const card=document.createElement("div");card.className="variant-card";
    const h=document.createElement("h3");h.textContent=["Gentle","Rhythmic","Stranger"][i]||`Variant ${i+1}`;card.appendChild(h);
    const mini=document.createElement("div");mini.className="mini-grid";
    for(let s=0;s<16;s++){
      const col=document.createElement("div");col.className="mini-col";
      notes[s].forEach((on,pi)=>{if(on){const n=document.createElement("span");n.className="mini-note";n.style.top=`${(pi/(PITCHES.length-1))*44}px`;col.appendChild(n);}});
      mini.appendChild(col);
    }
    card.appendChild(mini);
    const use=document.createElement("button");use.textContent="Use this";use.onclick=()=>{state.tracks[state.currentTrack].notes=notes.map(x=>[...x]);saveLocal();generatedVariants=[];renderAll();status("Variant applied.");};
    card.appendChild(use);el.appendChild(card);
  });
}
function renderAll(){renderTabs();renderControls();renderRoll();renderVariants();}
function ensureAudio(){
  if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==="suspended")audioCtx.resume();
  return audioCtx;
}
function noteToMidi(note){
  const m=/^([A-G])(#?)(-?\d+)$/.exec(note);
  if(!m)return 60;
  return (Number(m[3])+1)*12+NOTE_SEMITONES[m[1]]+(m[2]?1:0);
}
function nearestSample(bank,note){
  const target=noteToMidi(note);
  return bank.reduce((best,s)=>Math.abs(noteToMidi(s.root)-target)<Math.abs(noteToMidi(best.root)-target)?s:best,bank[0]);
}
async function loadSample(url){
  if(sampleBuffers.has(url))return sampleBuffers.get(url);
  if(sampleFailures.has(url))throw new Error("sample unavailable");
  try{
    const ctx=ensureAudio();
    const response=await fetch(url,{mode:"cors"});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const buffer=await ctx.decodeAudioData(await response.arrayBuffer());
    sampleBuffers.set(url,buffer);
    return buffer;
  }catch(err){
    sampleFailures.add(url);
    throw err;
  }
}
function sampleFor(instrument,note){
  if(instrument==="fluteSample"||instrument==="oboeSample"){
    const source=nearestSample(SAMPLE_BANKS[instrument],note);
    return {url:source.url,rate:Math.pow(2,(noteToMidi(note)-noteToMidi(source.root))/12),drum:false};
  }
  if(instrument==="drumsSample"){
    const key=DRUM_MAP[note]||"closedHat";
    return {url:DRUM_SAMPLES[key],rate:1,drum:true};
  }
  return null;
}
function oscillatorNote(freq,dur,vol,type){
  const ctx=ensureAudio(),now=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
  o.frequency.value=freq;o.type=type==="pluck"?"triangle":type;
  g.gain.setValueAtTime(type==="pluck"?vol*.9:vol,now);
  if(type==="pluck")g.gain.exponentialRampToValueAtTime(.001,now+Math.max(.05,dur*.55));
  else{g.gain.setValueAtTime(vol,now+dur*.75);g.gain.exponentialRampToValueAtTime(.001,now+dur);}
  o.connect(g);g.connect(ctx.destination);o.start(now);o.stop(now+dur+.03);
}
function playLoadedSample(spec,note,dur,vol){
  const buffer=sampleBuffers.get(spec.url);
  if(!buffer)return false;
  const ctx=ensureAudio(),now=ctx.currentTime,source=ctx.createBufferSource(),g=ctx.createGain();
  source.buffer=buffer;source.playbackRate.value=spec.rate;
  g.gain.setValueAtTime(Math.max(.001,vol*(spec.drum?1.8:2.2)),now);
  source.connect(g);g.connect(ctx.destination);
  source.start(now);
  if(spec.drum){
    g.gain.exponentialRampToValueAtTime(.001,now+Math.min(2.5,buffer.duration/spec.rate));
  }else{
    const end=Math.min(buffer.duration/spec.rate,Math.max(.08,dur*.95));
    g.gain.setValueAtTime(Math.max(.001,vol*2.2),now+Math.max(.01,end*.72));
    g.gain.exponentialRampToValueAtTime(.001,now+end);
    source.stop(now+end+.03);
  }
  return true;
}
function playVoice(note,dur,vol,instrument){
  const spec=sampleFor(instrument,note);
  if(spec&&playLoadedSample(spec,note,dur,vol))return;
  oscillatorNote(FREQ[note],dur,vol,instrument==="drumsSample"?"triangle":instrument);
}
function neededSampleUrls(){
  const urls=new Set();
  state.tracks.forEach(t=>t.notes.forEach(step=>step.forEach((on,pi)=>{
    if(!on)return;
    const spec=sampleFor(t.instrument,PITCHES[pi]);
    if(spec)urls.add(spec.url);
  })));
  return [...urls];
}
async function preloadNeededSamples(){
  const urls=neededSampleUrls().filter(u=>!sampleBuffers.has(u)&&!sampleFailures.has(u));
  if(!urls.length)return;
  status(`Loading ${urls.length} real sample${urls.length===1?"":"s"}…`);
  const results=await Promise.allSettled(urls.map(loadSample));
  const ok=results.filter(r=>r.status==="fulfilled").length;
  if(ok<urls.length)status(`Loaded ${ok}/${urls.length} samples; fallback synth will cover the rest.`);
}
function playStepNotes(step){
  const beat=60/state.bpm,dur=beat*.22;
  state.tracks.forEach(t=>t.notes[step].forEach((on,pi)=>{if(on)playVoice(PITCHES[pi],dur,t.volume*.18,t.instrument);}));
}
async function startPlay(){
  stopPlay();ensureAudio();await preloadNeededSamples();
  playing=true;playStep=0;$("#playBtn").textContent="❚❚ Pause";
  const tick=()=>{playStepNotes(playStep);renderRoll();playStep=(playStep+1)%16;};
  tick();timer=setInterval(tick,(60/state.bpm/4)*1000);status("Playing.");
}
function stopPlay(){if(timer)clearInterval(timer);timer=null;playing=false;playStep=0;$("#playBtn").textContent="▶ Play";renderRoll();}
function mutate(source,mode){
  const out=source.map(a=>[...a]),[a,b]=state.selection;
  for(let s=a;s<=b;s++){
    if(mode===0&&Math.random()<.18)out[s]=out[s].map((v,pi)=>Math.random()<.12?!v:v);
    if(mode===1&&Math.random()<.32){const from=Math.max(a,s-1);out[s]=[...source[from]];}
    if(mode===2&&Math.random()<.28){
      const active=out[s].map((v,i)=>v?i:-1).filter(i=>i>=0);
      if(active.length){const pi=active[Math.floor(Math.random()*active.length)],to=Math.max(0,Math.min(PITCHES.length-1,pi+(Math.random()<.5?-1:1)));out[s][pi]=false;out[s][to]=true;}
      else if(Math.random()<.5)out[s][Math.floor(Math.random()*PITCHES.length)]=true;
    }
  }
  return out;
}
function selectedMap(fn){
  const n=state.tracks[state.currentTrack].notes,[a,b]=state.selection;
  const copy=n.map(x=>[...x]);fn(copy,a,b);state.tracks[state.currentTrack].notes=copy;saveLocal();generatedVariants=[];renderAll();
}
document.addEventListener("mouseup",()=>dragStart=null);
$("#playBtn").onclick=()=>playing?stopPlay():startPlay();
$("#stopBtn").onclick=()=>{stopPlay();status("Stopped.");};
$("#bpmInput").onchange=e=>{state.bpm=Math.max(45,Math.min(220,+e.target.value||110));saveLocal();if(playing)startPlay();};
$("#instrumentSelect").onchange=e=>{state.tracks[state.currentTrack].instrument=e.target.value;saveLocal();renderTabs();};
$("#volumeInput").oninput=e=>{state.tracks[state.currentTrack].volume=+e.target.value;saveLocal();};
$("#clearTrackBtn").onclick=()=>selectedMap((n)=>n.forEach((_,s)=>n[s].fill(false)));
document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{
  const action=b.dataset.edit;
  selectedMap((n,a,z)=>{
    if(action==="clear")for(let s=a;s<=z;s++)n[s].fill(false);
    if(action==="transposeUp"||action==="transposeDown"){const delta=action==="transposeUp"?-1:1;for(let s=a;s<=z;s++){const old=[...n[s]];n[s].fill(false);old.forEach((v,pi)=>{if(v){const q=pi+delta;if(q>=0&&q<PITCHES.length)n[s][q]=true;}});}}
    if(action==="reverse"){const part=n.slice(a,z+1).map(x=>[...x]).reverse();part.forEach((x,i)=>n[a+i]=x);}
    if(action==="duplicate"){const len=z-a+1,start=Math.min(16,a+len);for(let i=0;i<len&&start+i<16;i++)n[start+i]=[...n[a+i]];}
  });
});
$("#makeVariantsBtn").onclick=()=>{const base=state.tracks[state.currentTrack].notes;generatedVariants=[mutate(base,0),mutate(base,1),mutate(base,2)];renderVariants();status("Three local variants generated.");};
$("#saveBtn").onclick=()=>{saveLocal();status("Saved locally.");};
$("#newBtn").onclick=()=>{if(confirm("Start a new blank project?")){localStorage.removeItem("mbean1-project");location.reload();}};
$("#exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mbean1-project.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
document.addEventListener("keydown",e=>{
  if(e.target.matches("input,select"))return;
  if(e.code==="Space"){e.preventDefault();playing?stopPlay():startPlay();}
  if(/Digit[1-4]/.test(e.code)){state.currentTrack=+e.code.slice(-1)-1;generatedVariants=[];renderAll();}
  const keys="asdfghjkl;'",idx=keys.indexOf(e.key.toLowerCase());
  if(idx>=0&&idx<PITCHES.length){state.tracks[state.currentTrack].notes[state.currentStep][PITCHES.length-1-idx]=true;saveLocal();renderAll();}
});
loadLocal();renderAll();
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
