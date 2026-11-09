/* ---------- generated crystal art ---------- */
const ART=new Map();
function poly(g,pts,fill){g.fillStyle=fill;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill()}
function star(g,x,y,r){g.save();g.globalCompositeOperation='lighter';const sg=g.createRadialGradient(x,y,0,x,y,r);sg.addColorStop(0,'rgba(255,255,255,.95)');sg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=sg;g.beginPath();g.moveTo(x-r,y);g.quadraticCurveTo(x,y,x,y-r);g.quadraticCurveTo(x,y,x+r,y);g.quadraticCurveTo(x,y,x,y+r);g.quadraticCurveTo(x,y,x-r,y);g.fill();g.restore()}
function prism(g,x,y,ang,len,wid,col){const dx=Math.sin(ang),dy=-Math.cos(ang),px=-dy,py=dx;
  const Tp=[x+dx*len,y+dy*len],SL=[x+dx*len*.78-px*wid,y+dy*len*.78-py*wid],SR=[x+dx*len*.78+px*wid*.8,y+dy*len*.78+py*wid*.8],L=[x-px*wid*.9,y-py*wid*.9],Rr=[x+px*wid*.7,y+py*wid*.7],M=[x+dx*len*.05,y+dy*len*.05];
  const lg=g.createLinearGradient(L[0],L[1],Tp[0],Tp[1]);lg.addColorStop(0,rgba(mix(col,'#ffffff',.35),.86));lg.addColorStop(1,'rgba(255,255,255,.96)');poly(g,[L,SL,Tp,M],lg);
  const rg=g.createLinearGradient(Rr[0],Rr[1],Tp[0],Tp[1]);rg.addColorStop(0,rgba(mix(col,'#1a1520',.5),.92));rg.addColorStop(1,rgba(col,.88));poly(g,[M,Tp,SR,Rr],rg);
  g.lineWidth=1;g.strokeStyle='rgba(255,255,255,.75)';g.beginPath();g.moveTo(M[0],M[1]);g.lineTo(Tp[0],Tp[1]);g.stroke();
  g.strokeStyle='rgba(255,255,255,.35)';g.beginPath();g.moveTo(L[0],L[1]);g.lineTo(SL[0],SL[1]);g.lineTo(Tp[0],Tp[1]);g.lineTo(SR[0],SR[1]);g.lineTo(Rr[0],Rr[1]);g.stroke()}
function art(r,w,h){const key=r.id+'|'+P.world+'|'+w+'x'+h;if(ART.has(key))return ART.get(key);
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),rnd=mulberry(hash(r.title+r.id)),col=typeInfo(r.type).c,pearl=P.world==='pearl',S=Math.min(w,h*1.2),tall=h>w*1.15;
  const sk=g.createLinearGradient(0,0,0,h);
  if(pearl){sk.addColorStop(0,'#fdfcfb');sk.addColorStop(.5,mix(col,'#f3eeee',.72));sk.addColorStop(1,mix(col,'#5d5563',.45))}else{sk.addColorStop(0,mix(col,'#0b1017',.72));sk.addColorStop(.55,'#121a24');sk.addColorStop(1,'#05070a')}
  g.fillStyle=sk;g.fillRect(0,0,w,h);
  const sx=w*(.25+rnd()*.5),sy=h*(.12+rnd()*.2),sr=Math.max(w,h)*.65,sg=g.createRadialGradient(sx,sy,0,sx,sy,sr);sg.addColorStop(0,pearl?'rgba(255,255,255,.95)':rgba(col,.45));sg.addColorStop(.35,pearl?'rgba(255,238,232,.45)':rgba(col,.12));sg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=sg;g.fillRect(0,0,w,h);
  for(let i=0;i<7;i++){const cx=rnd()*w,cy=h*(.35+rnd()*.35),cr=w*(.25+rnd()*.35),cg=g.createRadialGradient(cx,cy,0,cx,cy,cr);cg.addColorStop(0,pearl?'rgba(255,255,255,.5)':rgba(mix(col,'#ffffff',.3),.08));cg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=cg;g.beginPath();g.ellipse(cx,cy,cr,cr*.45,0,0,7);g.fill()}
  const gy=h*(tall?.64:.93);for(let i=0;i<10;i++){const bx=rnd()*w,bw=S*(.015+rnd()*.03),bh=h*(.12+rnd()*.3)*(tall?.6:1);g.fillStyle=rgba(pearl?mix(col,'#5c5466',.6):mix(col,'#0a0f14',.5),.22+rnd()*.25);g.beginPath();g.moveTo(bx-bw,gy);g.lineTo(bx,gy-bh);g.lineTo(bx+bw,gy);g.fill()}
  const bx=w*(.42+rnd()*.16),by=h*(tall?.6:.9),n=3+(rnd()*3|0),sh=[];
  for(let i=0;i<n;i++)sh.push({ang:(rnd()-.5)*.9+(i-(n-1)/2)*.2,len:h*(tall?.6:1)*(.3+rnd()*.38)*(i===0?1.15:1),wid:S*(.06+rnd()*.06),ox:(rnd()-.5)*S*.16});
  sh.sort((a,b)=>b.len-a.len).forEach(s=>prism(g,bx+s.ox,by,s.ang,s.len,s.wid,col));
  const gg=g.createRadialGradient(bx,by,0,bx,by,S*.5);gg.addColorStop(0,rgba(col,.5));gg.addColorStop(1,rgba(col,0));g.fillStyle=gg;g.fillRect(0,0,w,h);
  for(let i=0;i<5;i++)star(g,bx+(rnd()-.5)*S*.45,by-rnd()*h*.45,S*(.012+rnd()*.035));
  for(let i=0;i<40;i++){g.fillStyle=`rgba(255,255,255,${.2+rnd()*.6})`;g.beginPath();g.arc(rnd()*w,rnd()*h,(rnd()*1.6+.3)*S/300,0,7);g.fill()}
  if(ART.size>60)ART.clear();ART.set(key,c);return c}
function drawArt(cv,r){const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h||!r)return;const d=Math.min(2,devicePixelRatio||1),W=Math.round(w*d),H=Math.round(h*d);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}cv.getContext('2d').drawImage(art(r,W,H),0,0)}

/* ---------- smoke: grey cloud layers drifting left at the menu's measured 1.5–3% of width per second ---------- */
function makeCloud(seed,dark,amaxO,rangeO,loO){const w=512,h=256,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),img=g.createImageData(w,h),d=img.data,rnd=mulberry(seed),oct=[];
  for(let o=0;o<4;o++){const gx=4<<o,gy=Math.max(2,2<<o),v=new Float32Array(gx*gy);for(let i=0;i<v.length;i++)v[i]=rnd();oct.push({gx,gy,v})}
  const sm=t=>t*t*(3-2*t),lo=loO??(dark?.47:.4),range=rangeO??.3,col=dark?[30,28,34]:[255,255,255],amax=amaxO??(dark?215:240);
  for(let y=0;y<h;y++){const fall=Math.sin(Math.PI*y/h);for(let x=0;x<w;x++){let n=0,a=.5,nm=0;for(const{gx,gy,v}of oct){const fx=x/w*gx,fy=y/h*gy,ix=fx|0,iy=fy|0,tx=sm(fx-ix),ty=sm(fy-iy),x1=(ix+1)%gx,y1=Math.min(iy+1,gy-1);n+=a*((v[iy*gx+ix]*(1-tx)+v[iy*gx+x1]*tx)*(1-ty)+(v[y1*gx+ix]*(1-tx)+v[y1*gx+x1]*tx)*ty);nm+=a;a*=.5}
    n/=nm;let al=clamp((n-lo)/range,0,1);al=al*al*(3-2*al)*fall;const i4=(y*w+x)*4;d[i4]=col[0];d[i4+1]=col[1];d[i4+2]=col[2];d[i4+3]=al*amax}}
  g.putImageData(img,0,0);return c.toDataURL()}
let CL=null;const cloudAnims=[];
function setupClouds(){if(!CL)CL={l:makeCloud(1337,0),d:makeCloud(77,1),f:makeCloud(901,0,150,.6,.28)};const W=innerWidth;cloudAnims.length=0;
  [['.cloud.d','d',1.6,1.5],['.cloud.a','l',1.8,2.1],['.cloud.b','l',1.25,2.9]].forEach(([s,k,sc,pct])=>{const el=$(s),tw=Math.round(Math.max(W*sc,1200));el.style.backgroundImage=`url(${CL[k]})`;el.style.width=tw*2+'px';el.style.backgroundSize=`${tw}px 100%`;el.getAnimations().forEach(a=>a.cancel());
    if(!RM())cloudAnims.push(el.animate([{transform:'translateX(0)'},{transform:`translateX(${-tw}px)`}],{duration:tw/(pct*W/100)*1000,iterations:Infinity}))});
  const fog=$('#fog');fog.style.backgroundImage=`url(${CL.f}),url(${CL.f})`;fog.style.backgroundSize=`${Math.round(W*1.3)}px 95%,${Math.round(W*.9)}px 70%`;fog.style.backgroundPosition='0 10%,45% 95%'}
let surgeRaf=0;
/* clouds surge to opening-film speed during a transition, then settle */
function surge(dur){if(RM()||!cloudAnims.length)return;cancelAnimationFrame(surgeRaf);const t0=performance.now();const f=now=>{const p=Math.min(1,(now-t0)/dur),r=1+4.5*Math.sin(Math.PI*p);cloudAnims.forEach(a=>a.playbackRate=r);if(p<1)surgeRaf=requestAnimationFrame(f)};surgeRaf=requestAnimationFrame(f)}

/* ---------- hexagonal crystal bokeh: only when something happens ---------- */
const FX={cv:$('#fx'),ps:[],sp:{},amb:false,
  init(){this.g=this.cv.getContext('2d');this.resize()},
  resize(){this.d=Math.min(2,devicePixelRatio||1);this.cv.width=innerWidth*this.d;this.cv.height=innerHeight*this.d},
  sprite(col){if(this.sp[col])return this.sp[col];const c=document.createElement('canvas');c.width=c.height=72;const g=c.getContext('2d');g.filter='blur(1.2px)';g.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i+Math.PI/6;g.lineTo(36+Math.cos(a)*30,36+Math.sin(a)*30)}g.closePath();const rg=g.createRadialGradient(36,36,2,36,36,31);rg.addColorStop(0,rgba(col,.5));rg.addColorStop(.72,rgba(col,.32));rg.addColorStop(1,rgba(col,.8));g.fillStyle=rg;g.fill();g.lineWidth=2;g.strokeStyle=rgba(mix(col,'#ffffff',.6),.9);g.stroke();return this.sp[col]=c},
  cols(){return P.world==='pearl'?['#b79cf2','#d8c9ff','#9fdcf0','#ffffff']:['#9fffd0','#a9e8ff','#c3a8ff','#ffffff']},
  burst(x,y,n,col){if(RM())return;const cs=this.cols();for(let i=0;i<n;i++){const big=Math.random()<.3;this.ps.push({x:x+(Math.random()-.5)*30,y:y+(Math.random()-.5)*20,vx:(Math.random()-.5)*90,vy:-(60+Math.random()*200),r:big?14+Math.random()*16:4+Math.random()*9,rot:Math.random()*6,vr:(Math.random()-.5)*1.5,life:0,max:1.1+Math.random()*1.4,a:big?.45:.85,c:col&&Math.random()<.45?col:cs[Math.random()*cs.length|0]})}},
  emit(x,y,n,col){if(RM())return;const cs=this.cols();for(let i=0;i<n;i++)this.ps.push({x:x+(Math.random()-.5)*16,y,vx:(Math.random()-.5)*30,vy:-(30+Math.random()*70),r:3+Math.random()*6,rot:Math.random()*6,vr:(Math.random()-.5),life:0,max:.9+Math.random()*.6,a:.8,c:col&&Math.random()<.5?col:cs[Math.random()*cs.length|0]})},
  frame(dt,t){const g=this.g,W=innerWidth,H=innerHeight;g.setTransform(this.d,0,0,this.d,0,0);g.clearRect(0,0,W,H);
    if(this.amb&&!RM()&&Math.random()<dt*1.2&&this.ps.filter(p=>p.amb).length<12){const cs=this.cols();this.ps.push({amb:1,x:Math.random()*W,y:H+40,vx:0,vy:-(6+Math.random()*12),r:10+Math.random()*26,rot:Math.random()*6,vr:(Math.random()-.5)*.2,life:0,max:30,a:.12+Math.random()*.16,c:cs[Math.random()*cs.length|0]})}
    if(!this.ps.length)return;g.globalCompositeOperation='lighter';
    for(let i=this.ps.length-1;i>=0;i--){const p=this.ps[i];p.life+=dt;if(p.amb&&!this.amb)p.fade=(p.fade==null?1:p.fade)-dt*1.5;if(p.life>p.max||p.y<-60||p.fade<=0){this.ps.splice(i,1);continue}
      if(!p.amb)p.vy*=Math.pow(.97,dt*60);p.x+=p.vx*dt+(p.amb?Math.sin(t*.4+p.r)*.2:0);p.y+=p.vy*dt;p.rot+=p.vr*dt;
      const k=p.life/p.max,al=p.a*(p.amb?Math.min(1,p.life/2):Math.min(1,p.life*8)*(1-k*k))*(p.fade==null?1:p.fade);
      g.globalAlpha=al;g.save();g.translate(p.x,p.y);g.rotate(p.rot);g.drawImage(this.sprite(p.c),-p.r,-p.r,p.r*2,p.r*2);g.restore()}
    g.globalAlpha=1;g.globalCompositeOperation='source-over'}
};
