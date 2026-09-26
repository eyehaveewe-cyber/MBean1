const PITCHES=["B4","A#4","A4","G#4","G4","F#4","F4","E4","D#4","D4","C#4","C4"];
const FREQ={C4:261.63,"C#4":277.18,D4:293.66,"D#4":311.13,E4:329.63,F4:349.23,"F#4":369.99,G4:392,"G#4":415.3,A4:440,"A#4":466.16,B4:493.88};
const STEPS_PER_BAR=16;
const BARS_PER_PAGE=4;
const DEFAULT_BARS=32;
const MAX_BARS=128;
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

const $=s=>document.querySelector(s);
const status=t=>$("#status").textContent=t;
const blankStep=()=>Array(PITCHES.length).fill(false);
const makeTrack=(name,instrument,volume,steps)=>({name,instrument,volume,notes:Array.from({length:steps},blankStep)});

function totalSteps(){return state.bars*STEPS_PER_BAR;}
function totalPages(){return Math.ceil(state.bars/BARS_PER_PAGE);}
function visibleStart(){return state.currentPage*BARS_PER_PAGE*STEPS_PER_BAR;}
function visibleEnd(){return Math.min(totalSteps(),visibleStart()+BARS_PER_PAGE*STEPS_PER_BAR);}
function durationSeconds(){return state.bars*4*(60/state.bpm);}
function formatTime(seconds){
  const s=Math.max(0,Math.round(seconds)),m=Math.floor(s/60),r=s%60;
  return `${m}:${String(r).padStart(2,"0")}`;
}
function cloneNotes(notes){return notes.map(step=>[...step]);}
function normalizeTrack(track,steps,index=0){
  const notes=Array.isArray(track?.notes)?track.notes.map(step=>{
    const row=Array(PITCHES.length).fill(false);
    if(Array.isArray(step))for(let i=0;i<PITCHES.length;i++)row[i]=Boolean(step[i]);
    return row;
  }):[];
  while(notes.length<steps)notes.push(blankStep());
  if(notes.length>steps)notes.length=steps;
  return {
    name:String(track?.name||`Track ${index+1}`).slice(0,24),
    instrument:track?.instrument||"triangle",
    volume:Number.isFinite(Number(track?.volume))?Math.max(0,Math.min(1,Number(track.volume))):.5,
    notes
  };
}
function defaultState(){
  const steps=DEFAULT_BARS*STEPS_PER_BAR;
  return {
    version:2,bpm:110,bars:DEFAULT_BARS,currentPage:0,currentTrack:0,selection:[0,15],currentStep:0,
    tracks:[
      makeTrack("Lead","triangle",.62,steps),
      makeTrack("Harmony","sine",.45,steps),
      makeTrack("Bass","square",.38,steps),
      makeTrack("Drums","drumsSample",.42,steps)
    ]
  };
}
let state=defaultState();
let audioCtx=null,timer=null,playing=false,playStep=0,dragStart=null,notePaint=null,generatedVariants=[];

function migrateProject(project){
  if(!project||!Array.isArray(project.tracks)||!project.tracks.length)return defaultState();
  const oldMax=Math.max(...project.tracks.map(t=>Array.isArray(t.notes)?t.notes.length:0),16);
  let bars=Number(project.bars)||Math.ceil(oldMax/STEPS_PER_BAR);
  if(!project.bars&&bars<DEFAULT_BARS)bars=DEFAULT_BARS;
  bars=Math.max(4,Math.min(MAX_BARS,Math.ceil(bars/4)*4));
  const steps=bars*STEPS_PER_BAR;
  const tracks=project.tracks.slice(0,16).map((t,i)=>normalizeTrack(t,steps,i));
  return {
    version:2,
    bpm:Math.max(45,Math.min(220,Number(project.bpm)||110)),
    bars,
    currentPage:Math.max(0,Math.min(Math.ceil(bars/BARS_PER_PAGE)-1,Number(project.currentPage)||0)),
    currentTrack:Math.max(0,Math.min(tracks.length-1,Number(project.currentTrack)||0)),
    selection:Array.isArray(project.selection)?[
      Math.max(0,Math.min(steps-1,Number(project.selection[0])||0)),
      Math.max(0,Math.min(steps-1,Number(project.selection[1])||15))
    ]:[0,15],
    currentStep:Math.max(0,Math.min(steps-1,Number(project.currentStep)||0)),
    tracks
  };
}
function saveLocal(){localStorage.setItem("mbean1-project",JSON.stringify(state));}
function loadLocal(){
  try{
    const raw=localStorage.getItem("mbean1-project");
    if(raw)state=migrateProject(JSON.parse(raw));
  }catch{
    state=defaultState();
  }
}
function currentTrack(){return state.tracks[state.currentTrack];}
function stepDuration(){return 60/state.bpm/4;}

function renderTabs(){
  const el=$("#trackTabs");el.textContent="";
  state.tracks.forEach((t,i)=>{
    const b=document.createElement("button");
    b.className="track-tab"+(i===state.currentTrack?" active":"");
    b.textContent=`${i+1}. ${t.name}`;
    const meta=document.createElement("small");
    meta.textContent=t.instrument;
    b.appendChild(meta);
    b.onclick=()=>{
      state.currentTrack=i;
      generatedVariants=[];
      renderAll();
      saveLocal();
    };
    el.appendChild(b);
  });
}

function rulerText(step){
  const inside=step%STEPS_PER_BAR;
  if(inside===0)return `B${Math.floor(step/STEPS_PER_BAR)+1}`;
  if(inside%4===0)return String(inside/4+1);
  return "";
}

function paintNote(step,pi,value){
  const t=currentTrack();
  if(!t||step<0||step>=totalSteps())return;
  t.notes[step][pi]=value;
  state.currentStep=step;
}

function renderRoll(){
  const roll=$("#roll");
  roll.textContent="";
  const start=visibleStart(),end=visibleEnd(),count=end-start;
  roll.style.gridTemplateColumns=`64px repeat(${count},minmax(24px,1fr))`;

  const corner=document.createElement("div");
  roll.appendChild(corner);

  for(let s=start;s<end;s++){
    const d=document.createElement("div");
    d.className="step-label"+(s>=state.selection[0]&&s<=state.selection[1]?" selected":"")+(s%STEPS_PER_BAR===0?" bar-start":"");
    d.textContent=rulerText(s);
    d.title=`Bar ${Math.floor(s/STEPS_PER_BAR)+1}, step ${s%STEPS_PER_BAR+1}`;
    d.onpointerdown=e=>{
      e.preventDefault();
      dragStart=s;
      state.selection=[s,s];
      $("#selectionLabel").textContent=`Selection: steps ${s+1}–${s+1}`;
    };
    d.onpointerenter=()=>{
      if(dragStart!==null){
        state.selection=[Math.min(dragStart,s),Math.max(dragStart,s)];
        $("#selectionLabel").textContent=`Selection: steps ${state.selection[0]+1}–${state.selection[1]+1}`;
      }
    };
    roll.appendChild(d);
  }

  const t=currentTrack();
  PITCHES.forEach((p,pi)=>{
    const l=document.createElement("div");
    l.className="pitch-label";
    l.textContent=t.instrument==="drumsSample"?(DRUM_LABELS[p]||p):p;
    roll.appendChild(l);

    for(let s=start;s<end;s++){
      const c=document.createElement("div");
      const on=Boolean(t.notes[s][pi]);
      const prev=on&&s>0&&Boolean(t.notes[s-1][pi])&&t.instrument!=="drumsSample";
      c.className="cell"+(on?" on":"")+(on&&!prev&&t.instrument!=="drumsSample"?" attack":"")+(prev?" held":"")+
        (s>=state.selection[0]&&s<=state.selection[1]?" selected-region":"")+
        (playing&&s===playStep?" playing":"")+(s%STEPS_PER_BAR===0?" bar-start":"");
      c.title=`${p} · bar ${Math.floor(s/STEPS_PER_BAR)+1} · step ${s%STEPS_PER_BAR+1}`;
      c.onpointerdown=e=>{
        e.preventDefault();
        const value=!on;
        notePaint={pi,value};
        paintNote(s,pi,value);
        generatedVariants=[];
        c.classList.toggle("on",value);
      };
      c.onpointerenter=()=>{
        if(notePaint&&notePaint.pi===pi){
          paintNote(s,pi,notePaint.value);
          generatedVariants=[];
          c.classList.toggle("on",notePaint.value);
        }
      };
      roll.appendChild(c);
    }
  });

  $("#selectionLabel").textContent=`Selection: steps ${state.selection[0]+1}–${state.selection[1]+1}`;
}

function renderControls(){
  const t=currentTrack();
  $("#instrumentSelect").value=t.instrument;
  $("#volumeInput").value=t.volume;
  $("#trackNameInput").value=t.name;
  $("#bpmInput").value=state.bpm;
  $("#barsSelect").value=String(state.bars);
  $("#durationLabel").textContent=`~${formatTime(durationSeconds())}`;
  const firstBar=state.currentPage*BARS_PER_PAGE+1;
  const lastBar=Math.min(state.bars,firstBar+BARS_PER_PAGE-1);
  $("#pageLabel").textContent=`Bars ${firstBar}–${lastBar} of ${state.bars}`;
  $("#prevPageBtn").disabled=state.currentPage<=0;
  $("#nextPageBtn").disabled=state.currentPage>=totalPages()-1;
  $("#removeTrackBtn").disabled=state.tracks.length<=1;
  $("#addTrackBtn").disabled=state.tracks.length>=16;
}

function renderVariants(){
  const el=$("#variants");
  if(!generatedVariants.length){
    el.textContent="";
    const p=document.createElement("p");p.className="muted";p.textContent="Select a region, then generate variants.";el.appendChild(p);
    return;
  }
  el.textContent="";
  const start=visibleStart(),end=visibleEnd(),count=end-start;
  generatedVariants.forEach((notes,i)=>{
    const card=document.createElement("div");card.className="variant-card";
    const h=document.createElement("h3");h.textContent=["Gentle","Rhythmic","Stranger"][i]||`Variant ${i+1}`;card.appendChild(h);
    const mini=document.createElement("div");mini.className="mini-grid";mini.style.gridTemplateColumns=`repeat(${count},1fr)`;
    for(let s=start;s<end;s++){
      const col=document.createElement("div");col.className="mini-col";
      notes[s].forEach((on,pi)=>{
        if(on){
          const n=document.createElement("span");n.className="mini-note";
          n.style.top=`${(pi/(PITCHES.length-1))*44}px`;
          col.appendChild(n);
        }
      });
      mini.appendChild(col);
    }
    card.appendChild(mini);
    const use=document.createElement("button");use.textContent="Use this";
    use.onclick=()=>{
      currentTrack().notes=cloneNotes(notes);
      saveLocal();
      generatedVariants=[];
      renderAll();
      status("Variant applied.");
    };
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
  const sustain=Math.max(.06,dur),peak=Math.max(.001,vol);
  o.frequency.value=freq;o.type=type==="pluck"?"triangle":type;
  o.connect(g);g.connect(ctx.destination);
  g.gain.setValueAtTime(.001,now);
  g.gain.exponentialRampToValueAtTime(peak,now+Math.min(.035,sustain*.18));
  if(type==="pluck"){
    g.gain.exponentialRampToValueAtTime(.001,now+Math.max(.06,sustain*.7));
  }else{
    g.gain.setValueAtTime(peak,now+Math.max(.04,sustain-.08));
    g.gain.exponentialRampToValueAtTime(.001,now+sustain);
  }
  o.start(now);o.stop(now+sustain+.03);
}
function playLoadedSample(spec,note,dur,vol){
  const buffer=sampleBuffers.get(spec.url);
  if(!buffer)return false;
  const ctx=ensureAudio(),now=ctx.currentTime,source=ctx.createBufferSource(),g=ctx.createGain();
  const peak=Math.max(.001,vol*(spec.drum?1.8:2.2));
  source.buffer=buffer;source.playbackRate.value=spec.rate;
  source.connect(g);g.connect(ctx.destination);

  if(spec.drum){
    g.gain.setValueAtTime(peak,now);
    source.start(now);
    return true;
  }

  const wanted=Math.max(.12,dur);
  const natural=buffer.duration/spec.rate;
  let stopAt=wanted;
  if(wanted>natural*.92&&buffer.duration>.45){
    source.loop=true;
    source.loopStart=Math.min(.18,buffer.duration*.16);
    source.loopEnd=Math.max(source.loopStart+.12,buffer.duration*.84);
  }else{
    stopAt=Math.min(wanted,natural);
  }

  const attack=Math.min(.055,stopAt*.16);
  const release=Math.min(.14,Math.max(.045,stopAt*.22));
  g.gain.setValueAtTime(.001,now);
  g.gain.exponentialRampToValueAtTime(peak,now+attack);
  g.gain.setValueAtTime(peak,now+Math.max(attack,stopAt-release));
  g.gain.exponentialRampToValueAtTime(.001,now+stopAt);
  source.start(now);
  source.stop(now+stopAt+.04);
  return true;
}
function playVoice(note,dur,vol,instrument){
  const spec=sampleFor(instrument,note);
  if(spec&&playLoadedSample(spec,note,dur,vol))return;
  oscillatorNote(FREQ[note],dur,vol,instrument==="drumsSample"?"triangle":instrument);
}
function runLength(track,step,pi){
  if(track.instrument==="drumsSample")return 1;
  let len=1;
  for(let s=step+1;s<totalSteps()&&track.notes[s][pi];s++)len++;
  return len;
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
  const unit=stepDuration();
  state.tracks.forEach(t=>t.notes[step].forEach((on,pi)=>{
    if(!on)return;
    if(t.instrument!=="drumsSample"&&step>0&&t.notes[step-1][pi])return;
    const hold=runLength(t,step,pi);
    const isWoodwind=t.instrument==="fluteSample"||t.instrument==="oboeSample";
    const dur=t.instrument==="drumsSample"
      ? unit
      : Math.max(isWoodwind ? .32 : unit*.92,hold*unit*.97);
    playVoice(PITCHES[pi],dur,t.volume*.18,t.instrument);
  }));
}
async function startPlay(){
  stopPlay();ensureAudio();await preloadNeededSamples();
  playing=true;
  playStep=Math.max(0,Math.min(totalSteps()-1,state.currentStep||0));
  $("#playBtn").textContent="❚❚ Pause";
  const tick=()=>{
    playStepNotes(playStep);
    if(playStep>=visibleStart()&&playStep<visibleEnd())renderRoll();
    playStep++;
    if(playStep>=totalSteps()){
      stopPlay();
      status("Reached end of project.");
    }
  };
  tick();
  if(playing)timer=setInterval(tick,stepDuration()*1000);
  status("Playing.");
}
function stopPlay(){
  if(timer)clearInterval(timer);
  timer=null;playing=false;
  $("#playBtn").textContent="▶ Play";
  renderRoll();
}
function mutate(source,mode){
  const out=cloneNotes(source),[a,b]=state.selection;
  for(let s=a;s<=b&&s<out.length;s++){
    if(mode===0&&Math.random()<.16)out[s]=out[s].map(v=>Math.random()<.10?!v:v);
    if(mode===1&&Math.random()<.28){
      const from=Math.max(a,s-1);
      out[s]=[...source[from]];
    }
    if(mode===2&&Math.random()<.25){
      const active=out[s].map((v,i)=>v?i:-1).filter(i=>i>=0);
      if(active.length){
        const pi=active[Math.floor(Math.random()*active.length)];
        const to=Math.max(0,Math.min(PITCHES.length-1,pi+(Math.random()<.5?-1:1)));
        out[s][pi]=false;out[s][to]=true;
      }else if(Math.random()<.45){
        out[s][Math.floor(Math.random()*PITCHES.length)]=true;
      }
    }
  }
  return out;
}
function selectedMap(fn){
  const n=currentTrack().notes,[a,b]=state.selection;
  const copy=cloneNotes(n);
  fn(copy,a,b);
  currentTrack().notes=copy;
  saveLocal();generatedVariants=[];renderAll();
}
function resizeProject(newBars){
  newBars=Math.max(4,Math.min(MAX_BARS,Number(newBars)||DEFAULT_BARS));
  const oldSteps=totalSteps(),newSteps=newBars*STEPS_PER_BAR;
  if(newSteps<oldSteps){
    const hasData=state.tracks.some(t=>t.notes.slice(newSteps).some(row=>row.some(Boolean)));
    if(hasData&&!confirm(`Shortening to ${newBars} bars will delete notes after bar ${newBars}. Continue?`)){
      $("#barsSelect").value=String(state.bars);return;
    }
  }
  state.bars=newBars;
  state.tracks=state.tracks.map((t,i)=>normalizeTrack(t,newSteps,i));
  state.currentPage=Math.min(state.currentPage,totalPages()-1);
  state.currentStep=Math.min(state.currentStep,newSteps-1);
  state.selection=[Math.min(state.selection[0],newSteps-1),Math.min(state.selection[1],newSteps-1)];
  saveLocal();generatedVariants=[];renderAll();
}

document.addEventListener("pointerup",()=>{
  const changed=dragStart!==null||notePaint!==null;
  dragStart=null;notePaint=null;
  if(changed){saveLocal();renderAll();}
});
document.addEventListener("pointercancel",()=>{
  const changed=dragStart!==null||notePaint!==null;
  dragStart=null;notePaint=null;
  if(changed){saveLocal();renderAll();}
});

$("#playBtn").onclick=()=>playing?stopPlay():startPlay();
$("#stopBtn").onclick=()=>{stopPlay();status("Stopped.");};
$("#bpmInput").onchange=e=>{
  state.bpm=Math.max(45,Math.min(220,+e.target.value||110));
  saveLocal();
  if(playing)startPlay();
  renderControls();
};
$("#instrumentSelect").onchange=e=>{
  currentTrack().instrument=e.target.value;
  saveLocal();generatedVariants=[];renderAll();
};
$("#volumeInput").oninput=e=>{currentTrack().volume=+e.target.value;saveLocal();};
$("#trackNameInput").onchange=e=>{
  currentTrack().name=(e.target.value.trim()||`Track ${state.currentTrack+1}`).slice(0,24);
  saveLocal();renderTabs();
};
$("#prevPageBtn").onclick=()=>{
  if(state.currentPage>0){
    state.currentPage--;
    state.currentStep=visibleStart();
    state.selection=[visibleStart(),Math.min(visibleStart()+15,totalSteps()-1)];
    saveLocal();generatedVariants=[];renderAll();
  }
};
$("#nextPageBtn").onclick=()=>{
  if(state.currentPage<totalPages()-1){
    state.currentPage++;
    state.currentStep=visibleStart();
    state.selection=[visibleStart(),Math.min(visibleStart()+15,totalSteps()-1)];
    saveLocal();generatedVariants=[];renderAll();
  }
};
$("#barsSelect").onchange=e=>resizeProject(e.target.value);
$("#addTrackBtn").onclick=()=>{
  if(state.tracks.length>=16)return;
  state.tracks.push(makeTrack(`Track ${state.tracks.length+1}`,"triangle",.5,totalSteps()));
  state.currentTrack=state.tracks.length-1;
  saveLocal();generatedVariants=[];renderAll();
  status("Track added.");
};
$("#duplicateTrackBtn").onclick=()=>{
  if(state.tracks.length>=16){status("Maximum 16 tracks.");return;}
  const t=currentTrack();
  state.tracks.splice(state.currentTrack+1,0,{name:`${t.name} copy`.slice(0,24),instrument:t.instrument,volume:t.volume,notes:cloneNotes(t.notes)});
  state.currentTrack++;
  saveLocal();generatedVariants=[];renderAll();
  status("Track duplicated.");
};
$("#removeTrackBtn").onclick=()=>{
  if(state.tracks.length<=1)return;
  const name=currentTrack().name;
  if(!confirm(`Remove track "${name}"?`))return;
  state.tracks.splice(state.currentTrack,1);
  state.currentTrack=Math.min(state.currentTrack,state.tracks.length-1);
  saveLocal();generatedVariants=[];renderAll();
};
$("#clearTrackBtn").onclick=()=>{
  if(!confirm(`Clear every note on "${currentTrack().name}"?`))return;
  currentTrack().notes.forEach(row=>row.fill(false));
  saveLocal();generatedVariants=[];renderAll();
};

document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{
  const action=b.dataset.edit;
  selectedMap((n,a,z)=>{
    if(action==="clear"){
      for(let s=a;s<=z&&s<n.length;s++)n[s].fill(false);
    }
    if(action==="transposeUp"||action==="transposeDown"){
      const delta=action==="transposeUp"?-1:1;
      for(let s=a;s<=z&&s<n.length;s++){
        const old=[...n[s]];n[s].fill(false);
        old.forEach((v,pi)=>{
          if(v){
            const q=pi+delta;
            if(q>=0&&q<PITCHES.length)n[s][q]=true;
          }
        });
      }
    }
    if(action==="reverse"){
      const part=n.slice(a,z+1).map(x=>[...x]).reverse();
      part.forEach((x,i)=>{if(a+i<n.length)n[a+i]=x;});
    }
    if(action==="duplicate"){
      const len=z-a+1,start=a+len;
      for(let i=0;i<len&&start+i<n.length;i++)n[start+i]=[...n[a+i]];
    }
  });
});

$("#makeVariantsBtn").onclick=()=>{
  const base=currentTrack().notes;
  generatedVariants=[mutate(base,0),mutate(base,1),mutate(base,2)];
  renderVariants();
  status("Three local variants generated.");
};
$("#saveBtn").onclick=()=>{saveLocal();status("Saved locally.");};
$("#newBtn").onclick=()=>{
  if(confirm("Start a new blank project?")){
    localStorage.removeItem("mbean1-project");
    location.reload();
  }
};
$("#exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download="mbean1-project.json";a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};

document.addEventListener("keydown",e=>{
  if(e.target.matches("input,select"))return;
  if(e.code==="Space"){e.preventDefault();playing?stopPlay():startPlay();}
  if(/^Digit[1-9]$/.test(e.code)){
    const i=+e.code.slice(-1)-1;
    if(i<state.tracks.length){state.currentTrack=i;generatedVariants=[];renderAll();saveLocal();}
  }
  const keys="asdfghjkl;'",idx=keys.indexOf(e.key.toLowerCase());
  if(idx>=0&&idx<PITCHES.length){
    currentTrack().notes[state.currentStep][PITCHES.length-1-idx]=true;
    saveLocal();renderAll();
  }
});

loadLocal();
renderAll();
if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}