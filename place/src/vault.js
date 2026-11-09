/* ===================== Vault engine: Markdown files <-> typed objects + outlines ===================== */
const TYPES={
  DailyNote:{label:'Daily note',tag:'DAY',c:'#f2cf63',dir:'DailyNotes'},
  AtomicNote:{label:'Atomic note',tag:'ATM',c:'#a98bd6',dir:'AtomicNotes'},
  Page:{label:'Page',tag:'PAG',c:'#8fe6f0',dir:'Pages'},
  Project:{label:'Project',tag:'PRJ',c:'#6fd99a',dir:'Projects'},
  JournalEntry:{label:'Journal',tag:'JRN',c:'#f2c9c0',dir:'JournalEntries'},
  Meeting:{label:'Meeting',tag:'MTG',c:'#b4e07a',dir:'Meetings'},
  Book:{label:'Book',tag:'BOK',c:'#e8a87c',dir:'Books'},
  Quote:{label:'Quote',tag:'QOT',c:'#c9b2ff',dir:'Quotes'},
  Person:{label:'Person',tag:'PPL',c:'#eaa2b4',dir:'People'},
  PDF:{label:'PDF',tag:'PDF',c:'#ff9a8a',dir:'PDFs'},
  Weblink:{label:'Weblink',tag:'WEB',c:'#7fb8e6',dir:'Weblinks'},
  Image:{label:'Image',tag:'IMG',c:'#9fdcc8',dir:'Images'},
  Music:{label:'Music',tag:'MUS',c:'#ffb3e0',dir:'Music'},
  Tweet:{label:'Tweet',tag:'TWT',c:'#9ad0ff',dir:'Tweets'},
  ScratchPaper:{label:'Scratch paper',tag:'SCR',c:'#d8d2c4',dir:'ScratchPapers'},
  Query:{label:'Query',tag:'QRY',c:'#f4f6f8',dir:'Queries'}
};
const TORDER=Object.keys(TYPES);
function typeInfo(t){if(TYPES[t])return TYPES[t];const k=String(t||'Note');return TYPES[k]={label:k.replace(/([a-z])([A-Z])/g,'$1 $2'),tag:k.slice(0,3).toUpperCase(),c:'#8fe6f0',dir:k+'s'}}
/* supertag lookup: #book, #Person, #people, #atomicnote … */
function typeForTag(tag){const s=String(tag).toLowerCase().replace(/[\s_-]/g,'');for(const k in TYPES){const t=TYPES[k];if(k.toLowerCase()===s||t.label.toLowerCase().replace(/\s/g,'')===s||t.dir.toLowerCase()===s)return k}if(s==='note'||s==='atom')return'AtomicNote';if(s==='daily')return'DailyNote';if(s==='journal')return'JournalEntry';if(s==='link'||s==='web')return'Weblink';return null}

/* ---------- paths ---------- */
const dirOf=p=>p.includes('/')?p.slice(0,p.lastIndexOf('/')):'';
const stemOf=p=>p.slice(p.lastIndexOf('/')+1).replace(/\.md$/i,'');
function joinPath(base,rel){let r=rel;try{r=decodeURI(rel)}catch(e){}if(/^[a-z]+:/i.test(r)||r.startsWith('/'))return null;const out=base?base.split('/'):[];for(const seg of r.split('/')){if(seg==='.'||seg==='')continue;if(seg==='..')out.pop();else out.push(seg)}return out.join('/')}
const encPath=p=>p.split('/').map(encodeURIComponent).join('/');
const safeName=s=>String(s).replace(/[\\/:*?"<>|#^\[\]\n\r\t]/g,' ').replace(/\s+/g,' ').trim().slice(0,80)||'Untitled';

/* ---------- frontmatter: keep raw lines, edit key by key ---------- */
function parseVal(raw){let s=raw.trim();if(s===''||s==='null'||s==='~')return null;if(s==='true')return true;if(s==='false')return false;
  if(s[0]==="'"&&s.endsWith("'")&&s.length>1)return s.slice(1,-1).replace(/''/g,"'");
  if(s[0]==='"'&&s.endsWith('"')&&s.length>1){try{return JSON.parse(s)}catch(e){return s.slice(1,-1)}}
  if(s[0]==='['&&s.endsWith(']')){const inner=s.slice(1,-1).trim();if(!inner)return[];return splitList(inner).map(x=>{const v=parseVal(x);return v==null?'':String(v)})}
  if(/^-?\d+(\.\d+)?$/.test(s))return Number(s);return s}
function splitList(s){const out=[];let cur='',q='';for(const ch of s){if(q){cur+=ch;if(ch===q)q='';continue}if(ch==="'"||ch==='"'){q=ch;cur+=ch;continue}if(ch===','){out.push(cur.trim());cur='';continue}cur+=ch}if(cur.trim())out.push(cur.trim());return out}
function fmtScalar(v){if(v==null||v==='')return'null';if(typeof v==='boolean'||typeof v==='number')return String(v);let s=String(v).replace(/\r?\n+/g,' ');
  if(/^[\s\[\]{}#&*!|>'"%@`,?:-]|: | #|^(null|true|false|~)$|^-?\d+(\.\d+)?$|\s$/.test(s))return"'"+s.replace(/'/g,"''")+"'";return s}
function fmtVal(v){if(Array.isArray(v))return'['+v.map(x=>{const s=fmtScalar(x);return /[,\[\]]/.test(s)&&s[0]!=="'"?"'"+String(x).replace(/'/g,"''")+"'":s}).join(', ')+']';return fmtScalar(v)}
class FM{constructor(text){this.e=[];if(text==null)return;let cur=null;for(const line of text.split('\n')){const m=line.match(/^([A-Za-z_][\w-]*):(.*)$/);if(m){cur={k:m[1],raw:line,lines:[line]};this.e.push(cur)}else if(cur){cur.lines.push(line)}else this.e.push({k:null,lines:[line]})}
    for(const x of this.e)if(x.k){const first=x.lines[0].slice(x.k.length+1).trim();if(/^[>|][-+]?$/.test(first)){const rest=x.lines.slice(1).map(l=>l.trim()).filter(Boolean);x.v=first[0]==='>'?rest.join(' '):rest.join('\n')}else if(x.lines.length>1&&first===''){x.v=x.lines.slice(1).map(l=>l.replace(/^\s*-\s*/,'').trim()).filter(Boolean)}else x.v=parseVal(first+(x.lines.length>1?' '+x.lines.slice(1).map(l=>l.trim()).join(' '):''))}}
  get(k){const x=this.e.find(e=>e.k===k);return x?x.v:undefined}
  has(k){return this.e.some(e=>e.k===k)}
  set(k,v){let x=this.e.find(e=>e.k===k);const line=k+': '+fmtVal(v);if(x){x.v=v;x.lines=[line]}else this.e.push({k,v,lines:[line]})}
  del(k){this.e=this.e.filter(e=>e.k!==k)}
  keys(){return this.e.filter(e=>e.k).map(e=>e.k)}
  text(){return this.e.map(x=>x.lines.join('\n')).join('\n')}}
function splitFile(t){t=t.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');const m=t.match(/^---\n([\s\S]*?)\n---[ \t]*(\n|$)/);return m?{fm:m[1],body:t.slice(m[0].length)}:{fm:null,body:t}}

/* ---------- outline: Markdown blocks <-> node tree ---------- */
let NID=0;const mk=(kind,text,o={})=>Object.assign({id:'n'+(++NID),kind,text,kids:[],open:true},o);
const RX={fence:/^\s*(```|~~~)/,hr:/^\s{0,3}([-*_])(\s*\1){2,}\s*$/,h:/^(#{1,6})\s+(.*?)\s*$/,li:/^(\s*)([-*+]|\d{1,3}[.)])\s+(.*)$/,q:/^\s{0,3}>\s?(.*)$/,table:/^\s*\|/};
const indW=s=>s.replace(/\t/g,'    ').length;
function parseOutline(body,title){const L=body.split('\n');let i=0;
  while(i<L.length&&!L[i].trim())i++;
  const hm=i<L.length&&L[i].match(/^#\s+(.*?)\s*$/);if(hm&&sameTitle(hm[1],title))i++;
  const root=mk('root','');const stack=[{lv:0,n:root}];const cont=()=>stack[stack.length-1].n;
  const isBlockStart=l=>RX.fence.test(l)||RX.hr.test(l)||RX.h.test(l)||RX.li.test(l)||RX.q.test(l)||RX.table.test(l);
  while(i<L.length){const l=L[i];if(!l.trim()){i++;continue}
    if(RX.fence.test(l)){const f=l.trim().slice(0,3);const buf=[l];i++;while(i<L.length&&!L[i].trim().startsWith(f)){buf.push(L[i]);i++}if(i<L.length){buf.push(L[i]);i++}cont().kids.push(mk('raw',buf.join('\n')));continue}
    if(RX.hr.test(l)){cont().kids.push(mk('raw','---'));i++;continue}
    let m=l.match(RX.h);if(m){const lv=m[1].length;while(stack.length>1&&stack[stack.length-1].lv>=lv)stack.pop();const n=mk('h',m[2],{level:lv});cont().kids.push(n);stack.push({lv,n});i++;continue}
    if(RX.table.test(l)){const buf=[];while(i<L.length&&RX.table.test(L[i])){buf.push(L[i]);i++}cont().kids.push(mk('raw',buf.join('\n')));continue}
    if(RX.q.test(l)){const buf=[];while(i<L.length&&L[i].trim()&&RX.q.test(L[i])){buf.push(L[i].match(RX.q)[1]);i++}cont().kids.push(mk('q',buf.join('\n')));continue}
    if(RX.li.test(l)){const ls=[{ind:-1,n:{kids:cont().kids}}];
      while(i<L.length){const x=L[i];if(!x.trim()){let j=i+1;while(j<L.length&&!L[j].trim())j++;if(j<L.length&&(RX.li.test(L[j])||/^\s+\S/.test(L[j]))){i=j;continue}break}
        const mm=x.match(RX.li);
        if(mm){const ind=indW(mm[1]);let txt=mm[3],task=null;const tm=txt.match(/^\[([ xX])\]\s+(.*)$/)||txt.match(/^\[([ xX])\]$/);if(tm){task=tm[1].toLowerCase()==='x'?'x':' ';txt=tm[2]||''}
          const ord=/\d/.test(mm[2]);let hl=0;const hm2=txt.match(/^(#{1,6})\s+(.*)$/);if(hm2){hl=hm2[1].length;txt=hm2[2]}
          const n=hl?mk('h',txt,{level:hl,inli:1}):mk('li',txt,{ord,task,num:ord?parseInt(mm[2]):0});
          while(ls.length>1&&ls[ls.length-1].ind>=ind)ls.pop();ls[ls.length-1].n.kids.push(n);ls.push({ind,n});i++;continue}
        if(/^\s+\S/.test(x)&&ls.length>1&&!isBlockStart(x.trim())){const last=ls[ls.length-1].n;last.text+=(last.text?'\n':'')+x.trim();i++;continue}
        if(/^\s+\S/.test(x)&&ls.length>1&&RX.q.test(x.trim())){const last=ls[ls.length-1].n;last.text+=(last.text?'\n':'')+x.trim();i++;continue}
        break}
      continue}
    const buf=[];while(i<L.length&&L[i].trim()&&!(buf.length&&isBlockStart(L[i]))){buf.push(L[i].replace(/\s+$/,''));i++}
    cont().kids.push(mk('p',buf.join('\n')))}
  return root}
function serializeOutline(root){const blocks=[];
  const liLines=(n,d,num)=>{const pad='    '.repeat(d);let mark=n.kind==='li'&&n.ord?num+'. ':'- ';if(n.kind==='h')mark+='#'.repeat(n.level||2)+' ';if(n.kind==='q')mark+='> ';
    const task=n.task?'['+n.task+'] ':'';const lines=String(n.text).replace(/\n\s*\n/g,'\n').split('\n');let out=pad+mark+task+lines[0];for(const x of lines.slice(1))out+='\n'+pad+'  '+x;
    let c=0,base=1;n.kids.forEach(k=>{if(k.kind==='li'&&k.ord){if(!c)base=k.num||1;out+="\n\n"+liLines(k,d+1,k.num||base+c);c++}else{c=0;out+='\n\n'+liLines(k,d+1,0)}});return out};
  const emit=list=>{let c=0,base=1;for(const n of list){
    if(n.kind==='h'&&!n.inli){c=0;blocks.push('#'.repeat(n.level||2)+' '+n.text.replace(/\n/g,' '));emit(n.kids);continue}
    if(n.kind==='li'&&n.ord){if(!c)base=n.num||1;blocks.push(liLines(n,0,n.num||base+c));c++;continue}
    c=0;
    if(n.kind==='li'||n.kind==='h'||n.kids.length){blocks.push(liLines(n,0,0));continue}
    if(n.kind==='q'){blocks.push(String(n.text).split('\n').map(x=>'> '+x).join('\n'));continue}
    if(n.kind==='raw'){blocks.push(n.text);continue}
    blocks.push(String(n.text).replace(/\n\s*\n/g,'\n'))}};
  emit(root.kids);return blocks.join('\n\n')}
const normT=s=>String(s||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
function sameTitle(a,b){return b==null||normT(a)===normT(b)||normT(a).startsWith(normT(b))&&normT(b).length>40}
function stripTitle(body,title){const m=body.match(/^\s*#\s+([^\n]*)\n?/);return m&&sameTitle(m[1],title)?body.slice(m[0].length):body}
function cloneTree(n){return{...n,kids:n.kids.map(cloneTree)}}
function walk(n,f,par=null,depth=0){for(const k of n.kids){if(f(k,n,depth)===false)return false;if(walk(k,f,n,depth+1)===false)return false}}

/* ---------- inline syntax ---------- */
const WIKI=/\[\[([^\]|#\n]+)(?:#[^\]|\n]*)?(?:\|([^\]\n]*))?\]\]/g;
const MDLINK=/\[([^\]\n]*)\]\(([^)\s]+(?:\s[^)]*)?)\)/g;
const TAGRX=/(^|[\s(])#([A-Za-z][\w\-\/]*)/g;
function inlineTags(text){const out=[];let m;TAGRX.lastIndex=0;while((m=TAGRX.exec(text)))out.push(m[2]);return out}
/* preview text: no list markers, checkboxes as glyphs, supertags dropped */
function previewText(s){return plainText(String(s).split('\n').map(l=>l.replace(/^\s*[-*+]\s+\[\s\]\s+/,'☐ ').replace(/^\s*[-*+]\s+\[[xX]\]\s+/,'☑ ').replace(/^\s*[-*+]\s+/,'').replace(/^\s*\d+[.)]\s+/,'').replace(TAGRX,(m,a,t)=>typeForTag(t)?a:m)).join('\n')).replace(/\s+/g,' ').trim()}
const TYPEW={Person:5,Book:4,Project:4,Page:3,AtomicNote:3,Meeting:2,JournalEntry:2,PDF:2,Quote:1,Query:1,ScratchPaper:1,Music:1,Weblink:0,Tweet:0,DailyNote:0,Image:-1};
const wordStart=(tl,v)=>tl.split(/[^a-z0-9\u00c0-\u024f']+/).some(w=>w.startsWith(v));
function plainText(s){return String(s).replace(/!\[([^\]]*)\]\([^)]*\)/g,'').replace(WIKI,(m,a,b)=>b&&/ - Notes$/.test(b)?'':(b||a)).replace(MDLINK,(m,a)=>/ - Notes$/.test(a)?'':a).replace(/[*`]{1,3}|~~/g,'').replace(/(^|[^\w])_+|_+(?=[^\w]|$)/g,'$1').replace(/^#+\s+/gm,'').replace(/^>\s?/gm,'')}

/* ---------- the vault ---------- */
const V={objs:new Map(),byTitle:new Map(),byStem:new Map(),back:new Map(),tags:new Map(),backend:null,
  load(files){this.objs.clear();for(const f of files)if(/\.md$/i.test(f.path))this.add(f.path,f.text,f.mtime);this.reindex()},
  add(path,text,mtime){const o={id:path,path,mtime:mtime||0,disk:text};this.parse(o,text);this.objs.set(path,o);return o},
  parse(o,text){const{fm,body}=splitFile(text);o.fm=new FM(fm);o.body=body;o.type=String(o.fm.get('type')||this.guessType(o.path));o.title=String(o.fm.get('title')??stemOf(o.path)).trim()||stemOf(o.path);o.outline=null;
    const d=o.fm.get('date')||o.fm.get('createdAt');let dt=null;if(d){const s=String(d).slice(0,10);if(/^\d{4}-\d\d-\d\d$/.test(s))dt=new Date(s+'T12:00:00')}if(!dt&&o.type==='DailyNote'){const s=stemOf(o.path).slice(0,10);if(/^\d{4}-\d\d-\d\d$/.test(s))dt=new Date(s+'T12:00:00')}o.date=dt;
    o.day=o.type==='DailyNote'&&dt?ymd(dt):null},
  guessType(p){const d=p.split('/')[0];for(const k in TYPES)if(TYPES[k].dir===d)return k;return'AtomicNote'},
  text(o){const b=o.outline?serializeOutline(o.outline):stripTitle(o.body,o.title).trim();const fm=o.fm.text();return(fm?'---\n'+fm+'\n---\n\n':'')+'# '+o.title.replace(/\n/g,' ')+'\n\n'+(b?b+'\n':'')},
  getOutline(o){if(!o.outline)o.outline=parseOutline(o.body,o.title);return o.outline},
  resolve(name,from){if(!name)return null;let n=String(name).trim();if(/\.md$/i.test(n)){const p=joinPath(from?dirOf(from):'',n);if(p&&this.objs.has(p))return p;n=stemOf(n)}
    const k=n.toLowerCase();return this.byTitle.get(k)||this.byStem.get(k)||null},
  linksOf(o){const out=new Set(),src=o.outline?serializeOutline(o.outline):o.body;let m;WIKI.lastIndex=0;
    const scan=s=>{WIKI.lastIndex=0;while((m=WIKI.exec(s))){const r=this.resolve(m[1],o.path);if(r&&r!==o.path)out.add(r)}MDLINK.lastIndex=0;while((m=MDLINK.exec(s))){if(/\.md$/i.test(m[2].split(/\s/)[0])){const r=this.resolve(m[2].split(/\s/)[0],o.path);if(r&&r!==o.path)out.add(r)}}};
    scan(src);for(const e of o.fm.e)if(e.k&&e.v&&!['title','type'].includes(e.k))scan(Array.isArray(e.v)?e.v.join(' '):String(e.v));return out},
  reindex(){this.byTitle.clear();this.byStem.clear();for(const o of this.objs.values()){const k=o.title.toLowerCase();if(!this.byTitle.has(k)||o.type!=='Image')this.byTitle.set(k,o.id);const s=stemOf(o.path).toLowerCase();if(!this.byStem.has(s))this.byStem.set(s,o.id)}
    for(const o of this.objs.values())this.indexOne(o,true);this.rebuildBack()},
  indexOne(o,bulk){o.links=this.linksOf(o);const src=o.outline?serializeOutline(o.outline):stripTitle(o.body,o.title);o.search=(o.title+'\n'+plainText(src)+'\n'+o.fm.e.filter(e=>e.k&&e.v!=null&&typeof e.v!=='boolean').map(e=>Array.isArray(e.v)?e.v.join(' '):e.v).join(' ')).toLowerCase();
    o.itags=new Set();src.split('\n').forEach(line=>inlineTags(line).forEach(t=>o.itags.add(t)));const ft=o.fm.get('tags');o.ftags=Array.isArray(ft)?ft.filter(Boolean).map(String):[];
    o.preview=previewText(src).slice(0,400);if(!bulk)this.rebuildBack()},
  rebuildBack(){this.back.clear();for(const o of this.objs.values())for(const t of o.links){if(!this.back.has(t))this.back.set(t,new Set());this.back.get(t).add(o.id)}
    this.tags.clear();for(const o of this.objs.values()){for(const t of o.itags){const k=t.toLowerCase();if(!this.tags.has(k))this.tags.set(k,{name:t,ids:new Set()});this.tags.get(k).ids.add(o.id)}for(const t of o.ftags){const k=t.toLowerCase();if(!this.tags.has(k))this.tags.set(k,{name:t,ids:new Set()});this.tags.get(k).ids.add(o.id)}}},
  ofType(t){return[...this.objs.values()].filter(o=>o.type===t).sort(byOrder)},
  types(){const s=new Set([...this.objs.values()].map(o=>o.type));return[...TORDER.filter(t=>s.has(t)),...[...s].filter(t=>!TYPES[t]||!TORDER.includes(t)).sort()]},
  /* search: words, "phrases", type:X, #tag / tag:x, is:task, is:done, links:Title, -word */
  search(q,limit=60){const toks=[];String(q).replace(/(-?)(\w+):"([^"]*)"|(-?)(\w+):(\S+)|(-?)"([^"]*)"|(-?)#(\S+)|(-?)(\S+)/g,(m,n1,k1,v1,n2,k2,v2,n3,ph,n4,tg,n5,w)=>{if(k1)toks.push({neg:!!n1,k:k1.toLowerCase(),v:v1.toLowerCase()});else if(k2)toks.push({neg:!!n2,k:k2.toLowerCase(),v:v2.toLowerCase()});else if(ph!=null)toks.push({neg:!!n3,k:'w',v:ph.toLowerCase()});else if(tg)toks.push({neg:!!n4,k:'tag',v:tg.toLowerCase()});else toks.push({neg:!!n5,k:'w',v:w.toLowerCase()})});
    const out=[];for(const o of this.objs.values()){let score=0,ok=true;for(const t of toks){let hit=false,s=0;
        if(t.k==='type'){const ty=typeForTag(t.v)||t.v;hit=o.type.toLowerCase()===String(ty).toLowerCase()}
        else if(t.k==='tag'){hit=o.itags&&[...o.itags,...o.ftags].some(x=>x.toLowerCase()===t.v)||(typeForTag(t.v)&&o.type===typeForTag(t.v))}
        else if(t.k==='is'){const src=o.outline?serializeOutline(o.outline):o.body;hit=t.v==='task'||t.v==='todo'?/\[ \] /.test(src):t.v==='done'?/\[x\] /i.test(src):t.v==='orphan'?!(this.back.get(o.id)||[]).size&&!o.links.size:false}
        else if(t.k==='links'){const r=this.resolve(t.v);hit=!!r&&o.links.has(r)}
        else if(t.k==='in'){hit=o.path.toLowerCase().startsWith(t.v)}
        else{const tl=o.title.toLowerCase();if(tl===t.v)s=80;else if(tl.startsWith(t.v))s=36;else if(wordStart(tl,t.v))s=26;else if(tl.includes(t.v))s=14;if(s)s+=14*t.v.length/Math.max(tl.length,t.v.length);hit=s>0||o.search.includes(t.v);if(hit&&!s)s=4+Math.min(6,o.search.split(t.v).length-1)}
        if(t.neg?hit:!hit){ok=false;break}score+=s}
      if(ok)out.push({o,score:score+(TYPEW[o.type]??1)+(this.boost?this.boost(o):0)+(o.date?o.date/1e13:0)})}
    out.sort((a,b)=>b.score-a.score);return out.slice(0,limit).map(x=>x.o)},
  snippet(o,q,len=110){const s=o.preview||'';const w=String(q).toLowerCase().split(/\s+/).find(x=>x&&!x.includes(':')&&s.toLowerCase().includes(x.replace(/^#/,'')));if(!w)return s.slice(0,len);const i=s.toLowerCase().indexOf(w.replace(/^#/,''));const a=Math.max(0,i-36);return(a?'…':'')+s.slice(a,a+len)},
  /* lines of `src` that reference target (for linked references) */
  refLines(src,target){const o=this.objs.get(src),t=this.objs.get(target);if(!o||!t)return[];const out=[];const root=this.getOutline(o);
    const crumbs=[];const visit=(list,path)=>{for(const n of list){const hits=[];let m;WIKI.lastIndex=0;while((m=WIKI.exec(n.text)))if(this.resolve(m[1],o.path)===target)hits.push(1);MDLINK.lastIndex=0;while((m=MDLINK.exec(n.text)))if(/\.md$/i.test(m[2])&&this.resolve(m[2],o.path)===target)hits.push(1);
        if(hits.length)out.push({node:n,path:path.slice()});visit(n.kids,n.kind==='h'||n.kids.length?path.concat(plainText(n.text).slice(0,40)):path)}};
    visit(root.kids,[]);if(!out.length){for(const e of o.fm.e)if(e.k&&e.v&&this.resolve(String(e.v).replace(/^\[\[|\]\]$/g,'').replace(/^\[.*?\]\((.*)\)$/,'$1'),o.path)===target)out.push({field:e.k})}return out}
};
function ymd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function byOrder(a,b){if(a.type==='DailyNote'&&b.type==='DailyNote')return(b.day||'').localeCompare(a.day||'');const da=a.date?+a.date:0,db=b.date?+b.date:0;if(da!==db)return db-da;return a.title.localeCompare(b.title)}
if(typeof module!=='undefined')module.exports={V,TYPES,parseOutline,serializeOutline,splitFile,FM,plainText,typeForTag};
