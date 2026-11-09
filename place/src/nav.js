/* ===================== keyboard-first navigation =====================
   Two modes on a note: EDIT (a line has the caret) and NAVIGATE (a cursor walks the sheet).
   Esc always steps one level out: edit → navigate → zoom out → back. Letters are commands only while navigating. */

/* ---------- NAV: one cursor that walks the whole sheet: title → fields → nodes → linked references ---------- */
const NAV={on:false,i:-1,items:[],
  collect(){const out=[];if(view!=='obj'||!$('#sheet'))return out;const t=$('#o-title');if(t)out.push({k:'title',el:t,key:'title'});
    $$('#fields .fr[data-fk]').forEach(fr=>out.push({k:'field',el:fr,key:'f:'+fr.dataset.fk,fk:fr.dataset.fk}));
    $$('#fields #f-more,#fields #f-add').forEach(b=>out.push({k:'btn',el:b,key:'b:'+b.id}));
    $$('#ol .nd').forEach(nd=>{const nr=nd.querySelector(':scope>.nr');if(nr)out.push({k:'node',el:nr,key:'n:'+nd.dataset.id,id:nd.dataset.id})});
    $$('#qres .rg-h,#refs .rg-h').forEach(b=>out.push({k:'ref',el:b,key:'r:'+b.dataset.oid,oid:b.dataset.oid}));return out},
  cur(){return this.items[this.i]||null},
  node(){const it=this.cur();return it&&it.k==='node'?E.map.get(it.id):null},
  land(where={}){if(view!=='obj')return;this.on=true;this.items=this.collect();let i=-1;
    if(where.node)i=this.items.findIndex(x=>x.key==='n:'+where.node);else if(where.field)i=this.items.findIndex(x=>x.key==='f:'+where.field);else if(where.title)i=0;else if(where.ref)i=this.items.findIndex(x=>x.key==='r:'+where.ref);else if(where.key)i=this.items.findIndex(x=>x.key===where.key);
    if(i<0)i=this.items.findIndex(x=>x.k==='node');if(i<0)i=0;this.set(i,{quiet:true});setHints('obj');help()},
  off(){const c=this.cur();if(c)this.lastKey=c.key;this.on=false;$$('.kc').forEach(e=>e.classList.remove('kc'));if(view==='obj')pointAt(null)},
  clear(){this.off();this.i=-1;this.items=[];this.lastKey=null},
  refresh(){if(!this.on)return;const key=this.cur()&&this.cur().key;this.items=this.collect();let i=this.items.findIndex(x=>x.key===key);if(i<0)i=clamp(this.i,0,this.items.length-1);this.set(i,{quiet:true})},
  set(i,{quiet=false}={}){if(!this.items.length)return;i=clamp(i,0,this.items.length-1);const ch=i!==this.i;this.i=i;let it=this.items[i];
    if(!it.el.isConnected){this.items=this.collect();it=this.items[clamp(i,0,this.items.length-1)];if(!it)return}
    $$('.kc').forEach(e=>e.classList.remove('kc'));it.el.classList.add('kc');
    const v=$('#v-obj'),b=it.el.getBoundingClientRect(),vb=v.getBoundingClientRect(),m=Math.min(110,vb.height*.18);
    if(b.top<vb.top+m)v.scrollTop-=vb.top+m-b.top;else if(b.bottom>vb.bottom-m)v.scrollTop+=Math.min(b.bottom-(vb.bottom-m),b.top-(vb.top+m));
    pointAt(it.el);if(ch&&!quiet){A.play('cursor');if(!RM()){it.el.animate([{backgroundPosition:'0 0',filter:'brightness(1.5)'},{filter:'brightness(1)'}],{duration:T(160)})}}
    if(it.k==='ref'){const o=getObj(it.oid);if(o)help('Linked from '+typeInfo(o.type).label+': '+o.title+'. Enter opens it.')}else if(it.k==='field')help('Field · '+humanize(it.fk)+'. Enter edits it.');else if(it.k==='title')help('Title. Enter renames it.');else help()},
  move(d){if(!this.on){this.land(this.i>=0&&this.items[this.i]&&this.items[this.i].k==='node'?{node:this.items[this.i].id}:{});return}this.items=this.collect();const n=this.i+d;if(n<0||n>=this.items.length){A.play('dull');return}this.set(n)},
  first(kind){if(!this.on)this.land();const i=this.items.findIndex(x=>x.k===kind);if(i<0){A.play('dull');return}this.set(i)},
  activate(){const it=this.cur();if(!it)return;
    if(it.k==='title'){const t=$('#o-title');this.off();t.focus();setCaret(t,getText(t).length);return}
    if(it.k==='btn'){it.el.click();this.items=this.collect();return}
    if(it.k==='ref'){openObj(it.oid);return}
    if(it.k==='field'){const fb=it.el.querySelector('.fb'),ref=it.el.querySelector('a.ref'),inp=it.el.querySelector('input.fv:not([readonly])');
      if(fb){fb.click();return}if(ref){openObj(ref.dataset.oid);return}if(inp){this.off();inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length);return}A.play('dull');return}
    const n=E.map.get(it.id);if(!n)return;const img=it.el.querySelector('img.ni');if(n.kind==='raw'&&img){lightbox(img.src);return}this.off();E.focus(n.id,null)},
  /* structural edits without leaving navigate mode */
  op(fn){const n=this.node();if(!n){A.play('dull');return}E.snap();if(fn(n)===false){E.undo.pop();A.play('dull');return}E.render();S.touch(E.o);this.land({node:n.id})},
  indent(){this.op(n=>{const s=E.sibs(n),i=s.indexOf(n);if(i<1||s[i-1].kind==='raw')return false;const p=s[i-1];s.splice(i,1);p.kids.push(n);p.open=true;A.play('tick')})},
  outdent(){this.op(n=>{const p=E.par.get(n.id);if(p===E.top()||p===E.root||(p.kind==='h'&&!p.inli))return false;const g=E.par.get(p.id);p.kids.splice(p.kids.indexOf(n),1);g.kids.splice(g.kids.indexOf(p)+1,0,n);A.play('tick')})},
  shift(d){this.op(n=>{const s=E.sibs(n),i=s.indexOf(n),j=i+d;if(j<0||j>=s.length)return false;s.splice(i,1);s.splice(j,0,n);A.play('tick')})},
  task(){this.op(n=>{n.task=n.task==null?' ':n.task===' '?'x':null;if(n.task&&n.kind==='p')n.kind='li';A.play(n.task==='x'?'confirm':'tick')})},
  remove(){const n=this.node();if(!n){A.play('dull');return}E.snap();const s=E.sibs(n);s.splice(s.indexOf(n),1);E.render();S.touch(E.o);this.items=this.collect();this.set(Math.min(this.i,this.items.length-1),{quiet:true});A.play('back');notice('Node deleted. Ctrl Z brings it back.',1600)},
  fold(open){const n=this.node();if(!n||!n.kids.length){A.play('dull');return false}if(open!=null&&n.open===open)return false;n.open=open==null?!n.open:open;E.render();this.land({node:n.id});A.play('cursor');return true},
  left(){const n=this.node();if(!n){this.move(-1);return}if(n.kids.length&&n.open){this.fold(false);return}const p=E.par.get(n.id);if(p&&p!==E.top()&&p!==E.root){this.land({node:p.id});A.play('cursor')}else A.play('dull')},
  right(){const n=this.node();if(!n){this.move(1);return}if(n.kids.length&&!n.open){this.fold(true);return}if(n.kids.length){this.land({node:n.kids[0].id});A.play('cursor')}else A.play('dull')},
  add(above){const n=this.node();const top=E.top();E.snap();const nn=mk(n&&n.kind==='li'?'li':'p','',{task:n&&n.task&&!above?' ':null});
    if(!n){top.kids.push(nn)}else{const s=E.sibs(n),i=s.indexOf(n);if(!above&&n.kids.length&&n.open)n.kids.unshift(nn);else s.splice(above?i:i+1,0,nn)}this.off();E.changed({id:nn.id,at:0});A.play('tick')},
  zoom(){const n=this.node();if(!n){A.play('dull');return}E.zoom=n.id;if(!n.kids.length)n.kids.push(mk('p',''));n.open=true;E.render();this.land({});A.play('air')},
  unzoom(){if(!E.zoom)return false;const was=E.zoom,p=E.par.get(was);E.zoom=p&&p!==E.root?p.id:null;E.render();this.land({node:was});A.play('back');return true},
  undo(redo){const key=this.cur()&&this.cur().key;E.restore(redo?E.redo:E.undo,redo?E.undo:E.redo);const a=document.activeElement;if(a&&a.blur)a.blur();this.land(key?{key}:{})},
  sibling(d){const o=E.o;if(!o)return;if(o.type==='DailyNote'&&o.day){A.play('cursor');openObj(dailyObj(shiftDay(o.day,d)).id);return}
    const list=V.ofType(o.type),i=list.indexOf(o),j=i+d;if(i<0||j<0||j>=list.length){A.play('dull');return}A.play('cursor');openObj(list[j].id)}};
document.addEventListener('focusin',e=>{if(view==='obj'&&e.target.closest&&e.target.closest('#sheet')&&editing())NAV.off()});
$('#v-obj').addEventListener('scroll',()=>{if(NAV.on){const it=NAV.cur();if(it&&it.el.isConnected)pointAt(it.el)}},{passive:true});
{const _r=E.render.bind(E);E.render=function(f){_r(f);if(NAV.on&&!f)NAV.refresh()}}

/* ---------- HINT: Follow. Every link or target on screen gets a keycap; type it to go ---------- */
const HINT={on:false,buf:'',list:[],layer:null,
  targets(){let sel=[];if(view==='obj')sel.push('#sheet a.ref','#sheet a.ext','#sheet .rg-h','#sheet .tagc','#sheet [data-day]','#sheet .capsule','#sheet #o-pin','#sheet img.ni');
    else if(view==='datalog')sel.push('#log-list .row','#log-types .tro','#p-open');else if(view==='party')sel.push('#cards .pc');else if(view==='crystarium')sel.push('#c-open');if(!sel.length)return[];
    const W=innerWidth,H=innerHeight,seen=new Set();return $$(sel.join(',')).filter(el=>{if(seen.has(el)||el.closest('[hidden]'))return false;seen.add(el);const b=el.getBoundingClientRect();return b.width>2&&b.height>2&&b.bottom>50&&b.top<H-40&&b.right>0&&b.left<W})},
  labels(n){const A1='asdfjklghqwertyuiopzxcvbnm';if(n<=A1.length)return[...A1].slice(0,n);const out=[];for(const a of 'asdfjklghqwertyuiop')for(const b of A1){out.push(a+b);if(out.length>=n)return out}return out},
  start(){if(this.on){this.stop();return}const els=this.targets();if(!els.length){A.play('dull');return}const labs=this.labels(els.length);this.buf='';this.on=true;
    this.layer=document.createElement('div');this.layer.className='hintlayer';document.body.appendChild(this.layer);body.classList.add('hinting');
    this.list=els.map((el,i)=>{const b=el.getBoundingClientRect(),h=document.createElement('span');h.className='hint';h.textContent=labs[i];h.style.left=Math.max(4,b.left-6)+'px';h.style.top=Math.max(4,b.top+Math.min(b.height,30)/2-10)+'px';this.layer.appendChild(h);
      if(!RM())h.animate([{opacity:0,transform:'scale(1.6)'},{opacity:1,transform:'none'}],{duration:T(180),delay:Math.min(i,24)*T(9),easing:'cubic-bezier(.34,1.56,.64,1)',fill:'backwards'});return{el,lab:labs[i],h}});
    A.play('air');pointAt(null);help('Follow: type the letters on a keycap. Esc cancels.')},
  stop(){if(!this.on)return;this.on=false;if(this.layer)this.layer.remove();this.layer=null;body.classList.remove('hinting');help();pointDefault();if(view==='obj'&&NAV.on)NAV.refresh()},
  key(e){const k=e.key;e.preventDefault();if(k==='Escape'||k==='f'&&!this.buf){this.stop();A.play('back');return}
    if(k==='Backspace'){this.buf=this.buf.slice(0,-1)}else if(/^[a-z]$/i.test(k))this.buf+=k.toLowerCase();else return;
    const m=this.list.filter(x=>x.lab.startsWith(this.buf));if(!m.length){A.play('dull');this.buf='';}
    this.list.forEach(x=>{const on=x.lab.startsWith(this.buf);x.h.classList.toggle('no',!on);x.h.innerHTML=on&&this.buf?`<i>${esc(this.buf)}</i>${esc(x.lab.slice(this.buf.length))}`:esc(x.lab)});
    const hit=m.length===1&&m[0].lab===this.buf?m[0]:this.list.find(x=>x.lab===this.buf&&m.length===1);if(hit){this.stop();this.fire(hit.el)}else if(m.length)A.play('tick')},
  fire(el){const b=el.getBoundingClientRect(),x=b.left+Math.min(b.width/2,60),y=b.top+b.height/2;FX.burst(x,y,10);A.play('confirm');
    if(el.matches('.pc')){const i=+el.dataset.i;if(PARTY[i])openObj(PARTY[i].id,{o0:{x,y}});return}
    if(el.matches('#log-list .row')){const r=DL.rows[+el.dataset.i];if(r)openObj(r.id);return}
    if(el.matches('img.ni')){lightbox(el.src);return}if(el.matches('a.ext')){openExt(el);return}
    if(el.matches('a.ref')){if(el.dataset.oid)openObj(el.dataset.oid);else if(el.dataset.new)createFromGhost(el.dataset.new);return}
    if(el.matches('.rg-h')){openObj(el.dataset.oid);return}el.click()}};

/* ---------- RING: Space opens every command for where you are; press its key ---------- */
const RING={el:null,items:[],
  groups(){const o=view==='obj'?E.o:null,g=[];
    g.push(['Go',[['T','Today',()=>go('today')],['P','Party',()=>go('party')],['D','Datalog',()=>go('datalog')],['C','Crystarium',()=>go('crystarium')],['[','Back',()=>NAVH.step(-1)],[']','Forward',()=>NAVH.step(1)],['1–6','Party slot',null]]]);
    g.push(['Find',[['K','Search everything',()=>PAL.open()],['F','Follow a link on screen',()=>HINT.start()],...(o?[[',','Previous '+(o.type==='DailyNote'?'day':typeInfo(o.type).label.toLowerCase()),()=>NAV.sibling(-1)],['.','Next '+(o.type==='DailyNote'?'day':typeInfo(o.type).label.toLowerCase()),()=>NAV.sibling(1)],['B','Backlinks',()=>{NAV.on||NAV.land();NAV.first('ref')}]]:[]),['>','Run a command by name',()=>PAL.open('>')]]]);
    g.push(['Make',[['A','Add an entry to today',()=>capture()],['N','New object…',()=>PAL.open('','new')],...(o?[['O','New line below',()=>{NAV.on||NAV.land();NAV.add(false)}],['Shift O','New line above',null]]:[])]]);
    if(o)g.push(['This note',[['Enter','Edit the line',null],['X','Task ☐ → ☑ → none',()=>{NAV.on||NAV.land();NAV.task()}],['Tab','Indent · Shift Tab outdent',null],['Shift ↑↓','Move the line',null],['← →','Fold · unfold',null],['Z','Zoom into the line',()=>{NAV.on||NAV.land();NAV.zoom()}],['Del','Delete the line',null],['R','Rename',()=>{NAV.land({title:1});NAV.activate()}],['Y','Copy [[link]]',()=>copyLink(o)],['*','Pin to Party',()=>togglePin(o)],['Ctrl Z','Undo',null]]]);
    g.push(['System',[['W','Switch world',()=>setWorld(P.world==='pearl'?'pulse':'pearl')],['M','Sound on / off',()=>setSound(!P.sound)],['S','Settings',()=>openSettings()],['Esc','Step out · back',null],['Space','Close this',null],...(NATIVE.on&&NATIVE.info?[[NATIVE.info.hotkey.replace(/Control/,'Ctrl').split('+').join(' '),'Capture from anywhere in Windows',null],['F11','Full screen',null]]:[])]]);return g},
  open(){if(this.el){this.close();return}HINT.stop();const gs=this.groups();this.items=gs.flatMap(x=>x[1]).filter(x=>x[2]);
    const el=document.createElement('div');el.id='ring';el.innerHTML=`<div class="rp frame"><div class="frame-in"><div class="rh"><b>Commands</b><span class="micro">${esc(view==='obj'&&E.o?typeInfo(E.o.type).label+' · '+E.o.title.slice(0,60):NAMES[view]?NAMES[view][0]:'')}</span></div><div class="rcols">${gs.map(([h,its])=>`<section><h4 class="micro">${esc(h)}</h4>${its.map(([k,l,f])=>`<div class="ri${f?'':' static'}" data-k="${esc(k)}"><span class="rk">${k.split(' ').map(x=>`<kbd>${esc(x)}</kbd>`).join('')}</span><span>${esc(l)}</span></div>`).join('')}</section>`).join('')}</div></div></div>`;
    el.addEventListener('mousedown',e=>{const r=e.target.closest('.ri');if(e.target===el){this.close();return}if(r){const it=this.items.find(x=>x[0]===r.dataset.k);if(it){e.preventDefault();this.run(it)}}});
    document.body.appendChild(el);this.el=el;A.play('confirm');pointAt(null);
    if(!RM()){el.querySelector('.rp').animate([{opacity:0,transform:'translateY(12px) scale(.98)'},{opacity:1,transform:'none'}],{duration:T(220),easing:QUICK});$$('.ri',el).forEach((r,i)=>r.animate([{opacity:0,transform:'translateX(-14px)'},{opacity:1,transform:'none'}],{duration:T(200),delay:T(60)+i*T(8),easing:QUICK,fill:'backwards'}))}},
  close(quiet){if(!this.el)return;this.el.remove();this.el=null;if(!quiet)A.play('back');pointDefault();if(NAV.on)NAV.refresh()},
  key(e){e.preventDefault();const k=e.key;if(k==='Escape'||k===' '||k==='?'){this.close();return}const it=this.items.find(x=>x[0].toLowerCase()===k.toLowerCase());if(it)this.run(it);else A.play('dull')},
  run(it){const r=this.el&&this.el.querySelector(`.ri[data-k="${CSS.escape(it[0])}"]`);if(r&&!RM())r.animate([{background:'rgba(143,230,240,.5)'},{background:'transparent'}],{duration:T(200)});this.close(true);A.play('confirm');setTimeout(()=>it[2](),RM()?0:T(90))}};

function copyLink(o){if(!o)return;const s='[['+o.title+']]';(navigator.clipboard?navigator.clipboard.writeText(s):Promise.reject()).then(()=>notice(`Copied <b>${esc(s)}</b>`,1600)).catch(()=>notice('Could not reach the clipboard.'));A.play('tick')}
/* A: capture. Jump to today and start a time-stamped entry, from anywhere */
function capture(){const td=dailyObj(todayYmd());if(view==='obj'&&E.o===td){NAV.off();stampEntry();return}openObj(td.id,{cap:true})}

/* ---------- the router: every key goes through here ---------- */
const NAVKEYS=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','Escape','Tab','Delete','Home','End','PageUp','PageDown',' ']);
function handleKey(e){const k=e.key,K=k.length===1?k.toLowerCase():k,mod=e.ctrlKey||e.metaKey,sh=e.shiftKey;
  if(k==='__go'){go(e.v);return}
  if(mod&&K==='k'&&view!=='title'){e.preventDefault();HINT.stop();RING.close(true);if(pal.hidden)PAL.open();else PAL.close();return}
  if(mod&&K==='s'){e.preventDefault();S.flush();return}
  if(e.defaultPrevented||!pal.hidden)return;
  if(HINT.on){HINT.key(e);return}if(RING.el){RING.key(e);return}
  if(!$('#lightbox').hidden){if(k==='Escape'||k===' '||k==='Enter'){e.preventDefault();$('#lightbox').hidden=true;A.play('back')}return}
  const ae=document.activeElement;
  if(!settings.hidden){const rows=$$('#s-rows .s-row').concat($('#s-close')),i=rows.indexOf(ae&&ae.closest('.s-row,#s-close'));
    if(k==='Escape'){e.preventDefault();closeSettings()}else if(k==='ArrowDown'||k==='ArrowUp'){e.preventDefault();rows[clamp((i<0?0:i)+(k==='ArrowDown'?1:-1),0,rows.length-1)].focus();A.play('cursor')}
    else if((k==='ArrowLeft'||k==='ArrowRight')&&i>=0&&i<SET.length){e.preventDefault();cycle(i,k==='ArrowLeft'?-1:1)}else if((k==='Enter'||k===' ')&&i>=0&&i<SET.length){e.preventDefault();cycle(i,1)}return}
  if(view==='title'){const bs=$$('.t-menu button:not([disabled])'),i=bs.indexOf(ae);if(k==='ArrowDown'||k==='ArrowUp'){e.preventDefault();bs[clamp((i<0?0:i)+(k==='ArrowDown'?1:-1),0,bs.length-1)].focus();A.play('cursor')}return}
  if(editing())return;
  /* mid-transition: hold the key and replay it when the screen lands, instead of dropping it */
  if(busy||!$('#fog').hidden){if(k.length===1||NAVKEYS.has(k)){e.preventDefault();if(QQ.length<12)QQ.push({key:k,shiftKey:sh,altKey:e.altKey,ctrlKey:e.ctrlKey,metaKey:e.metaKey,preventDefault(){},defaultPrevented:false})}return}
  if(e.altKey&&(k==='ArrowLeft'||k==='ArrowRight')){e.preventDefault();NAVH.step(k==='ArrowLeft'?-1:1);return}
  if(mod){if(view==='obj'&&(K==='z'||K==='y')){e.preventDefault();NAV.undo(K==='y'||sh);}return}
  /* global letters */
  if(k===' '||k==='?'){e.preventDefault();RING.open();return}
  if(K==='f'&&!sh){e.preventDefault();HINT.start();return}
  if(k==='['||k===']'){e.preventDefault();NAVH.step(k==='['?-1:1);return}
  if(K==='m'){setSound(!P.sound);return}if(K==='w'){setWorld(P.world==='pearl'?'pulse':'pearl');return}
  if(K==='t'){go('today');return}if(K==='d'){go('datalog');return}if(K==='c'){go('crystarium');return}if(K==='p'){go('party');return}
  if(K==='a'){e.preventDefault();capture();return}
  if(/^[1-6]$/.test(k)){const list=view==='party'?PARTY:partyList();const o=list[+k-1];if(!o){A.play('dull');return}if(view==='party')partySelect(+k-1,{quiet:true});const b=view==='party'&&$(`#cards .pc[data-i="${+k-1}"]`),bb=b&&b.getBoundingClientRect();openObj(o.id,bb?{o0:{x:bb.left+bb.width/2,y:bb.top+bb.height*.6}}:{});return}
  if(K==='k'||(k==='/'&&view!=='datalog')){e.preventDefault();PAL.open();return}
  if(K==='n'){e.preventDefault();PAL.open('','new');return}if(K==='s'){openSettings();return}
  if(k==='Escape'){e.preventDefault();
    if(view==='crystarium'&&CX.far){CX.toggleFar();return}if($('#pane').classList.contains('open')){$('#pane').classList.remove('open');A.play('back');return}
    if(view==='obj'&&NAV.unzoom())return;
    if(NAVH.back.length){NAVH.step(-1);return}if(view==='obj'){A.play('back');go(lastList&&lastList!=='obj'?lastList:'party');return}if(view!=='party'){A.play('back');go('party');return}A.play('dull');return}
  if(view==='obj')return objKey(e);
  if(view==='party'){if(k==='ArrowRight'||k==='ArrowLeft'||k==='ArrowDown'||k==='ArrowUp'){e.preventDefault();const n=psel+(k==='ArrowRight'||k==='ArrowDown'?1:-1);if(n<0||n>=PARTY.length)A.play('dull');else partySelect(n,{focus:true})}
    else if(k==='Home'||k==='End'){e.preventDefault();partySelect(k==='Home'?0:PARTY.length-1)}
    else if(k==='Enter'&&!(ae&&ae.closest('.pc,button,a'))){e.preventDefault();const b=$(`#cards .pc[data-i="${psel}"]`);if(b)b.click()}return}
  if(view==='crystarium'){if(k==='Tab'){e.preventDefault();CX.hop(sh?-1:1);return}if(k.startsWith('Arrow'))CX.anchor=null;
    if(k==='ArrowRight'){e.preventDefault();CX.step(1)}else if(k==='ArrowLeft'){e.preventDefault();CX.step(-1)}else if(k==='ArrowUp'){e.preventDefault();CX.ring(1)}else if(k==='ArrowDown'){e.preventDefault();CX.ring(-1)}else if(K==='z')CX.toggleFar();
    else if(k==='Enter'&&!(ae&&ae.closest('button,a'))){e.preventDefault();const n=CX.nodes[CX.sel];if(n)openObj(n.o.id,{o0:CX.screenOf(CX.sel)})}return}
  if(view==='datalog'){const mv=d=>{const n=clamp(DL.sel+d,0,DL.rows.length-1);if(n===DL.sel)A.play('dull');else DL.select(n,{focus:true})};
    if(k==='ArrowDown'||k==='ArrowUp'){e.preventDefault();mv(k==='ArrowDown'?1:-1)}else if(k==='PageDown'||k==='PageUp'){e.preventDefault();mv(k==='PageDown'?10:-10)}else if(k==='Home'||k==='End'){e.preventDefault();mv(k==='Home'?-1e4:1e4)}
    else if(k==='ArrowLeft'||k==='ArrowRight'||k==='Tab'){e.preventDefault();DL.stepType(k==='ArrowRight'||(k==='Tab'&&!sh)?1:-1)}
    else if(k==='/'){e.preventDefault();$('#log-filter').focus()}
    else if(k==='Enter'&&!(ae&&ae.closest('button'))){e.preventDefault();if(DL.rows[DL.sel])openObj(DL.rows[DL.sel].id)}}}
function objKey(e){const k=e.key,K=k.length===1?k.toLowerCase():k,sh=e.shiftKey;
  if(K==='y'){copyLink(E.o);return}if(k==='*'){togglePin(E.o);return}
  if(k===','||k==='.'){NAV.sibling(k===','?-1:1);return}
  if(K==='b'){NAV.first('ref');return}
  if(K==='r'){e.preventDefault();NAV.land({title:1});NAV.activate();return}
  if(k.length===1&&/[a-z]/i.test(k)&&!/[xozeirby]/i.test(k)){A.play('dull');help('Letters are commands while navigating. Press Enter (or E) to write on this line, O for a new one.');return}
  if(!NAV.on){if(k.length===1&&!/[xoze]/i.test(k))return;e.preventDefault();NAV.land(NAV.lastKey?{key:NAV.lastKey}:{});return}
  if(k==='ArrowUp'||k==='ArrowDown'){e.preventDefault();const d=k==='ArrowDown'?1:-1;if(sh||e.altKey)NAV.shift(d);else NAV.move(d);return}
  if(k==='ArrowLeft'){e.preventDefault();NAV.left();return}if(k==='ArrowRight'){e.preventDefault();NAV.right();return}
  if(k==='PageDown'||k==='PageUp'){e.preventDefault();NAV.items=NAV.collect();NAV.set(NAV.i+(k==='PageDown'?10:-10));return}
  if(k==='Home'||k==='End'){e.preventDefault();NAV.items=NAV.collect();NAV.set(k==='Home'?0:NAV.items.length-1);return}
  if(k==='Enter'||K==='e'||K==='i'){e.preventDefault();NAV.activate();return}
  if(k==='Tab'){e.preventDefault();sh?NAV.outdent():NAV.indent();return}
  if(k==='Delete'||(k==='Backspace'&&sh)){e.preventDefault();NAV.remove();return}
  if(K==='o'){e.preventDefault();NAV.add(sh);return}
  if(K==='x'){NAV.task();return}
  if(K==='z'){sh?NAV.unzoom()||A.play('dull'):NAV.zoom();return}
}
addEventListener('keydown',handleKey);
