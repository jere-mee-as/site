/* ---------- color + random utils ---------- */
const rgb=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255]};
const mix=(a,b,t)=>{const A=rgb(a),B=rgb(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
const rgba=(h,a)=>{const[r,g,b]=rgb(h);return`rgba(${r},${g},${b},${a})`};
const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0};
/* ---------- audio: synthesized interface sounds ---------- */
function pulse(){if(!P.sound)return;const s=$('#snd');s.classList.remove('pl');void s.offsetWidth;s.classList.add('pl')}
const A={ctx:null,lastCur:0,ducked:false,
  init(){if(this.ctx){if(this.ctx.state==='suspended')this.ctx.resume();return}
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;let c;try{c=this.ctx=new AC()}catch(e){return}
    this.comp=c.createDynamicsCompressor();this.comp.threshold.value=-20;this.comp.ratio.value=3;this.comp.connect(c.destination);
    this.master=c.createGain();this.master.gain.value=P.sound?1:0;this.master.connect(this.comp);
    this.fx=c.createGain();this.fx.gain.value=.2;this.fx.connect(this.master);
    this.verb=c.createConvolver();this.verb.buffer=this.ir(3,2.4);this.wet=c.createGain();this.wet.gain.value=.5;this.verb.connect(this.wet);this.wet.connect(this.master);
    this.send=c.createGain();this.send.gain.value=.2;this.send.connect(this.verb);
    const len=c.sampleRate;this.nb=c.createBuffer(1,len,len);const d=this.nb.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
    Mu.attach();if(P.music)Mu.start()},
  ir(sec,dec){const c=this.ctx,n=c.sampleRate*sec|0,b=c.createBuffer(2,n,c.sampleRate);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,dec)}return b},
  out(pan,wet){const c=this.ctx,p=c.createStereoPanner?c.createStereoPanner():c.createGain();if(p.pan)p.pan.value=clamp(pan||0,-1,1);p.connect(this.fx);if(wet){const w=c.createGain();w.gain.value=wet;p.connect(w);w.connect(this.send)}return p},
  osc(type,f,t,dur,vol,dest,att=.004){const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.05);return o},
  bell(f,t,dur,vol,pan,wet){const d=this.out(pan,wet);this.osc('sine',f,t,dur,vol,d);if(f*2.76<18000)this.osc('sine',f*2.76,t,dur*.55,vol*.32,d);if(f*5.4<18000)this.osc('sine',f*5.4,t,dur*.3,vol*.12,d)},
  noise(t,dur,vol,filt,dest){const c=this.ctx,s=c.createBufferSource();s.buffer=this.nb;s.loop=true;const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+dur*.35);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(filt);filt.connect(g);g.connect(dest);s.start(t,Math.random()*.5);s.stop(t+dur+.05)},
  cursor(){const t=this.ctx.currentTime;if(t-this.lastCur<.045)return;this.lastCur=t;const f=2600*(1+(Math.random()-.5)*.05),d=this.out(0,.5);this.osc('sine',f,t,.05,.45,d,.002);this.osc('sine',f*2,t,.03,.1,d,.002)},
  confirm(){const t=this.ctx.currentTime;this.bell(1318.5,t,.6,.42,-.15,1.4);this.bell(1975.5,t+.06,.8,.38,.15,1.6)},
  back(){const t=this.ctx.currentTime;this.bell(987.8,t,.45,.32,.1,1.2);this.bell(659.3,t+.06,.55,.28,-.1,1.2)},
  air(){const c=this.ctx,t=c.currentTime,f=c.createBiquadFilter();f.type='bandpass';f.Q.value=.9;f.frequency.setValueAtTime(320,t);f.frequency.exponentialRampToValueAtTime(1500,t+.7);this.noise(t,.9,.28,f,this.out(0,1.2));this.osc('sine',82,t,.5,.22,this.out(0,0),.08)},
  acquire(){const c=this.ctx,t=c.currentTime;[1174.7,1480,1760,2217.5,2637].forEach((f,i)=>this.bell(f,t+i*.055,1.4,.22,(i/4-.5)*.8,2.4));const o=this.osc('sine',110,t,.75,.3,this.out(0,1),.05);o.frequency.exponentialRampToValueAtTime(220,t+.7);const f=c.createBiquadFilter();f.type='highpass';f.frequency.value=4200;this.noise(t+.25,.9,.14,f,this.out(0,2))},
  shimmer(){const c=this.ctx,t=c.currentTime;[1318.5,1480,1661.2,1975.5,2217.5,2637].forEach((f,i)=>this.bell(f,t+i*.05,1.1,.15,i/5-.5,2.2))},
  tick(){const t=this.ctx.currentTime;this.osc('sine',3000,t,.025,.12,this.out(0,0),.001)},
  dull(){const t=this.ctx.currentTime;this.osc('triangle',220,t,.09,.3,this.out(0,0),.003)},
  play(n){pulse();if(!this.ctx||!P.sound||this.ctx.state!=='running')return;try{this[n]()}catch(e){}},
  setSound(on){if(this.ctx)this.master.gain.setTargetAtTime(on?1:0,this.ctx.currentTime,.05)},
  duck(on){this.ducked=on;Mu.level()}
};

/* ---------- music: an original piano + strings loop in the spirit of the score ---------- */
const mtof=m=>440*Math.pow(2,(m-69)/12);
/* [bass, chord tones] per half bar: Dmaj9 | F#m7 | Gmaj9 | Em9 A7sus | Bm9 | Gmaj7#11 | Em11 | A13sus A7 */
const CH=[[38,[62,66,69,73,76]],[38,[62,66,69,73,76]],[42,[61,66,69,73,76]],[42,[61,66,69,73,76]],[43,[67,69,71,74,78]],[43,[67,69,71,74,78]],[40,[64,67,71,74,78]],[45,[67,69,74,76,79]],[47,[66,69,71,73,74]],[47,[66,69,71,73,74]],[43,[67,71,73,74,78]],[43,[67,71,73,74,78]],[40,[64,67,69,71,74]],[40,[64,67,69,71,74]],[45,[69,74,76,78,79]],[45,[67,69,73,76,79]]];
const MEL=[[[0,4,78],[4,2,76],[6,2,81]],[[0,6,73]],[[0,2,71],[2,2,74],[4,4,78]],[[0,4,76],[4,2,74],[6,2,76]],[[0,4,78],[4,2,81],[6,2,85]],[[0,4,83],[4,2,81],[6,2,78]],[[0,3,79],[3,1,78],[4,4,76]],[[0,4,74],[4,4,76]]];
const ARP=[0,2,1,3,2,4,3,1];
const Mu={bus:null,on:false,mode:'menu',step:0,next:0,timer:0,
  attach(){const c=A.ctx;this.bus=c.createGain();this.bus.gain.value=0;this.bus.connect(A.master);const s=c.createGain();s.gain.value=.6;this.bus.connect(s);s.connect(A.verb);
    this.sf=c.createBiquadFilter();this.sf.type='lowpass';this.sf.frequency.value=1100;this.sf.Q.value=.3;this.sf.connect(this.bus)},
  target(){return P.music&&!A.ducked?.5:0},
  level(){if(this.bus)this.bus.gain.setTargetAtTime(this.target(),A.ctx.currentTime,A.ducked?.35:1.2)},
  start(){if(!A.ctx||this.on)return;this.on=true;this.next=A.ctx.currentTime+.3;this.step=0;this.timer=setInterval(()=>this.tick(),100);this.level()},
  setMode(m){this.mode=m},
  tick(){const c=A.ctx;if(!c||c.state!=='running')return;const e8=60/72/2;if(this.next<c.currentTime)this.next=c.currentTime+.05;
    while(this.next<c.currentTime+.4){if(this.target()>0)this.note(this.step,this.next,e8);this.next+=e8;this.step++}},
  note(s,t,e8){const bar=Math.floor(s/8)%8,e=s%8,sec=Math.floor(s/64)%3,h0=CH[bar*2],h1=CH[bar*2+1],h=e<4?h0:h1,cr=this.mode==='cryst',v=.5+Math.random()*.15;
    if(e===0)this.pad(h0[1],t,h0===h1?e8*8:e8*4);
    if(e===4&&h0!==h1)this.pad(h1[1],t,e8*4);
    if(cr){if(e%2===0&&Math.random()>.3)this.celesta(h[1][ARP[e]]+12,t,v*.8);if(e===0&&bar%2===0)MEL[bar].forEach(([st,du,m])=>this.celesta(m+12,t+st*e8,.5));return}
    if(e===0&&sec>0)this.piano(h0[0],t,.6);
    if(sec===1||e%2===0)this.piano(h[1][ARP[e]]+(sec===2?12:0),t,v*(sec===1?.85:.7));
    if(sec===1)MEL[bar].forEach(([st,du,m])=>{if(st===e)this.piano(m,t,.62)})},
  piano(m,t,v){const c=A.ctx,f=mtof(m),dec=Math.min(4.2,2.8*Math.pow(260/f,.4));[[1,1],[2,.38],[3,.14],[4,.06]].forEach(([k,a],i)=>{if(f*k>12000)return;const o=c.createOscillator(),g=c.createGain();o.frequency.value=f*k*(1+i*.0007);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*a*.2,t+.006);g.gain.setTargetAtTime(0,t+.006,dec/(3+i*2));o.connect(g);g.connect(this.bus);o.start(t);o.stop(t+dec+.1)})},
  celesta(m,t,v){const c=A.ctx,f=mtof(m);[[1,1,1.6],[4,.22,.4],[2,.14,.9]].forEach(([k,a,d])=>{if(f*k>14000)return;const o=c.createOscillator(),g=c.createGain();o.frequency.value=f*k;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*a*.14,t+.004);g.gain.setTargetAtTime(0,t+.004,d/3.5);o.connect(g);g.connect(this.bus);o.start(t);o.stop(t+d+.1)})},
  pad(tones,t,len){const c=A.ctx;[tones[0]-12,tones[1]-12,tones[2],tones[3]].forEach(m=>[-6,6].forEach(dt=>{const o=c.createOscillator(),g=c.createGain();o.type='sawtooth';o.frequency.value=mtof(m);o.detune.value=dt;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.016,t+Math.min(1.2,len*.4));g.gain.setValueAtTime(.016,t+len-.05);g.gain.linearRampToValueAtTime(0,t+len+1.4);o.connect(g);g.connect(this.sf);o.start(t);o.stop(t+len+1.5)}))}
};
const unlock=()=>A.init();addEventListener('pointerdown',unlock,{once:true});addEventListener('keydown',unlock,{once:true});
