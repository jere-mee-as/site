import os
S='src/'
r=lambda f:open(S+f,encoding='utf-8').read()
vault=r('vault.js').replace("if(typeof module!=='undefined')module.exports","if(false)module.exports")
head='''<!doctype html>
<html lang="en" data-world="pearl" data-motion="full">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Jere's Place</title>
<meta name="description" content="A second brain in the style of the Crystarium: typed objects, an outliner and daily notes, stored as plain Markdown in your own folder.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Saira:ital,wdth,wght@0,50..125,100..900;1,50..125,100..900&display=swap" rel="stylesheet">
<script>try{var w=JSON.parse(localStorage.getItem('jp1.world'));if(w)document.documentElement.dataset.world=w;var m=JSON.parse(localStorage.getItem('jp1.motion'));if(m)document.documentElement.dataset.motion=m}catch(e){}</script>
<style>
'''
out=head+r('base.css')+'\n'+r('app.css')+'\n</style>\n</head>\n'+r('shell.html')+'\n<script>\n(()=>{\'use strict\';\n'+vault+'\n'+r('app1.js')+'\n'+r('audio.js')+'\n'+r('fx.js')+'\n'+r('app2.js').split('/* ===================== boot')[0]+'\n'+r('nav.js')+'\n'+r('native.js')+'\n/* ===================== boot'+r('app2.js').split('/* ===================== boot')[1]+'\n})();\n</script>\n</body>\n</html>\n'
os.makedirs('dist',exist_ok=True)
open("dist/Jere's Place.html",'w',encoding='utf-8').write(out)
print(len(out))
