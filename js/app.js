(function(){
'use strict';
var C=window.COMICS||[];
var $=function(s,r){return (r||document).querySelector(s)};
var store={get:function(k,d){try{var v=localStorage.getItem('cr_'+k);return v?JSON.parse(v):d}catch(e){return d}},
 set:function(k,v){try{localStorage.setItem('cr_'+k,JSON.stringify(v))}catch(e){}}};
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

/* theme (all pages) */
var themes=['light','dark','sepia'];
function applyTheme(t){document.documentElement.setAttribute('data-theme',t);var b=$('#themeBtn');if(b)b.textContent='Theme: '+t}
var theme=store.get('theme',window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
applyTheme(theme);
var tb=$('#themeBtn');if(tb)tb.addEventListener('click',function(){theme=themes[(themes.indexOf(theme)+1)%themes.length];store.set('theme',theme);applyTheme(theme)});
var y=$('#year');if(y)y.textContent=new Date().getFullYear();

function pct(c){var p=store.get('progress',{})[c.id];return p==null?0:Math.round((p+1)/c.pages.length*100)}

/* home */
function initHome(){
 var grid=$('#grid'),q=$('#q'),g=$('#genre'),s=$('#sort'),f=$('#favOnly');
 var genres=[];C.forEach(function(c){if(genres.indexOf(c.genre)<0)genres.push(c.genre)});
 genres.forEach(function(x){g.insertAdjacentHTML('beforeend','<option>'+esc(x)+'</option>')});
 function draw(){
  var favs=store.get('favs',[]),term=q.value.trim().toLowerCase();
  var list=C.filter(function(c){
   return (!term||(c.title+' '+c.description+' '+c.genre).toLowerCase().indexOf(term)>-1)&&(g.value==='all'||c.genre===g.value)&&(!f.checked||favs.indexOf(c.id)>-1)});
  if(s.value==='az')list.sort(function(a,b){return a.title.localeCompare(b.title)});
  if(s.value==='short')list.sort(function(a,b){return a.pages.length-b.pages.length});
  $('#count').textContent=list.length+' comic'+(list.length===1?'':'s')+' found';
  if(!list.length){grid.innerHTML='<li class="empty">No comics match. Try a different word or clear the filters.</li>';return}
  grid.innerHTML=list.map(function(c){
   var on=favs.indexOf(c.id)>-1,p=pct(c);
   return '<li class="card"><div class="cover" style="background:linear-gradient(135deg,'+c.pages[0].bg[0]+','+c.pages[0].bg[1]+')" aria-hidden="true">'+c.pages[0].art+'</div>'+
   '<button class="fav" data-id="'+c.id+'" aria-pressed="'+on+'" aria-label="'+(on?'Remove from':'Add to')+' favourites: '+esc(c.title)+'">'+(on?'♥':'♡')+'</button>'+
   '<div class="body"><span class="tag">'+esc(c.genre)+'</span><h3>'+esc(c.title)+'</h3><p>'+esc(c.description)+'</p>'+
   '<div class="meta">'+c.pages.length+' pages, by '+esc(c.author)+'</div>'+
   (p?'<div class="progress-line" title="'+p+'% read"><i style="width:'+p+'%"></i></div>':'')+
   '<a class="btn primary" href="reader.html?comic='+c.id+'">'+(p&&p<100?'Continue reading':p===100?'Read again':'Read now')+'</a></div></li>'}).join('');
 }
 [q,g,s,f].forEach(function(el){el.addEventListener('input',draw)});
 grid.addEventListener('click',function(e){var b=e.target.closest('.fav');if(!b)return;
  var favs=store.get('favs',[]),i=favs.indexOf(b.dataset.id);i>-1?favs.splice(i,1):favs.push(b.dataset.id);store.set('favs',favs);draw()});
 draw();
 /* continue reading banner */
 var last=store.get('last',null),c=C.filter(function(x){return x.id===last})[0];
 if(c&&pct(c)<100){var box=$('#continue');box.hidden=false;box.innerHTML='<h2>Pick up where you left off</h2><p><strong>'+esc(c.title)+'</strong> ('+pct(c)+'% read)</p><a class="btn primary" href="reader.html?comic='+c.id+'">Continue reading</a>'}
}

/* reader */
function initReader(){
 var params=new URLSearchParams(location.search),id=params.get('comic'),c=C.filter(function(x){return x.id===id})[0];
 var host=$('#pages');
 if(!c){host.innerHTML='<p class="empty">We could not find that comic. <a href="index.html">Go back to the library</a> and choose one.</p>';$('#tools').hidden=true;return}
 document.title=c.title+' | Read free online | Comic Readers';
 var md=$('meta[name=description]');if(md)md.content='Read "'+c.title+'", a free '+c.genre.toLowerCase()+' comic, online at Comic Readers.';
 $('#title').textContent=c.title;$('#sub').textContent=c.genre+' comic by '+c.author+', '+c.pages.length+' pages';
 var st={size:store.get('size',20),font:store.get('font','sans'),lh:store.get('lh',1.7),mode:store.get('mode','page'),
  page:Math.max(0,Math.min(c.pages.length-1,params.get('page')!=null?(+params.get('page')-1||0):(store.get('progress',{})[c.id]||0)))};
 var fonts={sans:"'Nunito','Segoe UI',Arial,sans-serif",serif:"'Lora',Georgia,serif",mono:"'Courier New',monospace",easy:"Verdana,Tahoma,sans-serif"};
 var size=$('#size'),val=$('#sizeVal'),speaking=false;
 function svg(p,i){return '<svg viewBox="0 0 400 260" role="img" aria-label="'+esc(p.alt)+'"><defs><linearGradient id="g'+i+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+p.bg[0]+'"/><stop offset="1" stop-color="'+p.bg[1]+'"/></linearGradient></defs><rect width="400" height="260" fill="url(#g'+i+')"/><circle cx="60" cy="50" r="30" fill="rgba(255,255,255,.25)"/><circle cx="350" cy="210" r="46" fill="rgba(255,255,255,.2)"/><text x="200" y="165" font-size="100" text-anchor="middle">'+p.art+'</text></svg>'}
 function pageHTML(i){var p=c.pages[i];return '<article class="page"><figure style="margin:0">'+svg(p,i)+'</figure><div class="txt"><p class="narr">'+esc(p.narr)+'</p><p class="bubble">'+esc(p.say)+'</p></div></article>'}
 function applyStyle(){var r=document.documentElement.style;r.setProperty('--rs',st.size+'px');r.setProperty('--lh',st.lh);r.setProperty('--rf',fonts[st.font]);
  size.value=st.size;val.textContent=st.size+'px';$('#font').value=st.font;$('#lh').value=st.lh;$('#mode').value=st.mode;
  ['size','font','lh','mode'].forEach(function(k){store.set(k,st[k])})}
 function render(){
  stopSpeak();
  var n=c.pages.length;
  if(st.mode==='scroll'){host.innerHTML=c.pages.map(function(_,i){return pageHTML(i)}).join('');$('#pager').hidden=true;$('#prog').style.width='100%'}
  else{host.innerHTML=pageHTML(st.page);$('#pager').hidden=false;$('#cnt').textContent='Page '+(st.page+1)+' of '+n;
   $('#prev').disabled=st.page===0;$('#next').disabled=st.page===n-1;$('#prog').style.width=((st.page+1)/n*100)+'%'}
  var pr=store.get('progress',{});pr[c.id]=st.mode==='scroll'?n-1:st.page;store.set('progress',pr);store.set('last',c.id);
  try{history.replaceState(null,'','?comic='+c.id+'&page='+(st.page+1))}catch(e){}
  $('#done').hidden=!(st.mode==='scroll'||st.page===n-1);
 }
 function go(d){var n=st.page+d;if(n<0||n>=c.pages.length)return;st.page=n;render();window.scrollTo({top:$('#pages').offsetTop-140})}
 function setSize(v){st.size=Math.max(12,Math.min(48,v));applyStyle()}
 size.addEventListener('input',function(){setSize(+size.value)});
 $('#minus').addEventListener('click',function(){setSize(st.size-2)});
 $('#plus').addEventListener('click',function(){setSize(st.size+2)});
 $('#reset').addEventListener('click',function(){setSize(20)});
 $('#font').addEventListener('change',function(e){st.font=e.target.value;applyStyle()});
 $('#lh').addEventListener('change',function(e){st.lh=+e.target.value;applyStyle()});
 $('#mode').addEventListener('change',function(e){st.mode=e.target.value;applyStyle();render()});
 $('#prev').addEventListener('click',function(){go(-1)});$('#next').addEventListener('click',function(){go(1)});
 var fb=$('#favBtn');function favDraw(){var on=store.get('favs',[]).indexOf(c.id)>-1;fb.textContent=on?'♥ Saved':'♡ Save';fb.setAttribute('aria-pressed',on)}
 fb.addEventListener('click',function(){var f=store.get('favs',[]),i=f.indexOf(c.id);i>-1?f.splice(i,1):f.push(c.id);store.set('favs',f);favDraw()});favDraw();
 $('#full').addEventListener('click',function(){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen()});
 function stopSpeak(){if('speechSynthesis' in window)speechSynthesis.cancel();speaking=false;$('#speak').textContent='Read aloud'}
 $('#speak').addEventListener('click',function(){
  if(!('speechSynthesis' in window)){alert('Read aloud is not supported in this browser.');return}
  if(speaking){stopSpeak();return}
  var p=c.pages[st.mode==='scroll'?0:st.page];speechSynthesis.speak(new SpeechSynthesisUtterance(p.narr+' '+p.say));speaking=true;$('#speak').textContent='Stop reading'});
 $('#share').addEventListener('click',function(){var u=location.href;if(navigator.share){navigator.share({title:c.title,url:u}).catch(function(){})}else if(navigator.clipboard){navigator.clipboard.writeText(u).then(function(){$('#share').textContent='Link copied'})}});
 document.addEventListener('keydown',function(e){if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if(e.key==='ArrowRight')go(1);else if(e.key==='ArrowLeft')go(-1);else if(e.key==='+'||e.key==='=')setSize(st.size+2);else if(e.key==='-')setSize(st.size-2)});
 /* next comic suggestion */
 var idx=C.indexOf(c),nx=C[(idx+1)%C.length];$('#nextComic').innerHTML='Next comic: <a href="reader.html?comic='+nx.id+'"><strong>'+esc(nx.title)+'</strong></a>';
 applyStyle();render();
}
var page=document.body.getAttribute('data-page');
if(page==='home')initHome();else if(page==='reader')initReader();
})();
