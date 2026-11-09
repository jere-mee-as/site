/* ===================== prelude ===================== */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const root=document.documentElement,body=document.body;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const EASE='cubic-bezier(.16,1,.3,1)',QUICK='cubic-bezier(.2,.8,.2,1)';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,d){try{const v=localStorage.getItem('jp1.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('jp1.'+k,JSON.stringify(v))}catch(e){}}};
const P={world:store.get('world','pearl'),tempo:store.get('tempo','game'),sound:store.get('sound',true),music:store.get('music',false),motion:store.get('motion',matchMedia('(prefers-reduced-motion: reduce)').matches?'reduced':'full')};
const RM=()=>P.motion==='reduced';
const T=ms=>RM()?Math.min(ms,180):Math.round(ms*(P.tempo==='cinematic'?1.55:1));
const PHONE=()=>innerWidth<=760;
root.dataset.world=P.world;root.dataset.motion=P.motion;
const setXF=()=>root.style.setProperty('--xf',T(333)+'ms');setXF();
const pad2=n=>String(n).padStart(2,'0');
const humanize=k=>k.replace(/_$/,'').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,c=>c.toUpperCase());
const todayYmd=()=>ymd(new Date());
const editing=()=>{const a=document.activeElement;return!!a&&(a.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))};

/* ===================== storage: the folder on disk (or an in-browser copy) ===================== */
const IDB={p:null,open(){return this.p||(this.p=new Promise((res,rej)=>{const r=indexedDB.open('jeres-place',1);r.onupgradeneeded=()=>{r.result.createObjectStore('kv');r.result.createObjectStore('overlay')};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))},
  async tx(st,mode,f){const db=await this.open();return new Promise((res,rej)=>{const t=db.transaction(st,mode),s=t.objectStore(st);const q=f(s);t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)})},
  get(st,k){return this.tx(st,'readonly',s=>s.get(k))},set(st,k,v){return this.tx(st,'readwrite',s=>s.put(v,k))},del(st,k){return this.tx(st,'readwrite',s=>s.delete(k))},
  async all(st){const db=await this.open();return new Promise((res,rej)=>{const s=db.transaction(st).objectStore(st),out={};const c=s.openCursor();c.onsuccess=()=>{const x=c.result;if(x){out[x.key]=x.value;x.continue()}else res(out)};c.onerror=()=>rej(c.error)})}};
const B={kind:'none',name:'',dir:null,files:null,blobs:new Map(),
  async restore(){if(window.JP_TEST_FILES){this.useMemory(window.JP_TEST_FILES,window.JP_TEST_NAME||"Jere's Place");return'ready'}
    try{const h=await IDB.get('kv','root');if(h&&h.kind==='directory'){this.dir=h;this.name=h.name;this.kind='fs';const p=await h.queryPermission({mode:'readwrite'});return p==='granted'?'ready':'perm'}}catch(e){}
    return'none'},
  async request(fresh){if(!fresh&&this.kind==='fs'&&this.dir){try{if(await this.dir.requestPermission({mode:'readwrite'})==='granted')return true}catch(e){}}
    if(!window.showDirectoryPicker)return false;const h=await showDirectoryPicker({id:'jeres-place',mode:'readwrite'});this.dir=h;this.name=h.name;this.kind='fs';this.blobs.clear();try{await IDB.set('kv','root',h)}catch(e){}return true},
  useMemory(files,name){this.kind='mem';this.name=name;this.files=new Map(files.map(f=>[f.path,{text:f.text,mtime:f.mtime||1}]))},
  async list(){if(this.kind==='mem'){let ov={};try{ov=await IDB.all('overlay')}catch(e){}const pre=this.name+'::';for(const k in ov)if(k.startsWith(pre)){const p=k.slice(pre.length);if(ov[k]===null)this.files.delete(p);else this.files.set(p,{text:ov[k],mtime:2})}return[...this.files].map(([path,f])=>({path,text:f.text,mtime:f.mtime}))}
    const out=[];const walkD=async(d,pre)=>{for await(const[name,h]of d.entries()){if(name[0]==='.'||name[0]==='_')continue;if(h.kind==='directory'){if(name==='Media'||name==='node_modules')continue;await walkD(h,pre+name+'/')}else if(/\.md$/i.test(name)){try{const f=await h.getFile();out.push({path:pre+name,text:await f.text(),mtime:f.lastModified})}catch(e){}}}};await walkD(this.dir,'');return out},
  async fh(path,create){const parts=path.split('/');let d=this.dir;for(const p of parts.slice(0,-1))d=await d.getDirectoryHandle(p,{create});return d.getFileHandle(parts[parts.length-1],{create})},
  async stat(path){if(this.kind==='mem'){const f=this.files.get(path);return f?{mtime:f.mtime}:null}try{const f=await(await this.fh(path,false)).getFile();return{mtime:f.lastModified}}catch(e){return null}},
  async read(path){if(this.kind==='mem'){const f=this.files.get(path);return f?{...f}:null}const f=await(await this.fh(path,false)).getFile();return{text:await f.text(),mtime:f.lastModified}},
  async write(path,text){if(this.kind==='mem'){const m=Date.now();this.files.set(path,{text,mtime:m});try{await IDB.set('overlay',this.name+'::'+path,text)}catch(e){}return m}
    const h=await this.fh(path,true);const w=await h.createWritable();await w.write(text);await w.close();return(await h.getFile()).lastModified},
  async remove(path){if(this.kind==='mem'){this.files.delete(path);try{await IDB.set('overlay',this.name+'::'+path,null)}catch(e){}return}const parts=path.split('/');let d=this.dir;for(const p of parts.slice(0,-1))d=await d.getDirectoryHandle(p);await d.removeEntry(parts[parts.length-1])},
  async media(vp){if(this.kind!=='fs')return encPath(vp);if(this.blobs.has(vp))return this.blobs.get(vp);try{const f=await(await this.fh(vp,false)).getFile();const u=URL.createObjectURL(f);this.blobs.set(vp,u);return u}catch(e){return encPath(vp)}}};

/* ---------- saving: debounced, conflict-safe ---------- */
const S={q:new Set(),t:0,state:'saved',
  touch(o){if(!o)return;o.dirty=true;this.q.add(o);this.set('dirty');clearTimeout(this.t);this.t=setTimeout(()=>this.flush(),650)},
  async flush(){clearTimeout(this.t);const list=[...this.q];this.q.clear();let ok=true;for(const o of list)ok=(await this.save(o))&&ok;if(!this.q.size)this.set(ok?'saved':'err')},
  async save(o){if(B.kind==='none'){this.set('err');return false}const text=V.text(o);
    try{if(B.kind==='fs'&&!o.virtual&&o.mtime){const st=await B.stat(o.path);if(st&&st.mtime>o.mtime+2){const disk=await B.read(o.path);if(disk.text!==o.disk&&disk.text!==text){
          const cp=o.path.replace(/\.md$/i,'')+" (edited in Jere's Place).md";await B.write(cp,text.replace(/^title: .*$/m,'title: '+fmtVal(o.title+' (edited copy)')));V.add(cp,await(await B.read(cp)).text,Date.now());
          V.parse(o,disk.text);o.disk=disk.text;o.mtime=disk.mtime;o.dirty=false;V.reindex();notice(`<b>${esc(o.title)}</b> changed on disk. Reloaded it; your edit is saved beside it as a copy.`,7000);if(E.o===o)openObj(o.id,{push:false,quiet:true});return true}}}
      o.mtime=await B.write(o.path,text);o.disk=text;o.dirty=false;
      if(o.virtual){o.virtual=false;V.objs.set(o.id,o);V.reindex();CX.dirty=true}else if(o._tchanged){o._tchanged=false;V.reindex();CX.dirty=true}else V.indexOne(o);
      refreshCounts();if(E.o===o&&view==='obj'){sheetMeta(o);objInfo(o)}return true}
    catch(e){console.warn(e);notice('Could not save <b>'+esc(o.title)+'</b>: '+esc(e.message||e),7000);return false}},
  set(s){this.state=s;const el=$('#o-save');if(el){el.className='o-save micro'+(s==='dirty'?' dirty':s==='err'?' err':'');el.textContent=E.o&&E.o.virtual&&s!=='err'?'':s==='dirty'?'● Saving':s==='err'?'⚠ Not saved':B.kind==='mem'?'✓ Kept in browser':'✓ Saved'}}};
addEventListener('visibilitychange',()=>{if(document.hidden)S.flush()});
addEventListener('beforeunload',e=>{if(S.q.size&&!window.jpNative){S.flush();e.preventDefault();e.returnValue=''}});

/* ---------- creating objects ---------- */
function newPath(type,title){const dir=typeInfo(type).dir;const base=safeName(title);let p=dir+'/'+base+'.md',i=1;while(V.objs.has(p))p=dir+'/'+base+' ('+(i++)+').md';return p}
function blankObj(path,text){const o={id:path,path,mtime:0,disk:'',virtual:true};V.parse(o,text);V.indexOne(o,true);return o}
async function createObj(type,title,{body='',fields={}}={}){const p=newPath(type,title);
  const fm=['type: '+fmtVal(type),'title: '+fmtVal(title),'description: null','createdAt: '+fmtVal(new Date().toISOString()),'tags: []',...Object.entries(fields).map(([k,v])=>k+': '+fmtVal(v))].join('\n');
  const o=blankObj(p,'---\n'+fm+'\n---\n\n# '+title+'\n\n'+(body?body+'\n':''));await S.save(o);return o}
const VIRT=new Map();
function dailyObj(day){for(const o of V.objs.values())if(o.day===day&&o.path==='DailyNotes/'+day+'.md')return o;for(const o of V.objs.values())if(o.day===day)return o;if(VIRT.has(day))return VIRT.get(day);
  const d=new Date(day+'T12:00:00'),title=d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const o=blankObj('DailyNotes/'+day+'.md',`---\ntype: 'DailyNote'\ntitle: ${title}\ndate: '${day}T00:00:00.000Z'\ntags: []\nreviewed: false\n---\n\n# ${title}\n\n`);VIRT.set(day,o);return o}
const getObj=id=>V.objs.get(id)||[...VIRT.values()].find(o=>o.id===id)||null;

/* ===================== inline rendering ===================== */
const STAMP=/^\d{1,2}:\d{2}(\s?[AP]M)?$/i;
function emph(h){return h.replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*([^*\s](?:[^*\n]*?[^*\s])?)\*(?!\*)/g,'$1<i>$2</i>').replace(/(^|[^\w])_([^_\s][^_\n]*?)_(?!\w)/g,'$1<i>$2</i>').replace(/~~([^~\n]+)~~/g,'<s>$1</s>')}
function refChip(id,label,small){const o=getObj(id);const c=o?typeInfo(o.type).c:'#8fe6f0';return`<a class="ref${small?' small':''}" data-oid="${esc(id)}" style="--c:${c}" href="#o/${encodeURIComponent(id)}" data-help="${esc(o?typeInfo(o.type).label+': '+o.title:'')}">${esc(label)}</a>`}
const INL=/!\[([^\]\n]*)\]\(([^)\s]+)\)|\[\[([^\]|\n]+)(?:\|([^\]\n]*))?\]\]|\[([^\]\n]*)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>()\]]*[^\s<>()\].,;:!?'"*])|(^|[\s(])#([A-Za-z][\w\-\/]*)|`([^`\n]+)`/g;
function inl(s,o){s=String(s??'');let out='',last=0,m;INL.lastIndex=0;const from=o?o.path:'';
  while((m=INL.exec(s))){out+=emph(esc(s.slice(last,m.index)));
    if(m[2]!==undefined){const vp=joinPath(dirOf(from),m[2]);out+=vp?`<img class="ni" data-vp="${esc(vp)}"${B.kind==='fs'?'':` src="${esc(encPath(vp))}"`} alt="${esc(m[1])}" loading="lazy">`:esc(m[0])}
    else if(m[3]!==undefined){const id=V.resolve(m[3],from);let lab=m[4]||m[3];if(/ - Notes$/.test(lab))lab='notes';out+=id?refChip(id,lab):`<a class="ref ghost" data-new="${esc(m[3].trim())}" data-help="Not created yet. Click to create it.">${esc(lab)}</a>`}
    else if(m[6]!==undefined){const url=m[6],lab=m[5];if(/\.md$/i.test(url)&&!/^[a-z]+:/i.test(url)){const id=V.resolve(url,from);out+=id?refChip(id,/ - Notes$/.test(lab)?'notes':lab):esc(lab)}
      else if(/^[a-z]+:/i.test(url))out+=`<a class="ext" href="${esc(url)}" target="_blank" rel="noopener">${esc(lab||url)}</a>`;
      else{const vp=joinPath(dirOf(from),url);out+=`<a class="ext" data-vp="${esc(vp||'')}" href="${esc(vp?encPath(vp):'#')}" target="_blank" rel="noopener">${esc(lab||url)}</a>`}}
    else if(m[7]!==undefined)out+=`<a class="ext" href="${esc(m[7])}" target="_blank" rel="noopener">${esc(m[7].replace(/^https?:\/\/(www\.)?/,'').slice(0,60))}</a>`;
    else if(m[9]!==undefined){const ty=typeForTag(m[9]);out+=esc(m[8])+`<span class="tagc${ty?' st':''}" data-tag="${esc(m[9])}"${ty?` style="--c:${typeInfo(ty).c}"`:''}>${esc(m[9])}</span>`}
    else if(m[10]!==undefined)out+=`<code>${esc(m[10])}</code>`;
    last=INL.lastIndex}
  return out+emph(esc(s.slice(last)))}
function renderRaw(t,o){const s=String(t);if(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(s))return'<hr>';
  if(/^\s*\|/.test(s)){const rows=s.split('\n').filter(l=>l.trim()&&!/^\s*\|?\s*:?-{2,}/.test(l)).map(l=>l.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim()));return'<table>'+rows.map((r,i)=>'<tr>'+r.map(c=>i?`<td>${inl(c,o)}</td>`:`<th>${inl(c,o)}</th>`).join('')+'</tr>').join('')+'</table>'}
  if(/^\s*(```|~~~)/.test(s))return'<pre>'+esc(s.replace(/^\s*(```|~~~)[^\n]*\n?/,'').replace(/\n?\s*(```|~~~)\s*$/,''))+'</pre>';return inl(s,o)}
const renderNode=(n,o)=>n.kind==='raw'?renderRaw(n.text,o):inl(n.text,o);
function hydrate(el){$$('img[data-vp]:not([src])',el).forEach(img=>B.media(img.dataset.vp).then(u=>{img.src=u}))}
const superOf=t=>{for(const x of inlineTags(t)){const ty=typeForTag(x);if(ty)return ty}return null};

/* ---------- caret helpers (contenteditable, plain text) ---------- */
function getText(el){let s='';const w=n=>{for(const c of n.childNodes){if(c.nodeType===3)s+=c.data;else if(c.nodeName==='BR')s+='\n';else if(c.nodeName==='DIV'||c.nodeName==='P'){if(s&&!s.endsWith('\n'))s+='\n';w(c)}else w(c)}};w(el);return s}
function offOf(el,node,off){const r=document.createRange();r.selectNodeContents(el);try{r.setEnd(node,off)}catch(e){return 0}const d=document.createElement('div');d.appendChild(r.cloneContents());return getText(d).length}
function caret(el){const s=getSelection();if(!s.rangeCount)return 0;const r=s.getRangeAt(0);return el.contains(r.startContainer)?offOf(el,r.startContainer,r.startOffset):0}
function selRange(el){const s=getSelection();if(!s.rangeCount)return[0,0];const r=s.getRangeAt(0);return[offOf(el,r.startContainer,r.startOffset),offOf(el,r.endContainer,r.endOffset)]}
function setCaret(el,off,end){const s=getSelection(),r=document.createRange();const place=(o,setter)=>{let left=o,done=false;const w=n=>{for(const c of n.childNodes){if(done)return;if(c.nodeType===3){if(left<=c.data.length){r[setter](c,left);done=true;return}left-=c.data.length}else if(c.nodeName==='BR'){if(left===0){r[setter+'Before']?r[setter+'Before'](c):0;done=true;return}left--}else w(c)}};w(el);if(!done){const t=document.createRange();t.selectNodeContents(el);r[setter](t.endContainer,t.endOffset)}};
  place(off,'setStart');if(end!=null&&end!==off)place(end,'setEnd');else r.collapse(true);s.removeAllRanges();s.addRange(r)}
function caretRect(){const s=getSelection();if(!s.rangeCount)return null;const r=s.getRangeAt(0).cloneRange();r.collapse(true);let b=r.getClientRects()[0];if(!b){const sp=document.createElement('span');sp.textContent='​';r.insertNode(sp);b=sp.getBoundingClientRect();sp.remove()}return b}
function lineEdge(el,up){const b=caretRect();if(!b)return true;const e=el.getBoundingClientRect(),lh=parseFloat(getComputedStyle(el).lineHeight)||24;return up?b.top-e.top<lh*.9:e.bottom-b.bottom<lh*.9}
function rawOffset(raw,off){let lo=0,hi=raw.length;while(lo<hi){const mid=(lo+hi)>>1;if(plainText(raw.slice(0,mid)).length<off)lo=mid+1;else hi=mid}return lo}

/* ===================== the outliner (Tana-style) ===================== */
const E={o:null,root:null,map:new Map(),par:new Map(),zoom:null,focusId:null,typed:false,undo:[],redo:[],pendingAt:null,
  mount(o){this.o=o;this.root=V.getOutline(o);this.zoom=null;this.undo=[];this.redo=[];this.focusId=null;this.render()},
  index(){this.map.clear();this.par.clear();const f=n=>{for(const k of n.kids){this.map.set(k.id,k);this.par.set(k.id,n);f(k)}};f(this.root)},
  top(){return(this.zoom&&this.map.get(this.zoom))||this.root},
  render(f){this.index();if(this.zoom&&!this.map.has(this.zoom))this.zoom=null;const top=this.top();if(!top.kids.length){top.kids.push(mk('p',''));this.index()}
    const ol=$('#ol');if(!ol)return;const only=top.kids.length===1&&!top.kids[0].text&&!top.kids[0].kids.length;
    this.rendering=true;ol.innerHTML=top.kids.map(n=>this.html(n,only)).join('');this.rendering=false;hydrate(ol);this.crumbs();if(f)this.focus(f.id,f.at)},
  html(n,ph){const cls=['nd','k-'+n.kind];if(n.kind==='h')cls.push('h'+(n.level||2));if(n.task)cls.push(n.task==='x'?'done':'task');if(n.kids.length&&!n.open)cls.push('closed');if(n.kind==='p'&&STAMP.test(n.text.trim()))cls.push('stamp');
    const st=n.kind!=='raw'&&superOf(n.text);if(st)cls.push('typed');
    return`<div class="${cls.join(' ')}" data-id="${n.id}"${st?` style="--c:${typeInfo(st).c}"`:''}><div class="nr"><button type="button" class="tg" tabindex="-1" aria-label="Fold">${n.kids.length?'▼':''}</button><button type="button" class="bu" tabindex="-1" aria-label="Zoom in" data-help="Zoom into this node. [Alt →]"></button>${n.task?`<button type="button" class="ck${n.task==='x'?' on':''}" tabindex="-1" aria-label="Done">${n.task==='x'?'✓':''}</button>`:''}<div class="nt" contenteditable="plaintext-only" spellcheck="true"${ph?' data-ph="Write here.  [[ links · # supertags · / commands"':''}>${renderNode(n,this.o)}</div>${st?`<button type="button" class="crys" tabindex="-1" data-help="Crystallize: turn this node into its own ${esc(typeInfo(st).label)}. [Alt Enter]">◇ ${esc(typeInfo(st).label)}</button>`:''}</div>${n.kids.length&&n.open?`<div class="kids">${n.kids.map(k=>this.html(k)).join('')}</div>`:''}</div>`},
  crumbs(){const c=$('#crumbs');if(!c)return;if(!this.zoom){c.hidden=true;return}const path=[];let x=this.map.get(this.zoom);while(x&&x!==this.root){path.unshift(x);x=this.par.get(x.id)}
    c.hidden=false;c.innerHTML=`<button type="button" data-z="">◇ ${esc(this.o.title.slice(0,40))}</button>`+path.map((n,i)=>' › '+(i===path.length-1?`<b>${esc(plainText(n.text).slice(0,60)||'…')}</b>`:`<button type="button" data-z="${n.id}">${esc(plainText(n.text).slice(0,40)||'…')}</button>`)).join('')},
  el(id){return $(`#ol .nd[data-id="${id}"]>.nr>.nt`)},
  focus(id,at){const el=this.el(id);if(!el)return;this.pendingAt=at==null?null:at;el.focus({preventScroll:true});const b=el.getBoundingClientRect(),v=$('#v-obj').getBoundingClientRect();if(b.top<v.top+20||b.bottom>v.bottom-20)el.scrollIntoView({block:'nearest'})},
  node(el){const d=el&&el.closest('.nd');return d?this.map.get(d.dataset.id):null},
  sibs(n){return this.par.get(n.id).kids},
  snap(){this.undo.push({root:cloneTree(this.root),f:{id:this.focusId,at:this.focusId&&this.el(this.focusId)?caret(this.el(this.focusId)):0},zoom:this.zoom});if(this.undo.length>80)this.undo.shift();this.redo=[]},
  restore(from,to){const s=from.pop();if(!s){A.play('dull');return}to.push({root:cloneTree(this.root),f:{id:this.focusId,at:0},zoom:this.zoom});this.root=s.root;this.o.outline=this.root;this.zoom=s.zoom;this.render(s.f);S.touch(this.o)},
  changed(f){this.render(f);S.touch(this.o)},
  visible(){return $$('#ol .nt')},
  kindAfter(n){return n.kind==='li'?'li':'p'},
  split(n,el){const t=getText(el),c=caret(el);n.text=t;
    /* Enter on an empty task drops the checkbox instead of making another one (like lists everywhere else) */
    if(n.task&&!t.trim()&&!n.kids.length){this.snap();n.task=null;if(n.kind==='li'&&!n.ord)n.kind='p';this.changed({id:n.id,at:0});A.play('back');return}
    this.snap();const props={task:n.task&&t.trim()?' ':null,ord:n.kind==='li'&&n.ord};
    if(c===0&&t.length){const nn=mk(this.kindAfter(n),'',props);this.sibs(n).splice(this.sibs(n).indexOf(n),0,nn);this.changed({id:n.id,at:0});A.play('tick');return}
    n.text=t.slice(0,c);const nn=mk(this.kindAfter(n),t.slice(c),props);
    if((n.kind==='h'&&!n.inli)||(n.kids.length&&n.open)){if(n.kind==='h')nn.kind='p';n.kids.unshift(nn);n.open=true}else{const s=this.sibs(n);s.splice(s.indexOf(n)+1,0,nn)}
    this.changed({id:nn.id,at:0});A.play('tick')},
  indent(n,el){n.text=getText(el);const at=caret(el),s=this.sibs(n),i=s.indexOf(n);if(i<1||s[i-1].kind==='raw'){A.play('dull');return}this.snap();const p=s[i-1];s.splice(i,1);p.kids.push(n);p.open=true;this.changed({id:n.id,at})},
  outdent(n,el){n.text=getText(el);const at=caret(el),p=this.par.get(n.id);if(p===this.top()||p===this.root){A.play('dull');return}if(p.kind==='h'&&!p.inli){A.play('dull');help('Text under a heading belongs to that heading. Move it with Alt Shift ↑ instead.');return}
    this.snap();const g=this.par.get(p.id);p.kids.splice(p.kids.indexOf(n),1);g.kids.splice(g.kids.indexOf(p)+1,0,n);this.changed({id:n.id,at})},
  back(n,el){const t=getText(el),list=this.visible(),i=list.indexOf(el),prevEl=list[i-1],prev=prevEl&&this.node(prevEl);
    if(!t.length){if(!prev&&!n.kids.length&&this.sibs(n).length===1)return;this.snap();const s=this.sibs(n);s.splice(s.indexOf(n),1,...n.kids);
      if(prev)this.changed({id:prev.id,at:prev.text.length});else{this.changed();const f=this.visible()[0];if(f)this.focus(this.node(f).id,0)}return}
    if(!prev||prev.kind==='raw'){A.play('dull');return}this.snap();n.text=t;const at=prev.text.length;const s=this.sibs(n);s.splice(s.indexOf(n),1,...n.kids);prev.text+=t;this.changed({id:prev.id,at})},
  del(n){this.snap();const list=this.visible(),i=list.indexOf(this.el(n.id)),prev=list[i-1]&&this.node(list[i-1]);const s=this.sibs(n);s.splice(s.indexOf(n),1);this.changed(prev?{id:prev.id,at:prev.text.length}:null);A.play('back')},
  move(n,el,d){n.text=getText(el);const at=caret(el),s=this.sibs(n),i=s.indexOf(n),j=i+d;if(j<0||j>=s.length){A.play('dull');return}this.snap();s.splice(i,1);s.splice(j,0,n);this.changed({id:n.id,at})},
  fold(n,open){if(!n.kids.length){A.play('dull');return}n.open=open==null?!n.open:open;this.render({id:n.id,at:null});A.play('cursor')},
  task(n,el){if(el)n.text=getText(el);this.snap();n.task=n.task==null?' ':n.task===' '?'x':null;if(n.task&&n.kind==='p')n.kind='li';this.changed({id:n.id,at:n.text.length});A.play(n.task==='x'?'confirm':'tick')},
  zoomTo(id){if(!this.map.has(id))return;this.zoom=id;const n=this.map.get(id);if(!n.kids.length)n.kids.push(mk('p',''));n.open=true;this.render();const f=this.visible()[0];if(f)this.focus(this.node(f).id,0);A.play('air')},
  zoomOut(){if(!this.zoom){A.play('dull');return}const p=this.par.get(this.zoom);const was=this.zoom;this.zoom=p&&p!==this.root?p.id:null;this.render({id:was,at:0});A.play('back')},
  nav(el,d){const list=this.visible(),i=list.indexOf(el),t=list[i+d];if(!t){if(d<0){$('#o-title').focus();setCaret($('#o-title'),getText($('#o-title')).length)}return}const at=caret(el);const tn=this.node(t);this.focus(tn.id,d<0?tn.text.length:Math.min(at,tn.text.length))},
  wrap(el,mark){const[a,b]=selRange(el),t=getText(el);const n=this.node(el);const nt=t.slice(0,a)+mark+t.slice(a,b)+mark+t.slice(b);el.textContent=nt;n.text=nt;setCaret(el,a+mark.length,b+mark.length);S.touch(this.o)},
  pasteNodes(n,el,text){const tree=parseOutline(text,null);if(!tree.kids.length)return;this.snap();n.text=getText(el);const s=this.sibs(n);const at=s.indexOf(n);if(!n.text.trim()&&!n.kids.length)s.splice(at,1,...tree.kids);else s.splice(at+1,0,...tree.kids);const last=tree.kids[tree.kids.length-1];this.changed({id:last.id,at:last.text.length})}
};
const olEl=()=>$('#ol');
function bindOutline(ol){
  ol.addEventListener('mousedown',e=>{const t=e.target;
    if(t.closest('a.ref,a.ext,.tagc,img.ni,.ck,.crys,.tg,.bu')){e.preventDefault();return}
    const nt=t.closest('.nt');if(nt&&document.activeElement!==nt){const n=E.node(nt);if(!n)return;let off=null;const cr=document.caretRangeFromPoint&&document.caretRangeFromPoint(e.clientX,e.clientY);if(cr&&nt.contains(cr.startContainer))off=offOf(nt,cr.startContainer,cr.startOffset);E.pendingAt=off==null?null:rawOffset(n.text,off)}});
  ol.addEventListener('click',e=>{const t=e.target,n=E.node(t);
    const ref=t.closest('a.ref');if(ref){e.preventDefault();if(ref.dataset.oid)openObj(ref.dataset.oid);else if(ref.dataset.new)createFromGhost(ref.dataset.new);return}
    const ext=t.closest('a.ext');if(ext){e.preventDefault();openExt(ext);return}
    const tg=t.closest('.tagc');if(tg){PAL.open('#'+tg.dataset.tag);return}
    const img=t.closest('img.ni');if(img){lightbox(img.src);return}
    if(!n)return;
    if(t.closest('.ck')){E.task(n);return}
    if(t.closest('.tg')){E.fold(n);return}
    if(t.closest('.bu')){E.zoomTo(n.id);return}
    if(t.closest('.crys')){crystallize(n,t.closest('.nr'));return}});
  ol.addEventListener('focusin',e=>{const el=e.target.closest('.nt');if(!el)return;const n=E.node(el);if(!n)return;E.focusId=n.id;E.typed=false;el.textContent=n.text;el.closest('.nd').classList.add('cur');setCaret(el,E.pendingAt==null?n.text.length:clamp(E.pendingAt,0,n.text.length));E.pendingAt=null;setHints('edit');help(HELP.edit)});
  ol.addEventListener('focusout',e=>{const el=e.target.closest('.nt');if(!el||E.rendering||!el.isConnected)return;const n=E.node(el);el.closest('.nd')&&el.closest('.nd').classList.remove('cur');if(!n)return;const t=getText(el);if(t!==n.text){n.text=t;S.touch(E.o)}
    el.innerHTML=renderNode(n,E.o);hydrate(el);const st=n.kind!=='raw'&&superOf(n.text),nd=el.closest('.nd');if(nd){nd.classList.toggle('stamp',n.kind==='p'&&STAMP.test(n.text.trim()));nd.classList.toggle('typed',!!st);if(st)nd.style.setProperty('--c',typeInfo(st).c)}
    setTimeout(()=>{if(!editing()){AC.hide();setHints('obj');help()}},120)});
  ol.addEventListener('input',e=>{const el=e.target.closest('.nt');if(!el)return;const n=E.node(el);if(!n)return;n.text=getText(el);E.typed=true;S.touch(E.o);AC.check(el,n)});
  ol.addEventListener('paste',e=>{const el=e.target.closest('.nt');if(!el)return;e.preventDefault();const t=(e.clipboardData.getData('text/plain')||'').replace(/\r\n?/g,'\n');if(t.includes('\n')&&t.trim().includes('\n'))E.pasteNodes(E.node(el),el,t);else document.execCommand('insertText',false,t)});
  ol.addEventListener('keydown',e=>{const el=e.target.closest('.nt');if(!el)return;const n=E.node(el);if(!n)return;if(AC.open&&AC.key(e))return;
    const k=e.key,mod=e.ctrlKey||e.metaKey;
    if(k==='Enter'&&e.altKey){e.preventDefault();n.text=getText(el);crystallize(n,el.closest('.nr'));return}
    if(k==='Enter'&&mod){e.preventDefault();E.task(n,el);return}
    if(k==='Enter'&&e.shiftKey){e.preventDefault();document.execCommand('insertText',false,'\n');return}
    if(k==='Enter'){e.preventDefault();E.split(n,el);return}
    if(k==='Tab'){e.preventDefault();e.shiftKey?E.outdent(n,el):E.indent(n,el);return}
    if(k==='Backspace'&&mod&&e.shiftKey){e.preventDefault();E.del(n);return}
    if(k==='Backspace'&&getSelection().isCollapsed&&caret(el)===0&&n.task){e.preventDefault();n.text=getText(el);E.snap();n.task=null;E.changed({id:n.id,at:0});A.play('back');return}
    if(k==='Backspace'&&getSelection().isCollapsed&&caret(el)===0){e.preventDefault();E.back(n,el);return}
    if((k==='ArrowUp'||k==='ArrowDown')&&e.shiftKey&&(e.altKey||mod)){e.preventDefault();E.move(n,el,k==='ArrowUp'?-1:1);return}
    if((k==='ArrowUp'||k==='ArrowDown')&&mod){e.preventDefault();n.text=getText(el);E.fold(n,k==='ArrowDown');return}
    if(k==='ArrowRight'&&e.altKey){e.preventDefault();n.text=getText(el);E.zoomTo(n.id);return}
    if(k==='ArrowLeft'&&e.altKey){e.preventDefault();E.zoomOut();return}
    if(k==='ArrowUp'&&!e.shiftKey&&lineEdge(el,true)){e.preventDefault();E.nav(el,-1);return}
    if(k==='ArrowDown'&&!e.shiftKey&&lineEdge(el,false)){e.preventDefault();E.nav(el,1);return}
    if(mod&&(k==='b'||k==='i')){e.preventDefault();E.wrap(el,k==='b'?'**':'*');return}
    if(mod&&(k==='z'||k==='Z'||k==='y')&&!E.typed){e.preventDefault();if(k==='y'||e.shiftKey)E.restore(E.redo,E.undo);else E.restore(E.undo,E.redo);return}
    if(k==='Escape'){e.preventDefault();el.blur();NAV.land({node:n.id});return}});
}

/* ---------- crystallize: a #Type node becomes its own object ---------- */
async function crystallize(n,rowEl){const ty=superOf(n.text)||'AtomicNote';let txt=n.text;const used=inlineTags(n.text).find(t=>typeForTag(t));
  if(used)txt=txt.replace(new RegExp('(^|\\s)#'+used.replace(/[.*+?^${}()|[\]\\\/-]/g,'\\$&')+'(?![\\w\\-/])'),'$1').trim();
  const lines=txt.split('\n'),title=plainText(lines[0]).replace(/\s+/g,' ').trim();if(!title){A.play('dull');notice('Give the node a name first, then crystallize it.');return}
  E.snap();const ex=V.resolve(title);let o2,isNew=!ex;
  if(ex)o2=V.objs.get(ex);else o2=await createObj(ty,title,{body:n.kids.length?serializeOutline({kids:n.kids}):''});
  n.text='[['+o2.title+']]'+(lines.length>1?'\n'+lines.slice(1).join('\n'):'');if(isNew)n.kids=[];E.changed({id:n.id,at:n.text.length});
  const b=(rowEl||document.body).getBoundingClientRect(),col=typeInfo(o2.type).c;beam(b.left+40,b.top+b.height/2,col);
  notice(isNew?`Crystal acquired: <b>${esc(o2.title)}</b>!`:`Linked to <b>${esc(o2.title)}</b>.`)}
function beam(x,y,col){A.play('acquire');const b=document.createElement('div');b.className='beam';b.style.left=x+'px';b.style.height=Math.max(40,y)+'px';b.style.setProperty('--c',col);document.body.appendChild(b);
  FX.burst(x,y,22,col);if(RM()){b.remove();return}b.animate([{transform:'scaleY(0)',opacity:0},{transform:'scaleY(1)',opacity:1,offset:.4},{transform:'scaleY(1)',opacity:0}],{duration:T(900),easing:'ease-out'}).finished.then(()=>b.remove())}
async function createFromGhost(title){const ty=superOf(title)||'AtomicNote';const o=await createObj(ty,title.replace(/(^|\s)#\w+/g,'').trim()||title);A.play('confirm');if(E.o)E.render();openObj(o.id)}

/* ---------- autocomplete: [[links, #supertags, /commands ---------- */
const SLASH=[{k:'todo',l:'Task',d:'Checkbox [Ctrl Enter]',f:n=>{n.task=' ';if(n.kind==='p')n.kind='li'}},{k:'h1',l:'Heading 1',f:n=>{n.kind='h';n.level=1;n.inli=E.par.get(n.id)!==E.root&&E.par.get(n.id).kind!=='h'?1:0}},{k:'h2',l:'Heading 2',f:n=>{n.kind='h';n.level=2;n.inli=E.par.get(n.id)!==E.root&&E.par.get(n.id).kind!=='h'?1:0}},{k:'h3',l:'Heading 3',f:n=>{n.kind='h';n.level=3;n.inli=E.par.get(n.id)!==E.root&&E.par.get(n.id).kind!=='h'?1:0}},
  {k:'text',l:'Plain text',f:n=>{n.kind='p';n.task=null}},{k:'bullet',l:'Bullet',f:n=>{n.kind='li';n.ord=false}},{k:'number',l:'Numbered',f:n=>{n.kind='li';n.ord=true}},{k:'quote',l:'Quote',f:n=>{n.kind='q'}},
  {k:'now',l:'Time stamp',d:'Like your daily notes',ins:()=>new Date().toTimeString().slice(0,5)},{k:'today',l:"Link today's note",ins:()=>'[['+dailyObj(todayYmd()).title+']]'},{k:'divider',l:'Divider',f:n=>{n.kind='raw';n.text='---'}},
  {k:'crystallize',l:'Crystallize',d:'Make this node an object [Alt Enter]',after:n=>crystallize(n)}];
const AC={el:$('#ac'),open:false,items:[],i:0,mode:'',start:0,node:null,ntEl:null,
  check(el,n){const t=getText(el),c=caret(el),b=t.slice(0,c);let m;
    if((m=b.match(/\[\[([^\]\n]*)$/)))return this.show('link',m[1],c-m[1].length-2,el,n);
    if((m=b.match(/(^|\s)#([\w\-\/]*)$/)))return this.show('tag',m[2],c-m[2].length-1,el,n);
    if((m=b.match(/^\/(\w*)$/)))return this.show('cmd',m[1],0,el,n);this.hide()},
  show(mode,q,start,el,n){this.mode=mode;this.start=start;this.node=n;this.ntEl=el;this.q=q;const ql=q.toLowerCase();let it=[];
    if(mode==='link'){const res=q.trim()?V.search(q.replace(/\s#\w+$/,''),8):store.get('recent',[]).map(getObj).filter(Boolean).slice(0,6);it=res.filter(o=>o!==E.o).slice(0,7).map(o=>({t:o.title,s:typeInfo(o.type).label,c:typeInfo(o.type).c,ins:'[['+o.title+']]'}));
      if(q.trim()&&!V.resolve(q.replace(/\s#\w+$/,'').trim())){const ty=superOf(q)||'AtomicNote';it.push({t:'Create “'+q.replace(/\s#\w+$/,'').trim()+'”',s:'New '+typeInfo(ty).label,c:typeInfo(ty).c,create:{title:q.replace(/\s#\w+$/,'').trim(),type:ty}})}}
    else if(mode==='tag'){const seen=new Set();for(const k of TORDER){const t=TYPES[k];if(!ql||k.toLowerCase().startsWith(ql)||t.label.toLowerCase().startsWith(ql)){it.push({t:'#'+k,s:'Supertag · '+t.label,c:t.c,ins:'#'+k+' '});seen.add(k.toLowerCase())}}
      for(const x of[...V.tags.values()].sort((a,b)=>b.ids.size-a.ids.size)){if(seen.has(x.name.toLowerCase())||/\s/.test(x.name))continue;if(!ql||x.name.toLowerCase().startsWith(ql))it.push({t:'#'+x.name,s:x.ids.size+' objects',c:'#cfd6dd',ins:'#'+x.name+' '})}it=it.slice(0,9);if(q&&!it.length)this.hide()}
    else it=SLASH.filter(x=>x.k.startsWith(ql)||x.l.toLowerCase().startsWith(ql)).map(x=>({t:x.l,s:x.d||'/'+x.k,c:'#8fe6f0',cmd:x}));
    if(!it.length){this.hide();return}this.items=it;this.i=0;this.open=true;this.el.hidden=false;this.paint();const r=caretRect()||el.getBoundingClientRect();
    this.el.style.left=clamp(r.left,8,innerWidth-340)+'px';const below=r.bottom+6,h=Math.min(300,this.el.offsetHeight);this.el.style.top=(below+h>innerHeight-8?r.top-h-6:below)+'px'},
  paint(){this.el.innerHTML=this.items.map((x,i)=>`<button type="button" class="prow${i===this.i?' on':''}" data-i="${i}"><span class="dot" style="--c:${x.c}"></span><span class="pm"><span class="pt">${esc(x.t)}</span></span><span class="pk micro">${esc(x.s)}</span></button>`).join('')},
  hide(){this.open=false;this.el.hidden=true},
  key(e){if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();this.i=(this.i+(e.key==='ArrowDown'?1:-1)+this.items.length)%this.items.length;this.paint();A.play('cursor');return true}
    if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();this.pick(this.i);return true}if(e.key==='Escape'){e.preventDefault();this.hide();return true}return false},
  async pick(i){const x=this.items[i],el=this.ntEl,n=this.node;if(!x||!el)return;this.hide();const t=getText(el),c=caret(el);let ins=x.ins;
    if(x.create){const o=await createObj(x.create.type,x.create.title);ins='[['+o.title+']]';notice(`Crystal acquired: <b>${esc(o.title)}</b>!`);A.play('acquire')}
    if(x.cmd){const cm=x.cmd;const rest=t.slice(c);n.text=(cm.ins?cm.ins():'')+rest;if(cm.f){E.snap();cm.f(n)}E.changed({id:n.id,at:cm.ins?cm.ins().length:0});if(cm.after)cm.after(n);return}
    const nt=t.slice(0,this.start)+ins+t.slice(c);n.text=nt;el.textContent=nt;setCaret(el,this.start+ins.length);S.touch(E.o);A.play('confirm');
    if(this.mode==='tag'){const st=superOf(nt),nd=el.closest('.nd');if(nd){nd.classList.toggle('typed',!!st);if(st)nd.style.setProperty('--c',typeInfo(st).c)}}}};
AC.el.addEventListener('mousedown',e=>{e.preventDefault();const b=e.target.closest('.prow');if(b)AC.pick(+b.dataset.i)});
