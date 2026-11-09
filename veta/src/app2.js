/* ===================== UI chrome helpers ===================== */
let view='title',busy=false,lastList='party',hand=$('#hand'),handEl=null,pTimer=0;
const app=$('#app'),title=$('#title'),settings=$('#settings'),pal=$('#pal');
const viewEl=v=>$({party:'#v-party',crystarium:'#v-cryst',datalog:'#v-log',obj:'#v-obj'}[v]);
let helpDefault='';const helpEl=$('#help-text');
function help(t){helpEl.textContent=t||helpDefault}
function setInfo(cols){$('#info').innerHTML=cols.map(([l,v])=>`<div class="ic"><span class="micro">${esc(l)}</span><b>${esc(v)}</b></div>`).join('')}
const HELP={party:'Your active objects: what you opened last, plus anything pinned.',crystarium:'Every object is a crystal on its type ring. Links are the paths between them.',datalog:'Every object, by type or tag. Type to filter.',obj:'↑↓ walk the note · Enter edits · F follows a link · A adds an entry to today · Space shows every command.',edit:'[[ links an object · # adds a supertag · / for commands · Alt Enter crystallizes a #Type node.'};
const HINTS={party:[[['←','→'],'Move'],[['Enter'],'Open'],[['1–6'],'Slot'],[['F'],'Follow'],[['A'],'Add entry'],[['K'],'Search'],[['Space'],'Commands']],
  crystarium:[[['←','→'],'Move'],[['↑','↓'],'Ring'],[['Tab'],'Follow a path'],[['Enter'],'Open'],[['Z'],'Zoom'],[['K'],'Search'],[['Space'],'Commands']],
  datalog:[[['↑','↓'],'Move'],[['←','→'],'Type'],[['/'],'Filter'],[['Enter'],'Open'],[['F'],'Follow'],[['K'],'Search'],[['Space'],'Commands']],
  obj:[[['↑','↓'],'Move'],[['Enter'],'Edit'],[['O'],'New line'],[['X'],'Task'],[['F'],'Follow'],[['A'],'Add entry'],[['K'],'Search'],[['Space'],'Commands'],[['Esc'],'Back']],
  edit:[[['Enter'],'Node'],[['Tab'],'Indent'],[['[['],'Link'],[['#'],'Supertag'],[['/'],'Commands'],[['Ctrl','Enter'],'Task'],[['Alt','Enter'],'Crystallize'],[['Esc'],'Navigate']]};
function setHints(v){const touch=matchMedia('(pointer:coarse)').matches,list=touch?[[[],'Tap to select'],[[],'Tap again to open']]:HINTS[v]||[];$('#hints').innerHTML=list.map(([ks,l])=>`<span>${ks.map(k=>`<kbd>${esc(k)}</kbd>`).join('')} ${l}</span>`).join('')}
function countUp(el,to){const w=String(to).length>2?3:2,pd=n=>String(n).padStart(w,'0');if(RM()){el.textContent=pd(to);return}const t0=performance.now();let last=-1;const f=now=>{const p=Math.min(1,(now-t0)/T(700)),v=Math.round(to*(1-Math.pow(1-p,3)));if(v!==last){el.textContent=pd(v);last=v;if(p<.6&&Math.random()<.25)A.play('tick')}if(p<1)requestAnimationFrame(f);else el.animate([{transform:'scale(1.35)'},{transform:'scale(1)'}],{duration:T(333),easing:'cubic-bezier(.34,1.56,.64,1)'})};el.style.display='inline-block';requestAnimationFrame(f)}
function refreshCounts(){$('#h-count').textContent=String(V.objs.size).padStart(2,'0')}
function notice(html,ms=4200){const n=document.createElement('div');n.className='notice';n.innerHTML=html;$('#notes').appendChild(n);if(!RM())n.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:220,easing:QUICK});setTimeout(()=>{n.animate([{opacity:1},{opacity:0}],{duration:300}).finished.then(()=>n.remove())},ms);return n}
function lightbox(src){const lb=$('#lightbox');lb.querySelector('img').src=src;lb.hidden=false;A.play('confirm')}
$('#lightbox').addEventListener('click',()=>{$('#lightbox').hidden=true;A.play('back')});
function openExt(a){A.play('confirm');if(a.dataset.vp&&B.kind==='fs')B.media(a.dataset.vp).then(u=>window.open(u,'_blank'));else window.open(a.href,'_blank','noopener')}
function pointAt(el){if(!el||PHONE()){hand.classList.remove('v');handEl=null;return}const b=el.getBoundingClientRect();if(!b.width){hand.classList.remove('v');return}handEl=el;
  let x=b.left+4,y=b.top+b.height/2-12;if(el.matches('.t-menu button'))x=b.left+parseFloat(getComputedStyle(el).paddingLeft)-48;else if(el.matches('.row,.tro'))x=b.left-2;else if(el.matches('.s-row'))x=b.left+2;else if(el.id==='s-close')x=b.left-48;else if(el.matches('.pc')){x=b.left-30;y=b.top+b.height*.45}else if(el.matches('.nr,.fr,.rg-h,#o-title')){x=b.left-46;y=b.top+Math.min(b.height,34)/2-12}
  hand.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;hand.classList.add('v')}
function pointDefault(){if(!$('#fog').hidden||!pal.hidden){pointAt(null);return}if(!settings.hidden){pointAt(document.activeElement&&document.activeElement.closest('.s-row,#s-close'));return}
  if(view==='title'){pointAt((document.activeElement&&document.activeElement.closest('.t-menu button'))||$('#t-begin'));return}
  if(view==='datalog'){pointAt($(`#log-list .row[data-i="${DL.sel}"]`));return}if(view==='party'){pointAt($(`#cards .pc[data-i="${psel}"]`));return}
  if(view==='obj'){const it=NAV.on&&NAV.cur();pointAt(it&&it.el.isConnected?it.el:null);return}pointAt($('#menu .mi[aria-current=page]'))}
let lbIdx=0;
function drawLogBg(o){if(!o)return;const cvs=$$('#logbg canvas'),nx=cvs[1-lbIdx],cu=cvs[lbIdx],W=Math.max(2,Math.round(innerWidth/2)),H=Math.max(2,Math.round(innerHeight/2));nx.width=W;nx.height=H;nx.getContext('2d').drawImage(art(o,W,H),0,0);nx.classList.add('on');cu.classList.remove('on');lbIdx=1-lbIdx}
const dot=o=>o&&o.date?ymd(o.date).replace(/-/g,'.'):'—';
const words=o=>{const s=(o.outline?serializeOutline(o.outline):o.body);return(plainText(s).match(/\S+/g)||[]).length};

/* ===================== the object sheet ===================== */
const RO=new Set(['createdAt','lastUpdated','date','fileSize','mimeType','width','height','numberOfPages','source','iframeUrl','domain']);
function fieldVal(e){const v=e.v;return Array.isArray(v)?v.join(', '):v==null?'':String(v)}
function linkInVal(o,v){if(v==null||typeof v!=='string')return null;let m=v.match(/^\[\[([^\]|]+)/);if(m)return V.resolve(m[1],o.path);m=v.match(/^\[([^\]]*)\]\(([^)]+\.md)\)$/);if(m)return V.resolve(m[2],o.path);return null}
function fieldRow(o,e){const v=e.v,k=e.k,lab=`<span class="fk micro" title="${esc(k)}">${esc(humanize(k))}</span>`;
  if(typeof v==='boolean')return`<div class="fr" data-fk="${esc(k)}">${lab}<button type="button" class="fb" data-k="${esc(k)}">◂ ${v?'Yes':'No'} ▸</button><span></span></div>`;
  const lk=linkInVal(o,v);let disp=fieldVal(e),ro=RO.has(k);if(ro&&/^\d{4}-\d\d-\d\dT/.test(disp))disp=disp.replace(/T(\d\d:\d\d)[^ ]*/g,' $1').replace(' -> ',' → ');
  if(lk){const t=getObj(lk);return`<div class="fr" data-fk="${esc(k)}">${lab}<span class="fx">${refChip(lk,t?t.title:disp,true)}</span><span></span></div>`}
  if(/^\[[^\]]*\]\([^)]+\)$/.test(disp)&&!lk)disp=disp.replace(/^\[([^\]]*)\].*$/,'$1');
  const url=/^https?:\/\//.test(disp)?disp:/^\[?https?:/.test(disp)?disp.replace(/^\[([^\]]*)\].*/,'$1'):null;
  return`<div class="fr" data-fk="${esc(k)}">${lab}<input class="fv" data-k="${esc(k)}" value="${esc(disp)}"${ro?' readonly':''} placeholder="Empty" spellcheck="false" autocomplete="off"><span class="fx">${url?`<a class="ext" href="${esc(url)}" target="_blank" rel="noopener">↗</a>`:''}</span></div>`}
function fieldsHTML(o,all){const rows=[];let hidden=0;
  if(o.type==='Query'&&!o.fm.has('query'))o.fm.set('query','');
  for(const e of o.fm.e){if(!e.k||e.k==='type'||e.k==='title'||(e.k==='date'&&o.day))continue;const empty=e.v==null||e.v===''||(Array.isArray(e.v)&&!e.v.length);if(empty&&!all&&e.k!=='tags'&&e.k!=='query'){hidden++;continue}rows.push(fieldRow(o,e))}
  rows.push(`<div class="fx">${hidden?`<button type="button" class="fmore" id="f-more">+ ${hidden} empty field${hidden>1?'s':''}</button>`:''}<button type="button" class="fmore" id="f-add">+ Add field</button></div>`);return rows.join('')}
function setField(o,k,raw){const e=o.fm.e.find(x=>x.k===k);const old=e?e.v:null;let v=raw.trim();
  if(Array.isArray(old)||k==='tags'||k==='aliases'&&v.includes(','))v=v?v.split(',').map(s=>s.trim()).filter(Boolean):[];else if(typeof old==='number'&&/^-?\d+(\.\d+)?$/.test(v))v=Number(v);else if(v==='')v=null;
  o.fm.set(k,v);S.touch(o);if(k==='query')renderQuery(o)}
function refsHTML(o){const ids=[...(V.back.get(o.id)||[])].map(getObj).filter(Boolean).sort(byOrder);
  if(!ids.length)return`<h3>Linked references <span class="micro">00</span></h3><p class="rl">Nothing links here yet. Type [[${esc(o.title.slice(0,60))}]] in any note to connect it.</p>`;
  let h=`<h3>Linked references <span class="micro">${pad2(ids.length)}</span></h3>`;
  for(const s of ids){const t=typeInfo(s.type),lines=V.refLines(s.id,o.id);h+=`<div class="rg"><button type="button" class="rg-h" data-oid="${esc(s.id)}"><span class="dot" style="--c:${t.c}"></span><span class="rt">${esc(s.title)}</span><span class="micro">${esc(t.label)}</span></button>`;
    lines.slice(0,4).forEach(x=>{h+=x.field?`<div class="rl"><span class="bc">Field · ${esc(humanize(x.field))}</span></div>`:`<div class="rl">${x.path.length?`<span class="bc">${esc(x.path.join(' › '))}</span>`:''}${renderNode(x.node,s)}</div>`});if(lines.length>4)h+=`<div class="rl"><span class="bc">+ ${lines.length-4} more</span></div>`;h+='</div>'}return h}
function renderQuery(o){const box=$('#qres');if(!box)return;const q=String(o.fm.get('query')||'').trim();if(!q){box.innerHTML='<h3>Live search</h3><p class="rl">Write a search in the Query field above: words, "phrases", type:book, #tag, is:task, links:Title.</p>';return}
  const res=V.search(q,80).filter(x=>x!==o);box.innerHTML=`<h3>Live search <span class="micro">${pad2(res.length)}</span></h3>`+res.map(x=>{const t=typeInfo(x.type);return`<div class="rg"><button type="button" class="rg-h" data-oid="${esc(x.id)}"><span class="dot" style="--c:${t.c}"></span><span class="rt">${esc(x.title)}</span><span class="micro">${esc(t.label)}</span></button><div class="rl">${esc(V.snippet(x,q,150))}</div></div>`}).join('')}
function shiftDay(day,n){const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+n);return ymd(d)}
function daysHTML(day){const have=new Set([...V.objs.values()].map(o=>o.day).filter(Boolean)),td=todayYmd();let h=`<div class="days"><button type="button" class="nav" data-day="${shiftDay(day,-7)}" aria-label="Previous week">◂</button>`;
  for(let i=-3;i<=3;i++){const k=shiftDay(day,i),d=new Date(k+'T12:00:00');h+=`<button type="button" class="${[k===day?'on':'',have.has(k)?'has':'',k===td?'today':''].join(' ')}" data-day="${k}" data-help="${esc(d.toDateString())}${have.has(k)?'':' (empty)'}"><span class="micro">${d.toLocaleDateString('en-US',{weekday:'short'})}</span>${d.getDate()}</button>`}
  return h+`<button type="button" class="nav" data-day="${shiftDay(day,7)}" aria-label="Next week">▸</button><span class="sp"></span><button type="button" class="ghostbtn" data-day="${td}">Today</button><button type="button" class="ghostbtn" id="o-stamp" data-help="Add a time-stamped entry, like Capacities.">+ Entry</button></div>`}
function renderSheet(o){const t=typeInfo(o.type),list=V.ofType(o.type),idx=list.indexOf(o)+1,pins=store.get('pins',[]);
  const url=typeof o.fm.get('url')==='string'?String(o.fm.get('url')).replace(/^\[([^\]]*)\].*$/,'$1').trim():'';const pdf=(o.body.match(/\]\((\.\/Media\/[^)]+\.pdf)\)/i)||[])[1];
  let h=`<div class="o-meta"><button type="button" class="tag" id="o-type" style="--c:${t.c}" data-help="Change the type of this object.">${t.tag}</button><span class="micro">${esc(t.label)}</span><span class="micro" id="o-no">${idx?'No. '+pad2(idx)+' / '+pad2(list.length):o.virtual?'New · writes on first edit':''}</span><span class="sp"></span><span class="o-save micro" id="o-save"></span></div>`;
  h+=`<h1 class="o-title${o.title.length>70?' long':''}" id="o-title" contenteditable="plaintext-only" spellcheck="true">${esc(o.title)}</h1>`;
  h+=`<div class="o-sub micro">${o.date?`<span>${o.type==='DailyNote'?o.date.toLocaleDateString('en-US',{weekday:'long'}):'Logged '+dot(o)}</span>`:''}<span>${esc(o.path)}</span></div>`;
  if(o.type==='DailyNote'&&o.day)h+=daysHTML(o.day);
  h+=`<div class="o-acts">${/^https?:/.test(url)?`<a class="capsule" href="${esc(url)}" target="_blank" rel="noopener" data-help="${esc(url)}">Open link ↗</a>`:''}${pdf?`<button type="button" class="capsule" id="o-pdf" data-vp="${esc(joinPath(dirOf(o.path),pdf))}">View PDF</button>`:''}<button type="button" class="ghostbtn${pins.includes(o.id)?' on':''}" id="o-pin" data-help="Keep this in your Party. [P]">${pins.includes(o.id)?'★ Pinned':'☆ Pin'}</button><button type="button" class="ghostbtn" id="o-cx" data-help="Find this crystal in the Crystarium.">◇ Crystarium</button></div>`;
  h+=`<div class="media" id="o-media" hidden></div><section class="fields" id="fields">${fieldsHTML(o)}</section>`;
  if(o.type==='Query')h+=`<section class="qres" id="qres"></section>`;
  h+=`<div class="crumbs" id="crumbs" hidden></div><div class="ol" id="ol"></div><button type="button" class="addline" id="addline">+ Add a node</button><section class="refs" id="refs">${refsHTML(o)}</section>`;
  const sh=$('#sheet');sh.innerHTML=h;hydrate(sh);bindOutline($('#ol'));E.mount(o);S.set(o.dirty?'dirty':'saved');if(o.type==='Query')renderQuery(o)}
function sheetMeta(o){const el=$('#o-no');if(!el)return;const list=V.ofType(o.type),idx=list.indexOf(o)+1;el.textContent=idx?'No. '+pad2(idx)+' / '+pad2(list.length):o.virtual?'New · writes on first edit':''}
function bindSheet(){const sh=$('#sheet');
  sh.addEventListener('click',async e=>{const t=e.target,o=E.o;if(!o)return;
    const r=t.closest('.refs a.ref,.refs .rg-h,.fields a.ref,.qres .rg-h');if(r){e.preventDefault();openObj(r.dataset.oid);return}
    if(t.closest('.refs a.ext,.fields a.ext')){return}
    const tg=t.closest('.refs .tagc');if(tg){PAL.open('#'+tg.dataset.tag);return}
    const d=t.closest('[data-day]');if(d){A.play('cursor');openObj(dailyObj(d.dataset.day).id);return}
    if(t.closest('#o-stamp')){stampEntry();return}
    if(t.closest('#o-type')){PAL.open('','type');return}
    if(t.closest('#o-pin')){togglePin(o);return}
    if(t.closest('#o-cx')){CX.selId=o.id;go('crystarium');return}
    const pb=t.closest('#o-pdf');if(pb){const m=$('#o-media');if(!m.hidden){m.hidden=true;m.innerHTML='';pb.textContent='View PDF';return}m.hidden=false;m.innerHTML=`<iframe title="PDF"></iframe>`;const ifr=m.querySelector('iframe');ifr.addEventListener('load',()=>setTimeout(()=>{if(document.activeElement===ifr){ifr.blur();window.focus()}},60));ifr.src=await B.media(pb.dataset.vp);pb.textContent='Hide PDF';A.play('confirm');return}
    if(t.closest('#f-more')){$('#fields').innerHTML=fieldsHTML(o,true);return}
    if(t.closest('#f-add')){const x=t.closest('.fx');x.outerHTML=`<div class="fr"><input class="fv" id="nf-k" placeholder="Field name" autocomplete="off" spellcheck="false"><input class="fv" id="nf-v" placeholder="Value  (Enter to add)" autocomplete="off"><span></span></div>`+x.outerHTML.replace(/<button[^>]*id="f-add"[^>]*>.*?<\/button>/,'');$('#nf-k').focus();return}
    const fb=t.closest('.fb');if(fb){const k=fb.dataset.k;o.fm.set(k,!o.fm.get(k));S.touch(o);fb.textContent='◂ '+(o.fm.get(k)?'Yes':'No')+' ▸';A.play('cursor');return}
    if(t.closest('#addline')){const top=E.top(),last=top.kids[top.kids.length-1];if(last&&!last.text&&!last.kids.length){E.focus(last.id,0);return}E.snap();const n=mk(last&&last.kind==='li'?'li':'p','');top.kids.push(n);E.changed({id:n.id,at:0});return}
    if(t.closest('#crumbs button')){const z=t.closest('button').dataset.z;E.zoom=z||null;E.render();A.play('back');return}});
  sh.addEventListener('input',e=>{const o=E.o;if(!o)return;if(e.target.id==='o-title'){const v=getText(e.target).replace(/\n/g,' ');o.title=v;o.fm.set('title',v);o._tchanged=true;S.touch(o);return}
    if(e.target.matches('.fv[data-k]')){clearTimeout(e.target._t);const el=e.target;el._t=setTimeout(()=>setField(o,el.dataset.k,el.value),el.dataset.k==='query'?200:500)}});
  sh.addEventListener('keydown',e=>{const o=E.o;if(!o)return;
    if(e.target.id==='o-title'&&(e.key==='Enter'||e.key==='ArrowDown')){e.preventDefault();const f=E.visible()[0];if(f)E.focus(E.node(f).id,0)}
    if(e.target.id==='o-title'&&e.key==='Escape'){e.preventDefault();e.target.blur();NAV.land({title:1})}
    if(e.target.matches('.fv')&&e.key==='Escape'){e.preventDefault();const k=e.target.dataset.k;e.target.blur();NAV.land(k?{field:k}:{})}
    if(e.target.matches('.fv[data-k]')&&e.key==='Enter'){e.preventDefault();const k=e.target.dataset.k;e.target.blur();NAV.land({field:k})}
    if(e.target.id==='nf-k'&&e.key==='Enter'){e.preventDefault();$('#nf-v').focus()}
    if(e.target.id==='nf-v'&&e.key==='Enter'){e.preventDefault();const k=$('#nf-k').value.trim().replace(/\s+(\w)/g,(m,c)=>c.toUpperCase()).replace(/[^\w]/g,'');if(!k){$('#nf-k').focus();return}setField(o,k,e.target.value);$('#fields').innerHTML=fieldsHTML(o,true);A.play('confirm')}});
  sh.addEventListener('focusout',e=>{if(e.target.matches('.fv[data-k]')){clearTimeout(e.target._t);const o=E.o,k=e.target.dataset.k;if(o&&!e.target.readOnly&&fieldVal(o.fm.e.find(x=>x.k===k)||{})!==e.target.value)setField(o,k,e.target.value)}
    if(e.target.id==='o-title'){const o=E.o;if(o&&!o.title.trim()){o.title='Untitled';o.fm.set('title','Untitled');e.target.textContent='Untitled';S.touch(o)}}});
  sh.addEventListener('focusin',e=>{if(e.target.matches('.fv,#o-title'))setHints('obj')})}
function stampEntry(){const top=E.top();E.snap();const st=mk('p',new Date().toTimeString().slice(0,5)),n=mk('p','');const last=top.kids[top.kids.length-1];if(last&&!last.text&&!last.kids.length)top.kids.pop();top.kids.push(st,n);E.changed({id:n.id,at:0});A.play('confirm')}
function togglePin(o){if(!o||o.virtual){A.play('dull');return}let p=store.get('pins',[]);const on=!p.includes(o.id);p=on?[o.id,...p].slice(0,6):p.filter(x=>x!==o.id);store.set('pins',p);A.play(on?'confirm':'back');const b=$('#o-pin');if(b){b.classList.toggle('on',on);b.textContent=on?'★ Pinned':'☆ Pin'}notice(on?`★ <b>${esc(o.title)}</b> joined your Party.`:`Unpinned <b>${esc(o.title)}</b>.`,1800)}
let RECENT=store.get('recent',[]);function pushRecent(o){if(o.virtual)return;RECENT=[o.id,...RECENT.filter(x=>x!==o.id)].slice(0,24);store.set('recent',RECENT)}
function objInfo(o){setInfo([['Type',typeInfo(o.type).label],['Links',pad2(o.links?o.links.size:0)],['Linked from',pad2((V.back.get(o.id)||new Set()).size)],['Words',String(words(o))],['Vault',B.name||'—']])}

/* ===================== Party ===================== */
let PARTY=[],psel=0;
function partyList(){const pins=store.get('pins',[]),rec=store.get('recent',[]);const ids=[...new Set([...pins,...rec])].filter(id=>V.objs.has(id));
  if(ids.length<6){const extra=[...V.ofType('DailyNote').slice(0,2),...V.ofType('Project'),...V.ofType('Page')].map(o=>o.id);for(const x of extra){if(ids.length>=6)break;if(!ids.includes(x))ids.push(x)}}return ids.slice(0,6).map(id=>V.objs.get(id))}
function buildParty(){PARTY=partyList();const pins=store.get('pins',[]);$('#cards').innerHTML=PARTY.map((o,i)=>{const t=typeInfo(o.type);return`<button type="button" class="pc" data-i="${i}" aria-label="${esc(o.title)}" data-help="${esc(o.title+(o.preview?' — '+o.preview.slice(0,110):''))}"><canvas aria-hidden="true"></canvas><span class="pshade"></span><span class="glint"></span><span class="ptop"><b class="num">${pad2(i+1)}</b><span class="tag" style="--c:${t.c}">${t.tag}</span></span>${pins.includes(o.id)?'<span class="bang pnew">★</span>':i===0?'<span class="micro pnew" style="color:#fff;text-shadow:0 1px 3px #000">Leader</span>':''}<span class="pname"><span class="micro">${esc(t.label)}</span><b>${esc(o.title)}</b><span class="micro">${dot(o)}</span></span></button>`}).join('')||'<p class="empty">Open a few objects and they gather here.</p>'}
function drawParty(){$$('#cards .pc').forEach(b=>drawArt(b.querySelector('canvas'),PARTY[+b.dataset.i]))}
function partySelect(i,{quiet=false,focus=false}={}){if(!PARTY.length)return;i=clamp(i,0,PARTY.length-1);const ch=i!==psel;psel=i;$$('#cards .pc').forEach(b=>b.classList.toggle('on',+b.dataset.i===i));const b=$(`#cards .pc[data-i="${i}"]`);
  if(b){if(focus)b.focus({preventScroll:true});if(PHONE())b.scrollIntoView({inline:'center',block:'nearest',behavior:RM()?'auto':'smooth'});if(view==='party')pointAt(b);if(ch&&!quiet){const gl=b.querySelector('.glint');gl.classList.remove('go');void gl.offsetWidth;gl.classList.add('go')}}
  if(ch&&!quiet)A.play('cursor');const o=PARTY[i];if(view==='party'){setInfo([['Leader',PARTY[0].title],['Selected',o.title],['Type',typeInfo(o.type).label],['Linked from',pad2((V.back.get(o.id)||new Set()).size)],['Objects',String(V.objs.size)]]);if(!quiet)help(o.title+(o.preview?' — '+o.preview.slice(0,140):''))}}

/* ===================== Datalog ===================== */
const DL={type:'DailyNote',tag:null,filter:'',sel:0,rows:[],
  buildTypes(){const ts=V.types();if(!this.tag&&!ts.includes(this.type))this.type=ts[0]||'AtomicNote';let h=ts.map(t=>{const n=V.ofType(t).length,ti=typeInfo(t);return`<button type="button" class="tro${!this.tag&&this.type===t?' on':''}" data-t="${esc(t)}" data-help="${esc(ti.label)}: ${n} objects. [← →]"><span class="dot" style="--c:${ti.c}"></span><span class="tn">${esc(ti.label)}</span><span class="tc">${n}</span></button>`}).join('');
    const tags=[...V.tags.values()].sort((a,b)=>b.ids.size-a.ids.size).slice(0,16);if(tags.length)h+=`<div class="ghead"><span class="micro">Tags</span><i></i></div>`+tags.map(x=>`<button type="button" class="tro tagrow${this.tag===x.name?' on':''}" data-tag="${esc(x.name)}"><span class="dot"></span><span class="tn">#${esc(x.name)}</span><span class="tc">${x.ids.size}</span></button>`).join('');$('#log-types').innerHTML=h},
  compute(){let list=this.tag?[...((V.tags.get(this.tag.toLowerCase())||{ids:new Set()}).ids)].map(id=>V.objs.get(id)).filter(Boolean).sort(byOrder):V.ofType(this.type);const f=this.filter.trim();if(f){const r=new Set(V.search(f,9999));list=list.filter(o=>r.has(o))}this.rows=list},
  build(){this.compute();let h='',cur=null;const grp=!this.tag&&this.rows.some(o=>o.date);
    this.rows.forEach((o,i)=>{if(grp){const g=o.date?o.date.toLocaleDateString('en-US',{month:'long',year:'numeric'}):'Undated';if(g!==cur){if(cur!==null)h+='</div>';cur=g;h+=`<div class="grp"><div class="ghead"><span class="micro">${esc(g)}</span><i></i></div>`}}
      h+=`<a class="row" href="#o/${encodeURIComponent(o.id)}" data-i="${i}" data-help="${esc(o.preview?o.preview.slice(0,140):o.title)}"><span class="dot" style="--c:${typeInfo(o.type).c}"></span><span class="rt">${esc(o.title)}</span><span class="rd">${o.date?dot(o):''}</span></a>`});
    if(grp&&cur!==null)h+='</div>';$('#log-list').innerHTML=h||`<p class="empty">${this.filter?'Nothing matches “'+esc(this.filter)+'”.':'No objects of this type yet.'}</p>`;this.sel=clamp(this.sel,0,Math.max(0,this.rows.length-1))},
  setType(t,tag){this.type=t||this.type;this.tag=tag||null;this.sel=0;this.buildTypes();this.build();this.select(0,{quiet:true});A.play('cursor')},
  stepType(d){const ts=V.types();const i=ts.indexOf(this.type);const n=this.tag?0:clamp(i+d,0,ts.length-1);if(!this.tag&&n===i){A.play('dull');return}this.setType(ts[n],null)},
  select(i,{quiet=false,focus=false}={}){const o=this.rows[i];$$('#log-list .row').forEach(a=>a.classList.toggle('on',+a.dataset.i===i));if(!o){this.renderPane(null);return}const ch=i!==this.sel;this.sel=i;const row=$(`#log-list .row[data-i="${i}"]`);
    if(row){row.scrollIntoView({block:'nearest'});if(focus)row.focus({preventScroll:true});if(view==='datalog')pointAt(row)}if(ch&&!quiet)A.play('cursor');this.renderPane(o,ch&&!quiet);if(ch||quiet)drawLogBg(o);
    if(view==='datalog')setInfo([['Entries',pad2(this.rows.length)],['Selected',o.title],['Type',typeInfo(o.type).label],['Logged',dot(o)],['Vault',String(V.objs.size)+' objects']])},
  renderPane(o,anim){if(!o){$('#p-title').textContent='—';$('#p-prev').textContent='';return}const t=typeInfo(o.type),tg=$('#p-tag');tg.textContent=t.tag;tg.style.setProperty('--c',t.c);$('#p-type').textContent=t.label;$('#p-n').textContent='No. '+pad2(V.ofType(o.type).indexOf(o)+1);
    $('#p-title').textContent=o.title;$('#p-date').textContent=o.date?o.date.toDateString():o.path;$('#p-out').textContent=pad2(o.links.size);$('#p-in').textContent=pad2((V.back.get(o.id)||new Set()).size);$('#p-words').textContent=words(o);$('#p-prev').textContent=o.preview||'No text yet.';
    if(anim&&!RM())$('#pane .p-in').animate([{opacity:0,transform:'translateX(14px)'},{opacity:1,transform:'none'}],{duration:T(240),easing:QUICK})}};
$('#log-types').addEventListener('click',e=>{const b=e.target.closest('.tro');if(!b)return;if(b.dataset.tag)DL.setType(null,b.dataset.tag);else DL.setType(b.dataset.t,null)});
$('#log-list').addEventListener('click',e=>{const a=e.target.closest('.row');if(!a||e.metaKey||e.ctrlKey||e.shiftKey)return;e.preventDefault();const i=+a.dataset.i;if(i===DL.sel&&!PHONE())openObj(DL.rows[i].id,{o0:centerOf(a)});else{DL.select(i);if(PHONE())openObj(DL.rows[i].id)}});
$('#log-filter').addEventListener('input',e=>{DL.filter=e.target.value;DL.sel=0;DL.build();DL.select(0,{quiet:true})});
$('#log-filter').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();DL.select(Math.min(DL.rows.length-1,DL.sel+1),{focus:false})}else if(e.key==='ArrowUp'){e.preventDefault();DL.select(Math.max(0,DL.sel-1))}else if(e.key==='Enter'){e.preventDefault();if(DL.rows[DL.sel])openObj(DL.rows[DL.sel].id)}else if(e.key==='Escape'){e.preventDefault();e.target.value='';DL.filter='';DL.build();DL.select(0,{quiet:true});e.target.blur()}});
$('#p-open').addEventListener('click',e=>{if(DL.rows[DL.sel])openObj(DL.rows[DL.sel].id,{o0:centerOf(e.currentTarget)})});
$('#p-close').addEventListener('click',()=>{A.play('back');$('#pane').classList.remove('open')});
const centerOf=el=>{const b=el.getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2}};

/* ===================== Crystarium: one ring per type, links are the paths ===================== */
const CX={cv:$('#cx'),W:0,H:0,dpr:1,F:800,cx:0,cy:0,vx:0,vy:0,yaw:0,yawT:0,user:0,pitch:.5,dist:12,zoom:0,tx:0,ty:0,tz:0,running:false,far:false,rush:false,hover:-1,RISE:2.5,
  nodes:[],rings:[],edges:[],deg:[],idx:new Map(),sel:0,selId:null,dirty:true,pool:[],spr:{},
  build(){const keep=this.selId||(this.nodes[this.sel]&&this.nodes[this.sel].o.id);this.rings=V.types().map(t=>({t,list:V.ofType(t)}));this.nodes=[];
    this.rings.forEach((r,ri)=>{const n=r.list.length;r.R=Math.max(2.3,n*.66/(2*Math.PI));r.y=ri*this.RISE;r.list.forEach((o,j)=>{const a=j/n*Math.PI*2+ri*.9;this.nodes.push({o,ri,j,a,x:Math.cos(a)*r.R,y:r.y,z:Math.sin(a)*r.R})})});
    this.idx=new Map(this.nodes.map((n,i)=>[n.o.id,i]));this.edges=[];this.deg=this.nodes.map(()=>0);this.nb=this.nodes.map(()=>[]);
    this.nodes.forEach((n,i)=>{for(const t of n.o.links){const k=this.idx.get(t);if(k!=null&&k!==i){this.edges.push([i,k]);this.deg[i]++;this.deg[k]++;this.nb[i].push(k);this.nb[k].push(i)}}});
    const k=keep!=null?this.idx.get(keep):null;this.sel=k!=null?k:0;this.selId=null;this.dirty=false;this.selectQuiet()},
  init(){this.g=this.cv.getContext('2d');this.g.lineCap='round';const box=$('#chips');for(let i=0;i<14;i++){const c=document.createElement('div');c.className='chip';box.appendChild(c);this.pool.push(c)}this.resize()},
  resize(){this.dpr=Math.min(2,devicePixelRatio||1);this.W=innerWidth;this.H=innerHeight;this.cv.width=this.W*this.dpr;this.cv.height=this.H*this.dpr;this.center()},
  center(){const v=$('#v-cryst').getBoundingClientRect();this.vx=v.left;this.vy=v.top;if(PHONE()){this.cx=this.W/2;this.cy=this.H*.36;this.F=Math.min(this.W,this.H)*1.25}else{const card=$('#card').getBoundingClientRect(),mw=v.left||0,right=card.width?card.left-24:this.W;this.cx=mw+(right-mw)/2;this.cy=this.H*.54;this.F=Math.min(this.W,this.H)*1.05}},
  proj(p){const cy=Math.cos(this.yaw),sy=Math.sin(this.yaw),cp=Math.cos(this.pitch),sp=Math.sin(this.pitch),x=p.x-this.tx,y=p.y-this.ty,z=p.z-this.tz,x1=x*cy-z*sy,z1=x*sy+z*cy,y2=y*cp+z1*sp,z2=z1*cp-y*sp,d=z2+this.dist;if(d<.6)return null;const s=this.F/d;return{x:this.cx+x1*s,y:this.cy-y2*s,s,z:d}},
  show(on){const el=this.cv;el.getAnimations().forEach(a=>a.cancel());el.style.opacity=on?1:0;this.running=on;if(on){if(this.dirty||this.selId)this.build();this.center()}else this.pool.forEach(c=>c.classList.remove('v','on'))},
  screenOf(k){const n=this.nodes[k],p=n&&this.proj(n);return p?{x:p.x,y:p.y}:null},
  rad(i,p){return p.s*(.17+.03*Math.min(8,this.deg[i]))*(i===this.sel?1.45:1)},
  pick(x,y){let best=-1,bz=1e9;this.nodes.forEach((n,i)=>{const p=this.proj(n);if(!p)return;if(Math.hypot(p.x-x,p.y-y)<this.rad(i,p)+9&&p.z<bz){bz=p.z;best=i}});return best},
  orb(col){if(this.spr[col])return this.spr[col];const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');const h=g.createRadialGradient(48,48,6,48,48,48);h.addColorStop(0,rgba(col,.5));h.addColorStop(1,rgba(col,0));g.fillStyle=h;g.fillRect(0,0,96,96);
    const r=16,b=g.createRadialGradient(48-r*.35,48-r*.4,r*.05,48,48,r);b.addColorStop(0,'#fff');b.addColorStop(.38,col);b.addColorStop(1,mix(col,'#1b1424',.55));g.fillStyle=b;g.beginPath();g.arc(48,48,r,0,7);g.fill();g.lineWidth=1;g.strokeStyle='rgba(255,255,255,.4)';g.stroke();g.fillStyle='rgba(255,255,255,.85)';g.beginPath();g.ellipse(48-r*.3,48-r*.38,r*.3,r*.16,-.6,0,7);g.fill();return this.spr[col]=c},
  frame(dt,t){if(!this.nodes.length)return;const g=this.g,W=this.W,H=this.H,pearl=P.world==='pearl',k=RM()?1:1-Math.exp(-dt*(this.rush?7:4.2)),cur=this.nodes[this.sel];
    let Tg;const top=(this.rings.length-1)*this.RISE;if(this.far){Tg={x:0,y:top/2,z:0};if(!RM())this.yawT+=dt*.1}else Tg=cur;
    const dT=this.rush?3.4:(this.far?Math.max(34,top*1.5):12.5)+this.zoom;this.tx+=(Tg.x-this.tx)*k;this.ty+=(Tg.y-this.ty)*k;this.tz+=(Tg.z-this.tz)*k;this.dist+=(dT-this.dist)*k;
    const yt=this.yawT+this.user+(RM()?0:Math.sin(t*.18)*.12);this.yaw+=(((yt-this.yaw+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI)*k;
    g.setTransform(this.dpr,0,0,this.dpr,0,0);g.clearRect(0,0,W,H);const tg=g.createRadialGradient(this.cx,this.cy,0,this.cx,this.cy,Math.max(W,H)*.75);
    if(pearl){tg.addColorStop(0,'rgba(236,230,240,.5)');tg.addColorStop(1,'rgba(70,58,80,.35)')}else{tg.addColorStop(0,'rgba(70,50,110,.18)');tg.addColorStop(1,'rgba(0,0,0,.45)')}g.fillStyle=tg;g.fillRect(0,0,W,H);
    this.rings.forEach((r,ri)=>{if(Math.abs(ri-cur.ri)>4&&!this.far)return;this.disc(r,ri===cur.ri?1:.28,t,pearl,ri===cur.ri)});
    const P2=this.nodes.map(n=>this.proj(n));
    g.beginPath();for(const[a,b]of this.edges){const p=P2[a],q=P2[b];if(!p||!q)continue;g.moveTo(p.x,p.y);g.lineTo(q.x,q.y)}g.strokeStyle=pearl?'rgba(60,44,80,.13)':'rgba(170,215,255,.09)';g.lineWidth=1;g.stroke();
    const sp=P2[this.sel];if(sp){const col=typeInfo(cur.o.type).c;for(const j of this.nb[this.sel]){const q=P2[j];if(!q)continue;g.strokeStyle=rgba(col,.35);g.lineWidth=Math.max(2,sp.s*.06);g.beginPath();g.moveTo(sp.x,sp.y);g.lineTo(q.x,q.y);g.stroke();g.strokeStyle=pearl?'rgba(255,255,255,.95)':'rgba(230,255,245,.9)';g.lineWidth=1.3;g.stroke();
        if(!RM()){const u=(t*.6+j*.37)%1,x=sp.x+(q.x-sp.x)*u,y=sp.y+(q.y-sp.y)*u,rg=g.createRadialGradient(x,y,0,x,y,7);rg.addColorStop(0,'rgba(255,255,255,.95)');rg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=rg;g.beginPath();g.arc(x,y,7,0,7);g.fill()}}}
    const order=P2.map((p,i)=>[i,p]).filter(x=>x[1]&&x[1].x>-80&&x[1].x<W+80&&x[1].y>-80&&x[1].y<H+80).sort((a,b)=>b[1].z-a[1].z);const lit=new Set([this.sel,...this.nb[this.sel]]);
    for(const[i,p]of order){const n=this.nodes[i],r=this.rad(i,p),near=lit.has(i)||n.ri===cur.ri||this.far;g.globalAlpha=near?1:.4;g.drawImage(this.orb(typeInfo(n.o.type).c),p.x-r*3,p.y-r*3,r*6,r*6);if(i===this.hover&&i!==this.sel){g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=1.2;g.beginPath();g.arc(p.x,p.y,r*1.5,0,7);g.stroke()}}g.globalAlpha=1;
    if(sp){const r=this.rad(this.sel,sp),col=typeInfo(cur.o.type).c,rot=RM()?0:t*1.6;g.strokeStyle=pearl?'rgba(255,255,255,.95)':'rgba(220,255,245,.95)';g.lineWidth=1.6;for(let j=0;j<2;j++){g.beginPath();g.arc(sp.x,sp.y,r*1.8,rot+j*Math.PI,rot+j*Math.PI+1.9);g.stroke()}
      const bh=sp.s*(this.rush?6:1.6),bg=g.createLinearGradient(sp.x,sp.y-r,sp.x,sp.y-r-bh);bg.addColorStop(0,rgba(col,.6));bg.addColorStop(1,rgba(col,0));g.fillStyle=bg;g.fillRect(sp.x-r*.16,sp.y-r-bh,r*.32,bh);if(!RM())star(g,sp.x+r*.5,sp.y-r*.6,r*(.6+.6*(.5+.5*Math.sin(t*3))))}
    const show=this.rush?[]:[this.sel,...(this.hover>=0&&this.hover!==this.sel?[this.hover]:[]),...(this.far||PHONE()?[]:this.nb[this.sel].slice(0,10))];
    const placed=[];this.pool.forEach((c,ci)=>{const i=show[ci];const p=i!=null&&P2[i];if(!p||(ci>0&&placed.some(q=>Math.abs(q.y-p.y)<22&&Math.abs(q.x-p.x)<260))){c.classList.remove('v','on');return}placed.push(p);const n=this.nodes[i];if(c._i!==i){c.textContent=n.o.title;c._i=i}c.classList.add('v');c.classList.toggle('on',i===this.sel);const r=this.rad(i,p);c.style.transform=`translate(${(p.x+r+10-this.vx).toFixed(1)}px,${(p.y-r-14-this.vy).toFixed(1)}px)`});
    const nh=$('#nhand');if(sp&&!this.rush){nh.style.opacity=1;nh.style.transform=`translate(${(sp.x-this.rad(this.sel,sp)*1.2-50-this.vx).toFixed(1)}px,${(sp.y-12-this.vy).toFixed(1)}px)`}else nh.style.opacity=0},
  disc(r,al,t,pearl,curRing){const g=this.g,R0=r.R+1.1,y0=r.y-.25,base=pearl?'rgba(255,255,255,':'rgba(170,215,255,',seg=curRing?72:40;
    const circ=rad=>{g.beginPath();let m=false;for(let i=0;i<=seg;i++){const an=i/seg*Math.PI*2,p=this.proj({x:Math.cos(an)*rad,y:y0,z:Math.sin(an)*rad});if(!p){m=false;continue}m?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y);m=true}};
    circ(R0);if(curRing){g.fillStyle=pearl?`rgba(255,255,255,${.16*al})`:`rgba(120,190,255,${.05*al})`;g.fill()}g.lineWidth=curRing?1.4:1;g.strokeStyle=base+(.7*al)+')';g.stroke();if(!curRing)return;
    [[.94,.45],[.62,.4],[.34,.45]].forEach(([f,a],i)=>{circ(R0*f);g.lineWidth=1;g.strokeStyle=base+(a*al)+')';if(i===1)g.setLineDash([6,5]);g.stroke();g.setLineDash([])});
    const rot=RM()?0:t*.04;g.beginPath();for(let i=0;i<48;i++){const an=i/48*Math.PI*2+rot,r1=R0*.94,r2=i%4?R0*.985:R0*1.06,a=this.proj({x:Math.cos(an)*r1,y:y0,z:Math.sin(an)*r1}),b=this.proj({x:Math.cos(an)*r2,y:y0,z:Math.sin(an)*r2});if(a&&b){g.moveTo(a.x,a.y);g.lineTo(b.x,b.y)}}g.strokeStyle=base+(.55*al)+')';g.stroke()},
  selectQuiet(){const n=this.nodes[this.sel];if(n)this.yawT=-Math.PI/2-n.a+.38},
  select(k,{quiet=false}={}){if(!this.nodes.length)return;k=((k%this.nodes.length)+this.nodes.length)%this.nodes.length;const ch=k!==this.sel;this.sel=k;this.selectQuiet();if(ch)this.user*=.3;if(ch&&!quiet)A.play('cursor');this.card(ch&&!quiet);const n=this.nodes[k],o=n.o;
    if(view==='crystarium'){setInfo([['Ring',typeInfo(o.type).label],['Crystal',o.title],['Links',pad2(o.links.size)],['Linked from',pad2((V.back.get(o.id)||new Set()).size)],['Index',`${pad2(n.j+1)} / ${pad2(this.rings[n.ri].list.length)}`]]);if(!quiet)help(o.title+(o.preview?' — '+o.preview.slice(0,140):''))}},
  card(anim){const n=this.nodes[this.sel];if(!n)return;const o=n.o,t=typeInfo(o.type);$('#c-n').textContent=pad2(n.j+1);const tg=$('#c-tag');tg.textContent=t.tag;tg.style.setProperty('--c',t.c);$('#c-type').textContent=t.label+' · '+dot(o);$('#c-title').textContent=o.title;$('#c-note').textContent=o.preview||'No text yet.';
    $('#c-out').textContent=pad2(o.links.size);$('#c-in').textContent=pad2((V.back.get(o.id)||new Set()).size);$('#c-stage').textContent=`${n.ri+1} / ${this.rings.length}`;const lv=Math.min(10,this.deg[this.sel]);$('#atb').innerHTML=Array.from({length:10},(_,i)=>`<i${i<lv?' class="f"':''}></i>`).join('');drawArt($('#art'),o);
    if(anim&&!RM()){$('#card .c-body').animate([{opacity:.2,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:T(240),easing:QUICK});const gl=$('#card .glint');gl.classList.remove('go');void gl.offsetWidth;gl.classList.add('go')}},
  step(d){const n=this.nodes[this.sel],ring=this.rings[n.ri].list;const j=(n.j+d+ring.length)%ring.length;this.select(this.idx.get(ring[j].id))},
  ring(d){const n=this.nodes[this.sel],ri=n.ri+d;if(ri<0||ri>=this.rings.length){A.play('dull');return}let best=null,bd=9;for(const o of this.rings[ri].list){const m=this.nodes[this.idx.get(o.id)];let da=Math.abs(((m.a-n.a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI);if(da<bd){bd=da;best=m}}if(best)this.select(this.idx.get(best.o.id))},
  anchor:null,ti:-1,
  hop(d){if(this.anchor==null){this.anchor=this.sel;this.ti=d>0?-1:0}const nb=this.nb[this.anchor]||[];if(!nb.length){A.play('dull');help('No paths from this crystal yet. Link it from a note to grow one.');return}
    this.ti=(this.ti+d+nb.length)%nb.length;const a=this.anchor;this.select(nb[this.ti]);this.anchor=a;const o=this.nodes[nb[this.ti]].o;help(`Path ${this.ti+1}/${nb.length} from ${this.nodes[a].o.title} → ${o.title}. Tab for the next, Enter opens.`);const p=this.screenOf(this.sel);if(p)FX.emit(p.x,p.y,6,typeInfo(o.type).c)},
  toggleFar(){this.far=!this.far;this.zoom=0;if(!this.far)this.selectQuiet();A.play('air');help(this.far?'The whole vault. Press Z to return.':helpDefault)}};
const vc=$('#v-cryst');let pd=null;
vc.addEventListener('pointerdown',e=>{if(e.target.closest('#card'))return;pd={x:e.clientX,y:e.clientY,u:CX.user,moved:false,type:e.pointerType};try{vc.setPointerCapture(e.pointerId)}catch(_){}});
vc.addEventListener('pointermove',e=>{if(pd){const dx=e.clientX-pd.x;if(Math.abs(dx)>6){pd.moved=true;if(pd.type==='mouse'){CX.user=pd.u-dx*.006;vc.classList.add('dragging')}}return}if(e.target.closest('#card')){CX.hover=-1;return}
  const h=CX.pick(e.clientX,e.clientY);if(h!==CX.hover){CX.hover=h;if(h>=0){A.play('cursor');const p=CX.screenOf(h);if(p)FX.emit(p.x,p.y,3,typeInfo(CX.nodes[h].o.type).c);const o=CX.nodes[h].o;help(o.title+(o.preview?' — '+o.preview.slice(0,120):''))}else help()}vc.style.cursor=h>=0?'pointer':''});
vc.addEventListener('pointerup',e=>{if(!pd)return;const d=pd;pd=null;vc.classList.remove('dragging');const dx=e.clientX-d.x;if(d.moved){if(d.type!=='mouse'&&Math.abs(dx)>40)CX.step(dx<0?1:-1);return}const h=CX.pick(e.clientX,e.clientY);if(h<0)return;if(h===CX.sel)openObj(CX.nodes[h].o.id,{o0:CX.screenOf(h)});else CX.select(h)});
vc.addEventListener('pointercancel',()=>{pd=null;vc.classList.remove('dragging')});
vc.addEventListener('pointerleave',()=>{if(!pd)CX.hover=-1});
vc.addEventListener('wheel',e=>{e.preventDefault();CX.zoom=clamp(CX.zoom+e.deltaY*.01,-6,24)},{passive:false});
$('#c-open').addEventListener('click',()=>{const n=CX.nodes[CX.sel];if(n)openObj(n.o.id,{o0:CX.screenOf(CX.sel)})});

/* ===================== Palette: search + commands + new ===================== */
const PAL={mode:'search',sel:0,items:[],newType:null,prev:null,
  open(q='',mode='search'){if(view==='title')return;this.prev=document.activeElement;this.mode=mode;pal.hidden=false;app.inert=true;const i=$('#pal-in');i.value=q;this.sel=0;this.update();i.focus();i.setSelectionRange(q.length,q.length);A.play('confirm');pointAt(null);
    if(!RM())$('.pal').animate([{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'none'}],{duration:T(200),easing:QUICK})},
  close(back=true){if(pal.hidden)return;pal.hidden=true;app.inert=false;AC.hide();if(back)A.play('back');if(this.prev&&this.prev.focus&&document.contains(this.prev))this.prev.focus({preventScroll:true});pointDefault()},
  cmds(){const o=view==='obj'?E.o:null;const c=[{t:'Today',s:'Daily note',k:'T',run:()=>go('today')},{t:'Party',s:'Go to',k:'P',run:()=>go('party')},{t:'Datalog',s:'Go to',k:'D',run:()=>go('datalog')},{t:'Crystarium',s:'Go to',k:'C',run:()=>go('crystarium')},{t:'New object…',s:'Pick a type',k:'N',run:()=>this.open('','new')}];
    if(o){c.push({t:(store.get('pins',[]).includes(o.id)?'Unpin ':'Pin ')+o.title,s:'Party',run:()=>togglePin(o)},{t:'Change type of '+o.title,s:'Object',run:()=>this.open('','type')},{t:'Move '+o.title+' to _trash',s:'Object',run:()=>trashObj(o)})}
    c.push({t:'Save this search as a Query',s:'Live search',run:q=>saveQuery(q)},{t:'Rescan the vault folder',s:'Vault',run:()=>rescan(true)},{t:'Link a different folder…',s:'Vault',run:()=>linkVault(true)},{t:'Switch world',s:'Settings · W',run:()=>setWorld(P.world==='pearl'?'pulse':'pearl')},{t:'Sound on / off',s:'Settings · M',run:()=>setSound(!P.sound)},{t:'Settings',s:'S',run:()=>openSettings()},{t:'Title screen',s:'',run:()=>toTitle()});return c},
  update(){const q=$('#pal-in').value,ql=q.trim().toLowerCase();let it=[];const m=$('#pal-mode');
    if(this.mode==='new'){m.textContent='New object · pick a type';it=V.types().concat(TORDER).filter((t,i,a)=>a.indexOf(t)===i&&t!=='DailyNote').filter(t=>!ql||typeInfo(t).label.toLowerCase().includes(ql)||t.toLowerCase().includes(ql)).map(t=>({t:'New '+typeInfo(t).label,s:typeInfo(t).dir+'/',c:typeInfo(t).c,run:()=>{this.newType=t;this.open('','title')}}))
      /* typed a title instead of a type: offer it straight away as the common types */
      if(!it.length&&q.trim()){const name=q.trim();it=['AtomicNote','Page','Project','Person','Book','Quote'].map(t=>({t:`New ${typeInfo(t).label}: “${name}”`,s:typeInfo(t).dir+'/',c:typeInfo(t).c,run:async()=>{this.close(false);const ex=V.resolve(name);if(ex&&V.objs.get(ex).type===t){openObj(ex);return}const o=await createObj(t,name);beam(innerWidth/2,innerHeight*.4,typeInfo(t).c);notice(`Crystal acquired: <b>${esc(o.title)}</b>!`);openObj(o.id)}}))}}
    else if(this.mode==='title'){const ty=this.newType;m.textContent='New '+typeInfo(ty).label+' · name it';it=[{t:q.trim()?`Create ${typeInfo(ty).label}: “${q.trim()}”`:'Type a name, then Enter',s:typeInfo(ty).dir+'/',c:typeInfo(ty).c,run:async()=>{if(!q.trim())return'keep';const o=await createObj(ty,q.trim());beam(innerWidth/2,innerHeight*.4,typeInfo(ty).c);notice(`Crystal acquired: <b>${esc(o.title)}</b>!`);openObj(o.id)}}];const ex=q.trim()&&V.resolve(q.trim());if(ex){const o=V.objs.get(ex);it.push({t:'Open existing: '+o.title,s:typeInfo(o.type).label,c:typeInfo(o.type).c,run:()=>openObj(o.id)})}}
    else if(this.mode==='type'){m.textContent='Change type';it=TORDER.filter(t=>!ql||typeInfo(t).label.toLowerCase().includes(ql)).map(t=>({t:typeInfo(t).label,s:t===(E.o&&E.o.type)?'Current':'',c:typeInfo(t).c,run:()=>{const o=E.o;if(!o)return;o.type=t;o.fm.set('type',t);S.touch(o);V.indexOne(o);CX.dirty=true;openObj(o.id,{push:false,quiet:true});notice(`<b>${esc(o.title)}</b> is now a ${esc(typeInfo(t).label)}. The file stays where it is.`)}}))}
    else if(q.startsWith('>')){m.textContent='Commands';it=this.cmds().filter(c=>!q.slice(1).trim()||c.t.toLowerCase().includes(q.slice(1).trim().toLowerCase()))}
    else if(!ql){m.textContent='Recent';it=store.get('recent',[]).map(getObj).filter(Boolean).slice(0,8).map(o=>this.objItem(o,''));it.push(...this.cmds().slice(0,5).map(c=>({...c,sec:it.length&&!c.sec?'':''})))}
    else{m.textContent='Search';const res=V.search(q,40);it=res.map(o=>this.objItem(o,q));if(!V.resolve(q.trim())&&!/[:#"]/.test(q))it.push({t:`Create “${q.trim()}”`,s:'New Atomic note · or > New object… for another type',c:typeInfo('AtomicNote').c,run:async()=>{const o=await createObj('AtomicNote',q.trim());notice(`Crystal acquired: <b>${esc(o.title)}</b>!`);openObj(o.id)}});if(res.length)it.push({t:'Save this search as a Query',s:pad2(res.length)+' results, kept live',c:'#f4f6f8',run:()=>saveQuery(q)})}
    this.items=it;this.sel=clamp(this.sel,0,Math.max(0,it.length-1));this.paint()},
  objItem(o,q){const t=typeInfo(o.type);return{t:o.title,s:q?V.snippet(o,q):t.label+(o.date?' · '+dot(o):''),k:t.tag,c:t.c,run:()=>openObj(o.id)}},
  paint(){$('#pal-list').innerHTML=this.items.map((x,i)=>`<button type="button" class="prow${i===this.sel?' on':''}" data-i="${i}" role="option"><span class="dot" style="--c:${x.c||'#8fe6f0'}"></span><span class="pm"><span class="pt">${esc(x.t)}</span>${x.s?`<span class="ps">${esc(x.s)}</span>`:''}</span>${x.k?`<span class="pk micro">${esc(x.k)}</span>`:''}</button>`).join('')||'<p class="empty">Nothing found.</p>';const on=$('#pal-list .prow.on');if(on)on.scrollIntoView({block:'nearest'})},
  async run(i){const x=this.items[i];if(!x)return;const q=$('#pal-in').value;if(this.mode==='new'){x.run();return}if(this.mode==='title'){const r=await x.run();if(r==='keep')return;this.close(false);return}this.close(false);A.play('confirm');x.run(q)}};
$('#pal-in').addEventListener('input',()=>{PAL.sel=0;PAL.update()});
$('#pal-in').addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();PAL.sel=clamp(PAL.sel+(e.key==='ArrowDown'?1:-1),0,PAL.items.length-1);PAL.paint();A.play('cursor')}else if(e.key==='Enter'){e.preventDefault();PAL.run(PAL.sel)}else if(e.key==='Escape'){e.preventDefault();if(PAL.mode==='title'){PAL.open('','new');return}PAL.close()}});
$('#pal-list').addEventListener('click',e=>{const b=e.target.closest('.prow');if(b)PAL.run(+b.dataset.i)});
pal.addEventListener('mousedown',e=>{if(e.target===pal)PAL.close()});
async function saveQuery(q){q=String(q||'').replace(/^>.*$/,'').trim();const o=await createObj('Query',q?'Search: '+q.slice(0,50):'New query',{fields:{query:q}});notice(`Query saved: <b>${esc(o.title)}</b>. It stays live.`);openObj(o.id)}
async function trashObj(o){if(o.virtual)return;try{await S.flush();await B.write('_trash/'+o.path,V.text(o));await B.remove(o.path);V.objs.delete(o.id);V.reindex();CX.dirty=true;refreshCounts();RECENT=RECENT.filter(x=>x!==o.id);store.set('recent',RECENT);store.set('pins',store.get('pins',[]).filter(x=>x!==o.id));
  notice(`Moved <b>${esc(o.title)}</b> to the _trash folder in your vault.`,5000);A.play('back');go(lastList==='obj'?'party':lastList)}catch(e){notice('Could not move it: '+esc(e.message||e))}}

/* ===================== views + routing ===================== */
const NAMES={party:['Party','Party Status'],crystarium:['Crystarium','Development'],datalog:['Datalog','Records'],obj:['Entry','Datalog Entry']};
function applyView(v){view=v;body.dataset.view=v;$('#pane').classList.remove('open');
  ['party','crystarium','datalog','obj'].forEach(x=>{viewEl(x).hidden=x!==v});
  const isToday=v==='obj'&&E.o&&E.o.day===todayYmd();$$('[data-go]').forEach(b=>{const on=b.dataset.go===v||(isToday&&b.dataset.go==='today');if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  if(v==='obj'){const o=E.o;$('#screen-name').textContent=isToday?'Today':o?typeInfo(o.type).label:'Entry';$('#dev-name').textContent=o&&o.type==='DailyNote'?'Daily Log':'Datalog Entry'}else{$('#screen-name').textContent=NAMES[v][0];$('#dev-name').textContent=NAMES[v][1]}
  helpDefault=HELP[v];setHints(v);FX.amb=v==='crystarium';Mu.setMode(v==='crystarium'?'cryst':'menu');A.duck(v==='obj');
  if(v==='crystarium'){CX.show(true);CX.select(CX.sel,{quiet:true})}else CX.show(false);
  if(v==='party'){buildParty();drawParty();partySelect(Math.min(psel,PARTY.length-1),{quiet:true})}
  if(v==='datalog'){DL.buildTypes();DL.build();DL.select(DL.sel,{quiet:true})}
  if(v!=='obj')lastList=v;help();requestAnimationFrame(pointDefault)}
function exitAnim(v){const d=T(380);
  if(v==='party')$$('#cards .pc').forEach((c,i)=>c.animate([{transform:'none',opacity:1},{transform:`translate(${90+i*12}px,-120px) rotate(3deg)`,opacity:0}],{duration:d,delay:(c.classList.contains('on')?0:T(40)+i*T(25)),easing:'cubic-bezier(.5,0,.9,.4)',fill:'forwards'}));
  if(v==='crystarium'){CX.cv.animate([{opacity:1},{opacity:0}],{duration:d,fill:'forwards'});$('#card').animate([{transform:'none',opacity:1},{transform:'translateX(60px)',opacity:0}],{duration:d,easing:'ease-in',fill:'forwards'})}
  if(v==='datalog'||v==='obj')viewEl(v).animate([{transform:'none',opacity:1},{transform:'translateX(-50px)',opacity:0}],{duration:d,easing:'ease-in',fill:'forwards'})}
function enterAnim(v,{fog=false,dir=0}={}){if(RM())return;const el=viewEl(v);el.getAnimations().forEach(a=>a.cancel());
  if(v==='crystarium'&&fog){CX.dist=30;CX.cv.animate([{opacity:0},{opacity:1}],{duration:T(700),easing:'ease-out'});$('#card').animate([{transform:'translateX(50px)',opacity:0},{transform:'none',opacity:1}],{duration:T(420),delay:T(200),easing:QUICK,fill:'backwards'});return}
  if(dir)el.animate([{transform:`translateX(${48*dir}px)`,opacity:0},{transform:'none',opacity:1}],{duration:T(240),easing:QUICK});
  if(v==='party')$$('#cards .pc').forEach((c,i)=>c.animate([{transform:fog?'translateY(18px) scale(.97)':`translateX(${40*(dir||1)}px)`,opacity:0},{transform:'none',opacity:1}],{duration:T(fog?420:240),delay:i*T(fog?45:25),easing:QUICK,fill:'backwards'}));
  if(v==='datalog'){$$('#log-types .tro').slice(0,16).forEach((r,i)=>r.animate([{transform:'translateX(-30px)',opacity:0},{transform:'none',opacity:1}],{duration:T(240),delay:i*T(18),easing:QUICK,fill:'backwards'}));$$('#log-list .row').slice(0,16).forEach((r,i)=>r.animate([{transform:'translateX(-36px)',opacity:0},{transform:'none',opacity:1}],{duration:T(240),delay:T(60)+i*T(22),easing:QUICK,fill:'backwards'}));$('#pane').animate([{transform:'translateX(30px)',opacity:0},{transform:'none',opacity:1}],{duration:T(300),delay:T(80),easing:QUICK,fill:'backwards'})}
  if(v==='obj')$('#sheet').animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'none'}],{duration:T(300),easing:QUICK})}
async function through(swap,{exit,enter}={}){const fog=$('#fog');A.play('air');surge(T(1200));hand.classList.remove('v');if(exit)exit();fog.hidden=false;fog.getAnimations().forEach(a=>a.cancel());
  await fog.animate([{opacity:0,transform:'scale(1.12) translateX(5%)'},{opacity:1,transform:'scale(1) translateX(0)'}],{duration:T(400),easing:'ease-in',fill:'forwards'}).finished.catch(()=>{});
  swap();await wait(T(260));if(enter)enter();
  await fog.animate([{opacity:1,transform:'scale(1) translateX(0)'},{opacity:0,transform:'scale(.94) translateX(-5%)'}],{duration:T(560),easing:'ease-out',fill:'forwards'}).finished.catch(()=>{});
  fog.hidden=true;fog.getAnimations().forEach(a=>a.cancel());pointDefault();flushQ()}
const ORDER=['obj','party','datalog','crystarium'];
const NAVH={back:[],fwd:[],cur(){return location.hash.slice(1)||'today'},push(h){const c=this.cur();if(c!==h){this.back.push(c);if(this.back.length>60)this.back.shift();this.fwd=[]}history.pushState({},'','#'+h)},
  async step(d){const from=d<0?this.back:this.fwd,to=d<0?this.fwd:this.back;const h=from.pop();if(h==null){A.play('dull');return false}to.push(this.cur());history.replaceState({},'','#'+h);A.play('back');route(h,false);return true}};
const QQ=[];const flushQ=()=>{if(QQ.length&&!busy&&$('#fog').hidden){const q=QQ.shift();handleKey(q);setTimeout(flushQ,0)}};
async function go(v,{push=true}={}){if(v==='today'){openObj(dailyObj(todayYmd()).id,{push});return}if(view===v)return;if(busy){QQ.push({key:'__go',v});return}if(view==='title')return begin(v,{push});busy=true;if(push)NAVH.push(v);NAV.clear();
  const from=view;hand.classList.remove('v');if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();try{
    if(RM())applyView(v);
    else if(from==='crystarium'||v==='crystarium'||P.tempo==='cinematic'){viewEl(from).getAnimations().forEach(a=>a.cancel());await through(()=>{['party','crystarium','datalog','obj'].forEach(x=>viewEl(x).getAnimations().forEach(a=>a.cancel()));$('#card').getAnimations().forEach(a=>a.cancel());$$('#cards .pc').forEach(c=>c.getAnimations().forEach(a=>a.cancel()));applyView(v)},{exit:()=>exitAnim(from),enter:()=>enterAnim(v,{fog:true})})}
    else{const dir=ORDER.indexOf(v)>ORDER.indexOf(from)?1:-1;await viewEl(from).animate([{opacity:1,transform:'none'},{opacity:0,transform:`translateX(${-40*dir}px)`}],{duration:T(110),easing:'ease-in'}).finished.catch(()=>{});applyView(v);enterAnim(v,{dir})}
  }finally{busy=false;flushQ()}}
async function acquire(o0,col){A.play('acquire');if(view==='crystarium')CX.rush=true;hand.classList.remove('v');const b=document.createElement('div');b.className='beam';b.style.left=o0.x+'px';b.style.height=Math.max(40,o0.y)+'px';b.style.setProperty('--c',col);document.body.appendChild(b);
  b.animate([{transform:'scaleY(0)',opacity:0},{transform:'scaleY(1)',opacity:1}],{duration:T(300),easing:'ease-out',fill:'forwards'});FX.burst(o0.x,o0.y,26,col);app.animate([{filter:'brightness(1)'},{filter:'brightness(1.3)'}],{duration:T(460),fill:'forwards'});
  await wait(T(460));const w=$('#white');w.getAnimations().forEach(a=>a.cancel());w.style.opacity=1;b.remove();CX.rush=false;app.getAnimations().forEach(a=>a.cancel())}
let bootEdit=true;
async function openObj(id,{push=true,quiet=false,o0=null,cap=false,at=null,edit=false}={}){let o=getObj(id);if(!o){const m=String(id).match(/^DailyNotes\/(\d{4}-\d\d-\d\d)\.md$/);if(m)o=dailyObj(m[1])}if(!o){notice('That object no longer exists.');return}
  if(view==='title'){title.hidden=true;app.hidden=false;app.inert=false;title.inert=true;store.set('visited',true);countUp($('#h-count'),V.objs.size)}
  if(E.o&&E.o!==o&&E.o.dirty)S.flush();if(push)NAVH.push('o/'+encodeURIComponent(o.id));pushRecent(o);NAV.clear();
  const from=view,white=!!o0&&from==='crystarium'&&!RM();if(white)await acquire(o0,typeInfo(o.type).c);
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  E.o=o;renderSheet(o);applyView('obj');drawLogBg(o);objInfo(o);$('#v-obj').scrollTop=0;
  if(!quiet){A.play('confirm');if(!RM()&&!white)enterAnim('obj')}
  if(white){const w=$('#white');await wait(T(260));await w.animate([{opacity:1},{opacity:0}],{duration:T(700),easing:'ease-out',fill:'forwards'}).finished.catch(()=>{});w.getAnimations().forEach(a=>a.cancel());w.style.opacity=0}
  if(cap){stampEntry();return}
  if(bootEdit&&o.day===todayYmd())edit=true;bootEdit=false;
  if((o.virtual&&!o.day)||edit){const f=E.visible();const last=f[f.length-1];if(last&&!PHONE()){E.focus(E.node(last).id,null);return}}
  if(!PHONE())NAV.land(at||{})}
function route(h,push=false){if(h.startsWith('o/')){openObj(decodeURIComponent(h.slice(2)),{push,quiet:true});return}if(['party','datalog','crystarium'].includes(h)){if(view==='title')begin(h,{push});else go(h,{push});return}go('today',{push})}
addEventListener('popstate',()=>{const h=location.hash.slice(1);if(!settings.hidden)closeSettings();if(!pal.hidden)PAL.close(false);if(h==='title'||h===''){if(view!=='title')toTitle(false);return}if(view==='title'&&!V.objs.size)return;route(h,false)});

/* ===================== title, vault linking ===================== */
let vstate='none';
function updateVaultUI(){const chip=$('#vault-chip');chip.className='ht '+(B.kind==='fs'&&vstate==='ready'?'ok':B.kind==='mem'?'local':'err');$('#vault-name').textContent=B.name||'No vault';
  const tv=$('#t-vault'),line=$('#t-vline');tv.textContent=vstate==='perm'?'Resume vault':vstate==='ready'?'Switch vault':'Open vault';$('#t-begin').disabled=vstate!=='ready'&&!window.showDirectoryPicker&&false;
  line.innerHTML=vstate==='ready'?`Vault <b>${esc(B.name)}</b> · ${V.objs.size} objects${B.kind==='mem'?' · edits kept in this browser':''}`:vstate==='perm'?`Vault <b>${esc(B.name)}</b> · press Begin to reconnect`:'Pick your notes folder to begin (the one with DailyNotes, AtomicNotes…)'}
async function loadVault({quiet=false}={}){const files=await B.list();V.load(files);VIRT.clear();CX.dirty=true;vstate='ready';refreshCounts();updateVaultUI();if(!quiet)notice(`Vault linked: <b>${esc(B.name)}</b> · ${V.objs.size} objects`);lastScan=Date.now()}
async function linkVault(fresh){try{if(!window.showDirectoryPicker){$('#dirpick').click();return false}if(await B.request(fresh)){await loadVault();if(view!=='title'){CX.dirty=true;route(location.hash.slice(1)||'today')}return true}}catch(e){if(e&&e.name!=='AbortError')notice('Could not open the folder: '+esc(e.message||e))}return false}
$('#dirpick').addEventListener('change',async e=>{const fs=[...e.target.files].filter(f=>/\.md$/i.test(f.name)&&!/(^|\/)(_|\.)/.test(f.webkitRelativePath.split('/').slice(1).join('/')));if(!fs.length)return;const rootName=fs[0].webkitRelativePath.split('/')[0];
  const arr=await Promise.all(fs.map(async f=>({path:f.webkitRelativePath.split('/').slice(1).join('/'),text:await f.text(),mtime:f.lastModified})));B.useMemory(arr,rootName);await loadVault();notice('This browser can’t write to folders, so edits are kept here in the browser.',6000);if(view==='title')begin('today')});
let lastScan=0;
async function rescan(loud){if(vstate!=='ready'||B.kind!=='fs')return;lastScan=Date.now();let files;try{files=await B.list()}catch(e){return}const seen=new Set();let ch=0;
  for(const f of files){seen.add(f.path);const o=V.objs.get(f.path);if(!o){V.add(f.path,f.text,f.mtime);ch++;continue}if(f.text!==o.disk&&!o.dirty&&!(E.o===o&&editing())){V.parse(o,f.text);o.disk=f.text;o.mtime=f.mtime;ch++;if(E.o===o&&view==='obj'){renderSheet(o);NAV.refresh()}}else if(f.text===o.disk)o.mtime=f.mtime}
  for(const o of[...V.objs.values()])if(!seen.has(o.path)&&!o.dirty){V.objs.delete(o.id);ch++}
  if(ch){V.reindex();CX.dirty=true;refreshCounts();if(view==='datalog'){DL.buildTypes();DL.build()}}if(loud)notice(ch?`Rescanned: ${ch} change${ch>1?'s':''} picked up from disk.`:'Rescanned: everything is up to date.',2600)}
addEventListener('focus',()=>{if(Date.now()-lastScan>8000)rescan(false)});
$('#vault-chip').addEventListener('click',()=>{if(vstate==='ready'&&B.kind==='fs')rescan(true);else linkVault(false)});
async function showTitle({full=false}={}){view='title';body.dataset.view='title';title.hidden=false;title.inert=false;app.inert=true;CX.show(false);FX.amb=false;Mu.setMode('menu');updateVaultUI();
  const blk=$('.t-black'),h1=$('.t-word h1'),sig=$('.sigil'),rule=$('.t-rule'),fl=$('.t-flare'),late=[$('.t-word .micro'),$('.t-copy'),$('.t-vault'),...$$('.t-menu button')];
  title.getAnimations({subtree:true}).forEach(a=>a.cancel());[sig,rule,...late].forEach(e=>e.style.opacity='');blk.style.opacity=0;title.classList.remove('dark');
  if(full&&!RM()){title.classList.add('dark');blk.style.opacity=1;[sig,rule,...late].forEach(e=>e.style.opacity=0);
    await wait(250);const hb=h1.getBoundingClientRect();fl.style.top=(hb.top+hb.height*.5)+'px';
    h1.animate([{clipPath:'inset(-30% 100% -30% -2%)'},{clipPath:'inset(-30% -2% -30% -2%)'}],{duration:T(1400),easing:'cubic-bezier(.45,0,.55,1)',fill:'both'});
    fl.animate([{transform:`translateX(${hb.left}px)`,opacity:0},{opacity:1,offset:.12},{opacity:1,offset:.85},{transform:`translateX(${hb.right}px)`,opacity:0}],{duration:T(1500),easing:'cubic-bezier(.45,0,.55,1)'});
    await wait(T(1500));title.classList.remove('dark');blk.animate([{opacity:1},{opacity:0}],{duration:T(1200),easing:'ease-in-out',fill:'forwards'});
    await wait(T(700));sig.style.opacity='';sig.animate([{opacity:0,filter:'blur(18px) saturate(.2) brightness(1.4)',clipPath:'circle(6% at 52% 42%)'},{opacity:1,filter:'blur(0px) saturate(1) brightness(1)',clipPath:'circle(85% at 52% 42%)'}],{duration:T(1300),easing:'ease-out',fill:'both'});
    rule.style.opacity='';rule.animate([{opacity:0,transform:'scaleX(.15)'},{opacity:1,transform:'none'}],{duration:T(900),easing:EASE,fill:'both'});
    await wait(T(1100));late.forEach((e,i)=>{e.style.opacity='';e.animate([{opacity:0},{opacity:1}],{duration:T(600),delay:i*T(60),fill:'both'})});await wait(T(400))}
  else if(!RM())title.animate([{opacity:0},{opacity:1}],{duration:T(500)});
  $('#t-begin').focus({preventScroll:true});pointDefault()}
async function begin(v='today',{push=true}={}){A.init();if(vstate!=='ready'){const ok=await linkVault(false);if(!ok||vstate!=='ready')return}A.play('confirm');hand.classList.remove('v');
  app.hidden=false;app.inert=false;title.inert=true;app.getAnimations().forEach(a=>a.cancel());store.set('visited',true);
  if(v==='today'||v.startsWith('o/'))route(v==='today'?'today':v,push);else{if(push)NAVH.push(v);applyView(v)}
  if(!RM()){surge(T(900));title.animate([{opacity:1},{opacity:0}],{duration:T(730),easing:'ease-in-out',fill:'forwards'});app.animate([{opacity:0},{opacity:1}],{duration:T(730),easing:'ease-in-out'});
    $$('#menu .mi').forEach((m,i)=>m.animate([{transform:'translateX(-48px)',opacity:0},{transform:'none',opacity:1}],{duration:T(333),delay:T(260)+i*T(40),easing:QUICK,fill:'backwards'}));
    $('.band').animate([{transform:'translateY(100%)'},{transform:'none'}],{duration:T(400),delay:T(200),easing:QUICK,fill:'backwards'});await wait(T(730))}
  title.hidden=true;title.getAnimations({subtree:true}).forEach(a=>a.cancel());countUp($('#h-count'),V.objs.size);CX.center();pointDefault()}
async function toTitle(push=true){await S.flush();if(push)history.pushState({},'','#title');A.play('back');if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  if(!RM())await app.animate([{opacity:1,filter:'grayscale(0) blur(0)'},{opacity:0,filter:'grayscale(1) blur(6px)'}],{duration:T(600),easing:'ease-in',fill:'forwards'}).finished.catch(()=>{});
  app.hidden=true;app.getAnimations().forEach(a=>a.cancel());showTitle()}

/* ===================== settings ===================== */
function setWorld(w){if(P.world===w)return;P.world=w;store.set('world',w);A.play('shimmer');
  const apply=()=>{root.dataset.world=w;ART.clear();FX.sp={};CX.spr={};if(view==='crystarium')CX.card();if(view==='party')drawParty();if(view==='datalog')drawLogBg(DL.rows[DL.sel]);if(view==='obj')drawLogBg(E.o)};
  if(RM())apply();else through(apply);updateSettingsUI()}
function setSound(on){P.sound=on;store.set('sound',on);if(on)A.init();A.setSound(on);const s=$('#snd');s.classList.toggle('off',!on);s.setAttribute('aria-pressed',on);updateSettingsUI();if(on)A.play('confirm')}
function setMusic(on){P.music=on;store.set('music',on);if(on){A.init();Mu.start()}Mu.level();updateSettingsUI()}
function setMotion(m){P.motion=m;store.set('motion',m);root.dataset.motion=m;setXF();setupClouds();updateSettingsUI()}
function setTempo(t){P.tempo=t;store.set('tempo',t);setXF();updateSettingsUI()}
const SET=[{k:'world',label:'World',vals:['pearl','pulse'],names:['Pearl','Pulse'],desc:'Pearl is the silver world above the clouds. Pulse is the wild world at night.'},
  {k:'tempo',label:'Tempo',vals:['game','cinematic'],names:['Game','Cinematic'],desc:'Game uses the menu speeds measured from the game. Cinematic slows everything and sends every move through the clouds.'},
  {k:'sound',label:'Sound',vals:[true,false],names:['On','Off'],desc:'All audio: cursor ticks, chimes, crystal acquisition and the music. [M]'},
  {k:'music',label:'Music',vals:[true,false],names:['On','Off'],desc:'A light piano and strings loop for the menus. It fades out while you write.'},
  {k:'motion',label:'Motion',vals:['full','reduced'],names:['Full','Reduced'],desc:'Reduced removes the clouds, particles and light, and uses short fades.'}];
function buildSettings(){$('#s-rows').innerHTML=SET.map((s,i)=>`<div class="s-row" tabindex="0" data-i="${i}" data-desc="${esc(s.desc)}"><span>${s.label}</span><button type="button" class="s-l" tabindex="-1" aria-label="Previous ${s.label}">◂</button><b></b><button type="button" class="s-r" tabindex="-1" aria-label="Next ${s.label}">▸</button></div>`).join('');updateSettingsUI()}
function updateSettingsUI(){$$('#s-rows .s-row').forEach(row=>{const s=SET[+row.dataset.i];row.querySelector('b').textContent=s.names[s.vals.indexOf(P[s.k])]})}
function cycle(i,d){const s=SET[i],v=s.vals[(s.vals.indexOf(P[s.k])+d+s.vals.length)%s.vals.length];A.play('cursor');({world:setWorld,tempo:setTempo,sound:setSound,music:setMusic,motion:setMotion})[s.k](v)}
let prevFocus=null;
function openSettings(){if(!settings.hidden)return;prevFocus=document.activeElement;settings.hidden=false;app.inert=true;title.inert=true;A.play('confirm');if(!RM())$('.s-panel').animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:T(240),easing:QUICK});
  const first=$('#s-rows .s-row');first.focus({preventScroll:true});$('#s-desc').textContent=first.dataset.desc;setTimeout(pointDefault,T(120))}
function closeSettings(){if(settings.hidden)return;A.play('back');settings.hidden=true;if(view==='title')title.inert=false;else app.inert=false;if(prevFocus&&prevFocus.focus)prevFocus.focus({preventScroll:true});pointDefault()}

/* ===================== events ===================== */
const HOV='.mi,.row,.tro,.pc,.t-menu button,.s-row,#s-close';
document.addEventListener('pointerover',e=>{const h=e.target.closest('[data-help]');if(h&&(!app.inert||!pal.hidden))help(h.dataset.help);const t=e.target.closest(HOV);if(t&&t!==handEl&&!t.disabled){if(!t.matches('.pc'))pointAt(t);A.play('cursor')}const s=e.target.closest('.s-row');if(s)$('#s-desc').textContent=s.dataset.desc});
document.addEventListener('pointerout',e=>{if(e.target.closest('#menu,#log-list,#log-types,.t-menu')&&!(e.relatedTarget&&e.relatedTarget.closest&&e.relatedTarget.closest('.mi,.row,.tro,.t-menu button'))){clearTimeout(pTimer);pTimer=setTimeout(()=>{if(!handEl||!handEl.matches(':hover'))pointDefault()},200)}});
document.addEventListener('focusin',e=>{const h=e.target.closest('[data-help]');if(h&&!app.inert)help(h.dataset.help);const t=e.target.closest('.mi,.row,.t-menu button,.s-row,#s-close');if(t)pointAt(t);const s=e.target.closest('.s-row');if(s)$('#s-desc').textContent=s.dataset.desc});
$('#t-begin').addEventListener('click',()=>begin('today'));
$('#t-vault').addEventListener('click',async()=>{A.init();A.play('confirm');if(await linkVault(vstate==='ready'))begin('today')});
$('#t-set').addEventListener('click',()=>{A.init();openSettings()});
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.go==='today'){openObj(dailyObj(todayYmd()).id,{edit:true});return}if(b.dataset.go===view){A.play('dull');return}A.play('confirm');go(b.dataset.go)}));
$$('[data-act=settings]').forEach(b=>b.addEventListener('click',openSettings));
$$('[data-act=title]').forEach(b=>b.addEventListener('click',()=>toTitle()));
$$('[data-act=search]').forEach(b=>b.addEventListener('click',()=>PAL.open()));
$$('[data-act=new]').forEach(b=>b.addEventListener('click',()=>PAL.open('','new')));
$('#snd').addEventListener('click',()=>setSound(!P.sound));
$('#cards').addEventListener('click',e=>{const b=e.target.closest('.pc');if(!b)return;const i=+b.dataset.i;if(i===psel){const bb=b.getBoundingClientRect();openObj(PARTY[i].id,{o0:{x:bb.left+bb.width/2,y:bb.top+bb.height*.6}})}else partySelect(i)});
$('#s-close').addEventListener('click',closeSettings);
settings.addEventListener('click',e=>{if(e.target===settings){closeSettings();return}const row=e.target.closest('.s-row');if(!row)return;cycle(+row.dataset.i,e.target.closest('.s-l')?-1:1)});
/* keyboard: see nav.js */
let rz=0;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{CX.resize();FX.resize();setupClouds();if(view==='crystarium')CX.card();if(view==='party')drawParty();pointDefault()},120)});
let play=store.get('play',0);const fmt=s=>`${String(Math.floor(s/3600)).padStart(3,'0')}:${pad2(Math.floor(s/60)%60)}:${pad2(s%60)}`;
$('#h-play').textContent=fmt(play);setInterval(()=>{if(document.hidden)return;play++;$('#h-play').textContent=fmt(play);if(play%5===0)store.set('play',play)},1000);

/* ===================== boot ===================== */
V.boost=o=>{const r=RECENT.indexOf(o.id);return r<0?0:r<5?4:2};
(async()=>{if(window.JP_TEST_FILES)window.__JP={V,B,E,S,PAL,CX,DL,NAV,HINT,RING,NAVH};buildSettings();bindSheet();CX.init();FX.init();setupClouds();$('#snd').classList.toggle('off',!P.sound);$('#snd').setAttribute('aria-pressed',P.sound);
  let last=performance.now();const loop=now=>{const dt=Math.min(.05,(now-last)/1000);last=now;if(!document.hidden){const t=now/1000;FX.frame(dt,t);if(CX.running)CX.frame(dt,t)}requestAnimationFrame(loop)};requestAnimationFrame(loop);
  vstate=await B.restore();if(vstate==='ready'){try{await loadVault({quiet:true})}catch(e){vstate='perm';console.warn(e)}}updateVaultUI();
  const h0=location.hash.slice(1);if(vstate==='ready'&&store.get('visited',false)&&h0!=='title'){title.hidden=true;app.hidden=false;app.inert=false;route(h0||'today',false);countUp($('#h-count'),V.objs.size);setTimeout(()=>{CX.center();pointDefault()},60)}
  else showTitle({full:!store.get('visited',false)})})();
