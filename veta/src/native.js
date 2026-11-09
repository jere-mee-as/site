/* ===================== desktop app (Electron) =====================
   When the page runs inside the Veta desktop app, files go through window.jpNative (real disk access,
   folder chosen once and remembered). In a browser this whole block is skipped. */
const NATIVE={on:!!window.jpNative,info:null};
if(window.jpNative){const N=window.jpNative;
  Object.assign(B,{nat:true,
    async restore(){try{const i=await N.info();if(i&&i.path){this.kind='fs';this.name=i.name;NATIVE.info=i;return'ready'}}catch(e){}return'none'},
    async request(){const i=await N.pick();if(!i)return false;this.kind='fs';this.name=i.name;this.blobs.clear();NATIVE.info=i;return true},
    list(){return N.list()},stat(p){return N.stat(p)},read(p){return N.read(p)},write(p,t){return N.write(p,t)},remove(p){return N.remove(p)},
    async media(vp){if(this.blobs.has(vp))return this.blobs.get(vp);try{const u=await N.fileUrl(vp);this.blobs.set(vp,u);return u}catch(e){return encPath(vp)}}});
  window.__jpFlush=()=>S.flush();
  body.classList.add('native');
  /* the global hotkey: window comes forward and today opens with a fresh time stamp */
  N.onCapture(()=>{if(view==='title'||vstate!=='ready'){notice('Open your vault first, then the capture hotkey works from anywhere.');return}
    HINT.stop();RING.close(true);if(!pal.hidden)PAL.close();if(!settings.hidden)closeSettings();if(!$('#lightbox').hidden)$('#lightbox').hidden=true;
    if(editing()&&E.o&&E.o.day===todayYmd())document.activeElement.blur();capture()});
  N.onNotice(m=>notice(m,9000));
  /* Esc while an embedded PDF has focus: hand the keyboard back to the app */
  if(N.onEsc)N.onEsc(()=>{const ae=document.activeElement;if(ae&&ae.tagName==='IFRAME'){ae.blur();window.focus();if(view==='obj')NAV.land({});A.play('back')}})}
