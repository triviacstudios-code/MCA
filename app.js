
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COL=['#ef4444','#3b82f6','#10b981','#f59e0b','#a855f7','#ec4899','#14b8a6','#f97316'];
const BASE=[10,20,40,60,100],MINB=10;
let S=null,ref=null,assets=null,isAdmin=false,canWrite=true,tab='pending',prev=null,busy=false;
let CODES={},stateRef=null,fdb=null,fauth=null,Q=Promise.resolve(),pendingFin=false,adminLoaded=false;
let me=null;try{me=JSON.parse(localStorage.getItem('cap')||'null')}catch(e){}
const inc=b=>b<100?5:b<300?10:b<600?20:25;
const L=n=>'₹'+n;
const stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
const tm=id=>S.teams.find(t=>t.id===id);
const pl=id=>S.players.find(p=>p.id===id);
const owned=id=>S.players.filter(p=>p.team===id);
const ini=n=>n.split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
const badge=(t,c)=>{if(!t)return'';const src=t.logo||'logos/'+slug(t.name)+'.png';return`<span class="badge ${c||''}" style="--bc:${t.color}"><span class="ini">${esc(ini(t.name))}</span><img src="${esc(src)}" alt="" ${t.logo?'':'data-x="png,jpg,jpeg,svg,webp" data-n="0"'} onload="this.parentNode.classList.add('logo')" onerror="imgFb(this)"></span>`};
const av=(p,s)=>{const auto='photos/'+slug(p.name)+'.jpg';return`<div class="av ${s?'s':''}">${esc(ini(p.name))}<img src="${esc(p.photo||auto)}" alt="" ${p.photo?`data-alt="${auto}"`:'data-x="jpg,png,jpeg,webp" data-n="0"'} onerror="imgFb(this)"></div>`};
function toast(m){const t=$('toast');t.textContent=m;t.style.display='block';clearTimeout(t._h);t._h=setTimeout(()=>t.style.display='none',2600)}
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function drive(u){u=(u||'').trim();if(!u)return'';const m=u.match(/[?&]id=([\w-]+)|\/d\/([\w-]+)/);if(/drive\.google\.com/.test(u)&&m)return'https://drive.google.com/thumbnail?id='+(m[1]||m[2])+'&sz=w600';return /^(https?:|photos\/|logos\/)/.test(u)?u:''}
function imgFb(i){if(i.dataset.alt){const a=i.dataset.alt;delete i.dataset.alt;i.dataset.n='0';i.dataset.x='jpg,png,jpeg,webp';i.src=a;return}const x=(i.dataset.x||'').split(',').filter(Boolean),n=+i.dataset.n||0;if(n+1<x.length){i.dataset.n=n+1;i.src=i.src.replace(/\.[a-z0-9]+$/,'.'+x[n+1])}else i.remove()}
function norm(v){if(!v)return null;v.teams=v.teams||[];v.players=v.players||[];v.log=v.log||[];v.cur=v.cur||null;v.cfg=v.cfg||{budget:1000,secs:30};return v}
function blank(){return{teams:[],players:[],cur:null,log:[],cfg:{budget:1000,min:2,secs:30}}}
function maxBid(t){return Math.max(0,t.budget)}
function nextMin(){const c=S.cur;return c.by?c.bid+inc(c.bid):c.bid}
function lvl(v){v=String(v||'').trim();const n=parseFloat(v);if(!isNaN(n))return Math.max(1,Math.min(5,n>5?Math.ceil(n/2):Math.round(n)));
 if(/beg|novice|low/i.test(v))return 1;if(/inter|medium|avg|average/i.test(v))return 3;if(/adv|good|high/i.test(v))return 4;if(/exp|pro|elite|top/i.test(v))return 5;return 2}
function csv(t){const rows=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch=='"'&&t[i+1]=='"'){c+='"';i++}else if(ch=='"')q=false;else c+=ch}
 else if(ch=='"')q=true;else if(ch==','||ch=='\t'){r.push(c);c=''}else if(ch=='\n'||ch=='\r'){if(ch=='\r'&&t[i+1]=='\n')i++;r.push(c);c='';if(r.some(x=>x.trim()))rows.push(r);r=[]}else c+=ch}
 r.push(c);if(r.some(x=>x.trim()))rows.push(r);return rows}
function parsePlayers(t){const rows=csv(t);if(!rows.length)return[];const h=rows[0].map(x=>x.toLowerCase());
 const f=re=>h.findIndex(x=>re.test(x));let ni=f(/name/),li=f(/expert|level|skill|rating|rank/),pi=f(/photo|image|picture|pic/);
 if(ni<0)ni=0;if(li<0)li=h.length>1?1:-1;const data=rows.slice(1);
 return data.map((r,i)=>{const l=lvl(li>=0?r[li]:2);return{id:'p'+Date.now().toString(36)+i,name:(r[ni]||'').trim(),level:l,base:BASE[l-1],photo:drive(pi>=0?r[pi]:''),status:'pending'}}).filter(p=>p.name)}
const DEMO=`Name,Expertise Level
Arjun Mehta,Expert
Rohan Iyer,Advanced
Karan Shah,Expert
Vikram Rao,Intermediate
Aditya Nair,Advanced
Siddharth Jain,Beginner
Imran Khan,Expert
Neil D'Souza,Intermediate
Rahul Verma,Advanced
Pranav Kulkarni,Intermediate
Dev Patel,Beginner
Manav Singh,Advanced
Yash Gupta,Intermediate
Faisal Sheikh,Expert
Tanmay Joshi,Beginner
Harsh Desai,Advanced`;

function mut(fn){Q=Q.then(async()=>{busy=true;try{const s=await stateRef.get();let d=s.exists()?norm(s.val()):blank();if(fn(d)!==false)await stateRef.set(JSON.parse(JSON.stringify(d)))}catch(e){toast('Action failed: '+(e.message||e.code))}busy=false});return Q}
const logit=(d,m)=>{d.log.unshift({t:Date.now(),m});d.log=d.log.slice(0,40)};
const T=(d,id)=>d.teams.find(t=>t.id===id),P=(d,id)=>d.players.find(p=>p.id===id);

function setup(names,txt,budget,squad,secs){const codes={};return mut(d=>{d.cfg={budget,min:squad,secs};d.teams=names.map((n,i)=>{const id='t'+i;codes[id]=String(1000+Math.floor(Math.random()*9000));return{id,name:n,color:COL[i%COL.length],budget}});
 d.players=parsePlayers(txt);d.cur=null;d.log=[];logit(d,`Auction set up: ${d.teams.length} teams, ${d.players.length} players`)}).then(()=>fdb.ref('secrets/codes').set(codes)).then(()=>fdb.ref('results').remove()).catch(e=>toast('Setup failed: '+(e.message||e.code)))}
function startP(pid){mut(d=>{if(d.cur)return false;const p=P(d,pid);if(!p||p.status!=='pending')return false;d.cur={pid,bid:p.base,by:null,ends:Date.now()+d.cfg.secs*1000,n:0};logit(d,`🔨 ${p.name} is on the block — base ${L(p.base)}`)})}
function nextP(){const a=S.players.filter(p=>p.status==='pending');if(!a.length)return toast('No players left');startP(a[Math.floor(Math.random()*a.length)].id)}
function applyBid(d,tid,amt,pid){const c=d.cur;if(!c||Date.now()>c.ends)return{ok:false,msg:'Bidding closed'};if(pid&&c.pid!==pid)return{ok:false,msg:'That player is already done'};
 const t=T(d,tid);if(!t)return{ok:false,msg:'Unknown team'};const min=c.by?c.bid+inc(c.bid):c.bid;
 if(c.by===tid)return{ok:false,msg:'You already lead this bid'};if(amt<min)return{ok:false,msg:'Minimum bid is '+L(min)};
 if(amt>t.budget)return{ok:false,msg:`Not enough budget. You have ${L(t.budget)} left`};
 c.bid=amt;c.by=tid;c.n++;c.ends=Math.max(c.ends,Date.now()+10000);logit(d,`💰 ${t.name} bids ${L(amt)}`);return{ok:true}}
function placeBid(tid,amt){amt=Math.floor(+amt);if(!(amt>0))return;if(!isAdmin)return remoteBid(tid,amt);return mut(d=>{const r=applyBid(d,tid,amt);if(!r.ok){toast(r.msg);return false}})}
async function remoteBid(tid,amt){const c=S&&S.cur;if(!c)return toast('No player on the block');if(!me||!me.code)return toast('Log in with your captain code');
 const r=applyBid(JSON.parse(JSON.stringify(S)),tid,amt,c.pid);if(!r.ok)return toast(r.msg);
 const id=fdb.ref('bids').push().key,rr=fdb.ref('results/'+id);rr.on('value',s=>{const v=s.val();if(v==null)return;rr.off();toast(v==='ok'?'Bid placed ✓':v)});
 try{await fdb.ref('bids/'+id).set({team:tid,amt,code:me.code,pid:c.pid,ts:Date.now()})}catch(e){rr.off();toast('Bid not accepted. Log out and log in again with your captain code')}}
function processBid(id,b){if(!b||!b.team)return fdb.ref('bids/'+id).remove();if(Date.now()-(b.ts||0)>600000)return fdb.ref('bids/'+id).remove();let res={ok:false,msg:'Rejected'};
 mut(d=>{res=applyBid(d,b.team,Math.floor(+b.amt),b.pid);return res.ok}).then(()=>fdb.ref('results/'+id).set(res.ok?'ok':(res.msg||'Rejected'))).then(()=>fdb.ref('bids/'+id).remove()).catch(()=>{})}
function finalize(force){return mut(d=>{const c=d.cur;if(!c||(!force&&Date.now()<c.ends))return false;const p=P(d,c.pid);
 if(c.by){p.status='sold';p.team=c.by;p.price=c.bid;T(d,c.by).budget-=c.bid;logit(d,`✅ SOLD! ${p.name} → ${T(d,c.by).name} for ${L(c.bid)}`)}
 else{p.status='unsold';logit(d,`❌ ${p.name} goes unsold`)}d.cur=null})}
function unsoldBack(){mut(d=>{d.players.forEach(p=>{if(p.status==='unsold')p.status='pending'});logit(d,'Unsold players re-entered the pool')})}

function render(){
 renderNav();if(mode==='home'){renderHome();return}
 $('home').style.display='none';$('mainwrap').style.display='';renderBidder();
 if(!S||!S.teams.length){$('stage').innerHTML=`<h2>Waiting for the auctioneer…</h2><p class="mut">${adm()?'Use the setup panel above to add teams and import players.':'The auction will appear here the moment it starts.'}</p>`;renderAdmin();$('teams').innerHTML=$('top').innerHTML=$('log').innerHTML=$('pool').innerHTML='<span class="mut">—</span>';$('tabs').innerHTML='';return}
 renderAdmin();renderStage();renderTeams();renderTop();renderPool();
 $('log').innerHTML=S.log.map(l=>`<div><span class="mut">${new Date(l.t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span> ${esc(l.m)}</div>`).join('')||'<span class="mut">No activity yet</span>';
 const mt=cap();$('who').innerHTML=mt?`${badge(mt)} Captain: ${esc(mt.name)} · ${L(mt.budget)} left`:mode==='auctioneer'?'Auctioneer':mode==='audience'?'Live audience':'';}
document.addEventListener('input',e=>{if(e.target.closest&&e.target.closest('#setup'))e.target.dataset.d=1});
function renderAdmin(){const ids=['sTeams','sBud','sSq','sSec','sTxt'],v={};ids.forEach(i=>{const e=$(i);if(e&&e.dataset.d)v[i]=e.value});const so=$('setup'),op=so?so.open:null;renderAdmin0();ids.forEach(i=>{const e=$(i);if(e&&i in v){e.value=v[i];e.dataset.d=1}});const n=$('setup');if(n&&op!==null)n.open=op}
function demoText(n){const f='Arjun Rohan Karan Vikram Aditya Siddharth Imran Neil Rahul Pranav Dev Manav Yash Faisal Tanmay Harsh Kabir Nikhil Zaid Ishaan'.split(' '),l='Mehta Iyer Shah Rao Nair Jain Khan Shetty Verma Kulkarni Patel Singh Gupta Sheikh Joshi Desai'.split(' '),lv=['Beginner','Intermediate','Advanced','Expert','Intermediate','Advanced'];let o='Name,Expertise Level';for(let i=0;i<Math.max(16,n);i++)o+=`\n${f[i%f.length]} ${l[(i*7+Math.floor(i/f.length))%l.length]},${lv[(i*5)%lv.length]}`;return o}
function ask(t,def,cb){const o=document.createElement('div');o.className='ov show';o.innerHTML=`<div class="card" style="color:var(--ink);min-width:280px;margin:0"><h2>${esc(t)}</h2><input id="askv" style="width:100%" value="${esc(def)}"><div class="row" style="margin-top:10px"><button class="pri" id="aok">OK</button><button id="ac">Cancel</button></div></div>`;document.body.appendChild(o);const i=o.querySelector('#askv');i.focus();i.select();const done=x=>{o.remove();if(x!=null)cb(x)};o.querySelector('#aok').onclick=()=>done(i.value);o.querySelector('#ac').onclick=()=>done(null);i.onkeydown=e=>{if(e.key==='Enter')done(i.value);if(e.key==='Escape')done(null)}}
let armed=0;
function renderAdmin0(){const a=$('admin');if(mode!=='auctioneer'){a.style.display='none';return}a.style.display='block';if(!isAdmin){if(!a.querySelector('#aEm'))a.innerHTML=`<h2>Auctioneer sign-in</h2><div class="row"><input id="aEm" type="email" placeholder="Auctioneer email" autocomplete="username" style="width:230px"><input id="aPw" type="password" placeholder="Password" autocomplete="current-password" style="width:180px" onkeydown="if(event.key==='Enter')adminLogin()"><button class="pri" onclick="adminLogin()">Sign in</button></div>`;return}if(!S){a.innerHTML='<p class="mut">Connecting…</p>';return}
 const has=S&&S.teams.length;
 a.innerHTML=`<h2>🎙 Auctioneer panel</h2>`+(has?`<div class="row"><button class="pri" onclick="nextP()" ${S.cur?'disabled':''}>Next random player</button>
 <button class="gold" onclick="finalize(true)" ${S.cur?'':'disabled'}>Hammer down now</button><button onclick="unsoldBack()">Re-enter unsold</button>
 <button onclick="document.getElementById('setup').open=!document.getElementById('setup').open">Setup / reset</button><button onclick="invites()">📨 Invite messages</button><button onclick="backup()">📋 Team-wise backup</button></div>
 <p class="mut" style="margin:8px 0 0">Captain codes: ${S.teams.map(t=>`<b style="color:${t.color}">${esc(t.name)}</b> ${CODES[t.id]||'—'}`).join(' · ')}</p>
 <p class="mut" style="margin:4px 0 0">As auctioneer you can also bid on behalf of any team from the stage below. Add a photo to a player from the pool list (📷).</p>`:'')
 +`<details id="setup" ${has?'':'open'} style="margin-top:10px"><summary>Setup &amp; import</summary>
 <p class="mut">Teams (comma separated)</p><input id="sTeams" style="width:100%" value="${has?esc(S.teams.map(t=>t.name).join(', ')):'Mumbai Mavericks, Bandra Blasters, Juhu Jaguars, Powai Panthers'}">
 <div class="row" style="margin:8px 0"><label>Budget (₹) <input id="sBud" type="number" style="width:90px" value="${S.cfg.budget}"></label><label>Timer (s) <input id="sSec" type="number" style="width:70px" value="${S.cfg.secs}"></label></div>
 <p class="mut">Paste players from your Google Form responses sheet (headers like Name, Expertise Level, Photo). Open the Sheet → Select all → Copy → Paste here, or paste CSV.</p>
 <textarea id="sTxt" placeholder="Name,Expertise Level&#10;..."></textarea>
 <div class="row" style="margin-top:8px"><button class="pri" onclick="doSetup(false)">Start fresh with these</button><button onclick="doSetup(true)">Use demo players</button></div></details>`}
function doSetup(demo){const names=$('sTeams').value.split(',').map(s=>s.trim()).filter(Boolean);const txt=demo?demoText(names.length*4+6):$('sTxt').value;
 if(names.length<2)return toast('Add at least 2 teams');if(!parsePlayers(txt).length)return toast('No players found — paste data or use demo');
 if(S&&S.players.length&&Date.now()-armed>6000){armed=Date.now();toast('This resets the whole auction. Press the button again within 6 seconds to confirm');return}armed=0;
 setup(names,txt,+$('sBud').value||1000,0,+$('sSec').value||30)}
function renderStage(){const c=S.cur,st=$('stage');
 if(!c){const sold=S.players.filter(p=>p.status==='sold').length,left=S.players.filter(p=>p.status==='pending').length;
  st.innerHTML=`<h2>${left?'Next player coming up…':'Auction complete 🎉'}</h2><p class="mut">${sold} sold · ${left} remaining. ${left?'Waiting for the auctioneer to call the next player.':'Check the squads and the most valued players!'}</p>`;return}
 const p=pl(c.pid),lead=c.by&&tm(c.by),mt=cap(),min=nextMin();
 const bt=adm()?'<select id="onb">'+S.teams.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')+'</select>':'';
 const bidTeam=mt?mt.id:null;
 st.innerHTML=`<button style="float:right" onclick="setMini(true)" title="Shrink to a small floating square">⌄ Minimise</button><div class="stage">${av(p)}<div><div class="mut">NOW ON THE BLOCK · ${c.by?'CURRENT BID':'BASE PRICE'}</div><div class="name big">${esc(p.name)}</div>
 <div class="stars">${stars(p.level)} <span class="mut" style="letter-spacing:0">Level ${p.level}/5 · base ${L(p.base)}</span></div>
 <div class="row" style="margin-top:6px"><div class="bid">${L(c.bid)}</div><div><span class="timer" id="tmr"></span><div id="going" class="mut"></div></div></div>
 <div style="margin:4px 0 8px">${lead?`${badge(lead)} <b style="color:${lead.color}">▲ ${esc(lead.name)}</b> leads · ${c.n} bids`:'<span class="mut">No bids yet — be the first!</span>'}</div>
 <div class="row">${bt}${(mt||adm())?[0,1,3].map(k=>{const a=min+(k?k*inc(min):0);return`<button class="${k?'':'pri'}" onclick="doBid(${a})">Bid ${L(a)}</button>`}).join(''):`<span class="mut">${mode==='bidder'?'Log in with your captain code to bid':'Watching live 👀'}</span>`}</div>${(mt||adm())?`<div class="row" style="margin-top:8px"><input id="cb" type="number" inputmode="numeric" min="${min}" step="1" placeholder="Your bid (min ${min})" value="${esc(cbv)}" oninput="cbv=this.value" onfocus="cbF=1" onblur="cbF=0" onkeydown="if(event.key==='Enter')customBid()" style="width:160px"><button class="gold" onclick="customBid()">Place my bid</button></div>`:''}</div></div>`;
 {const e=$('cb');if(e&&cbF){e.focus()}}tick()}
function doBid(a){const mt=cap();const id=mt?mt.id:($('onb')||{}).value;if(!id)return toast('Pick a team');placeBid(id,a)}
function tick(){updateMini();const c=S&&S.cur;if(!c)return;const left=Math.max(0,Math.ceil((c.ends-Date.now())/1000)),t=$('tmr');
 if(t){t.textContent='0:'+String(left).padStart(2,'0');t.classList.toggle('hot',left<=10)}
 const g=$('going');if(g)g.textContent=left===0?(c.by?'SOLD!':'Closing…'):left<=3&&c.by?'Going thrice…':left<=6&&c.by?'Going twice…':left<=10&&c.by?'Going once…':'';
 if(left===0&&isAdmin&&!busy&&!pendingFin){pendingFin=true;finalize(false).finally(()=>{pendingFin=false})}}
function renderTeams(){const lead=S.cur&&S.cur.by;$('teams').innerHTML=S.teams.map(t=>{const o=owned(t.id),pct=Math.max(0,t.budget/S.cfg.budget*100);
 return`<div class="team ${t.id===lead?'lead':''}"><div class="row">${badge(t)}<b style="color:${t.color}">${esc(t.name)}</b>${adm()?`<button title="Rename team" style="padding:2px 8px" onclick="renameTeam('${t.id}')">✏️</button>`:''}${adm()?`<button title="Set logo link" style="padding:2px 8px" onclick="setLogo('${t.id}')">🖼</button>`:''}<span class="sp"></span><b>${L(t.budget)}</b></div>
 <div class="bar"><b style="width:${pct}%;background:${t.color}"></b></div>
 <details><summary class="mut">🧑 ${o.length} player${o.length==1?'':'s'} · spent ${L(S.cfg.budget-t.budget)} · can bid up to ${L(maxBid(t))}</summary>
 ${o.map(p=>`<div class="li">${av(p,1)}<span>${esc(p.name)}</span><span class="sp"></span><span class="stars">${stars(p.level)}</span><b>${L(p.price)}</b></div>`).join('')||'<div class="mut">No players yet</div>'}</details></div>`}).join('')}
function renderTop(){let sold=S.players.filter(p=>p.status==='sold').sort((a,b)=>b.price-a.price);
 const hd=sold.length?'':'<div class="mut" style="margin-bottom:6px">No sales yet — marquee players to watch:</div>';
 if(!sold.length)sold=S.players.filter(p=>p.status==='pending').sort((a,b)=>b.level-a.level);
 const all=sold.length,vis=topAll?sold:sold.slice(0,3);$('top').innerHTML=hd+vis.map((p,i)=>`<div class="li"><b class="big" style="font-size:24px;width:20px">${i+1}</b>${av(p,1)}<div><b>${esc(p.name)}</b><div class="mut">${p.team?badge(tm(p.team))+' '+esc(tm(p.team).name):'Base '+L(p.base)}</div></div><span class="sp"></span><b style="color:var(--gold)">${p.price?L(p.price):stars(p.level)}</b></div>`).join('')+(all>3?`<button style="margin-top:8px;width:100%" onclick="topAll=!topAll;render()">${topAll?'▴ Show top 3 only':'▾ Show all '+all}</button>`:'')}
function renderPool(){$('pbody').style.display=poolOpen?'':'none';$('ptog').textContent=poolOpen?'▾ Collapse':'▸ Expand';const tabs=[['pending','Upcoming'],['sold','Sold'],['unsold','Unsold']];
 $('tabs').innerHTML=tabs.map(([k,n])=>`<button class="${tab===k?'on':''}" onclick="tab='${k}';render()">${n} (${S.players.filter(p=>p.status===k).length})</button>`).join('');
 const list=S.players.filter(p=>p.status===tab).sort((a,b)=>tab==='sold'?b.price-a.price:b.level-a.level);
 $('pool').innerHTML=list.map(p=>`<div class="li">${av(p,1)}<div><b>${esc(p.name)}</b><div class="stars">${stars(p.level)}</div></div><span class="sp"></span>
 ${p.team?`<span class="pill" style="border-color:${tm(p.team).color}">${badge(tm(p.team))} ${esc(tm(p.team).name)}</span><b>${L(p.price)}</b>`:`<span class="mut">Base ${L(p.base)}</span>`}
 ${adm()&&tab!=='sold'?`<button onclick="startP('${p.id}')" ${S.cur?'disabled':''}>Bring on</button>`:''}
 ${adm()?`<button title="Set photo link" style="padding:2px 8px" onclick="setPhoto('${p.id}')">📷</button>`:''}</div>`).join('')||'<span class="mut">Nobody here</span>'}
function cfgBanner(m){if(document.getElementById('cfgb'))return;document.querySelector('header').insertAdjacentHTML('afterend','<div id="cfgb" class="card" style="margin:14px 18px;border-color:var(--acc)"><b>Not connected to Firebase.</b> '+esc(m)+' Open firebase-config.js on GitHub and fill in every value (see README).</div>')}
function adminLogin(){if(!fauth)return toast('Firebase is not connected. Check firebase-config.js');const em=$('aEm').value.trim(),pw=$('aPw').value;if(!em||!pw)return toast('Enter your email and password');toast('Signing in…');fauth.signInWithEmailAndPassword(em,pw).catch(e=>toast('Sign-in failed: '+(e.code||'')+' '+e.message))}
function renameTeam(id){const t=tm(id);ask('Rename '+t.name,t.name,n=>{if(!n||!n.trim()||n.trim()===t.name)return;mut(d=>{const x=T(d,id);logit(d,`✏️ ${x.name} is now ${n.trim()}`);x.name=n.trim().slice(0,40)})})}
function setLogo(id){const t=tm(id),v=prompt('Logo link for '+t.name+' (https://… or logos/file.png). Leave empty to use logos/'+slug(t.name)+'.png',t.logo||'');if(v===null)return;mut(d=>{T(d,id).logo=drive(v)})}
function setPhoto(id){const p=pl(id),v=prompt('Photo link for '+p.name+' (https://… or photos/file.jpg). Leave empty to use photos/'+slug(p.name)+'.jpg',p.photo||'');if(v===null)return;mut(d=>{P(d,id).photo=drive(v)})}
function flash(a,b){if(!a||!a.cur||b.cur&&b.cur.pid===a.cur.pid)return;const p=b.players.find(x=>x.id===a.cur.pid);if(!p)return;
 if(p.status==='sold'){$('ovt').textContent='SOLD!';$('ovb').innerHTML=`<div style="margin:34px 0 28px">${av(p)}</div>`;$('ovs').textContent=`${p.name} → ${b.teams.find(t=>t.id===p.team).name} for ₹${p.price}`}
 else if(p.status==='unsold'){$('ovt').textContent='UNSOLD';$('ovb').innerHTML=`<div style="margin:34px 0 28px">${av(p)}</div>`;$('ovs').textContent=p.name}else return;
 $('ov').classList.add('show');setTimeout(()=>$('ov').classList.remove('show'),3200)}
let mode=window.ROLE||'audience',locked=true;
const adm=()=>isAdmin&&mode==='auctioneer';
const cap=()=>mode==='bidder'&&me&&me.code&&S&&tm(me.team);
function go(){}
function renderNav(){placeStage();$('stage').style.display=miniOn()?'none':'';updateMini();$('nav').innerHTML=locked?'':[['home','Home'],['audience','📺 Audience'],['bidder','🧑‍💼 Bidder'],['auctioneer','🎙 Auctioneer']].map(([k,n])=>`<button class="${mode===k?'on':''}" onclick="go('${k}')">${n}</button>`).join('')}
function renderHome(){$('mainwrap').style.display='none';const h=$('home');h.style.display='block';$('who').textContent='';
 h.innerHTML=`<div style="max-width:1000px;margin:auto;padding:24px 18px"><h2 style="font-size:44px">Choose your view</h2><p class="mut">Same live auction, three different pages.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;margin-top:14px">${[['audience','📺','Audience','Watch the auction live: current player, bids, team budgets and the most valued players. Read-only, ideal for a big screen.'],['bidder','🧑‍💼','Bidder','For team captains. Log in with your team code to place bids and track your budget and squad.'],['auctioneer','🎙','Auctioneer','Owner or editor only. Set up teams, import players, call players, hammer down, upload photos and logos.']].map(([k,e,n,d])=>`<div class="card"><div style="font-size:40px">${e}</div><h2>${n}</h2><p class="mut">${d}</p><button class="pri" onclick="go('${k}')">Open ${n} page</button></div>`).join('')}</div></div>`}
function renderBidder(){const lg=$('login'),mn=$('mine');mn.style.display='none';lg.style.display='none';
 if(mode!=='bidder'||!S||!S.teams.length)return;const mt=cap();
 if(!mt){lg.style.display='block';if(!lg.querySelector('#lc'))lg.innerHTML=`<h2>Captain login</h2><div class="row"><select id="lt">${S.teams.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select><input id="lc" placeholder="Captain code" inputmode="numeric" style="width:150px"><button class="pri" onclick="login()">Enter</button></div><p class="mut" style="margin:8px 0 0">Ask the auctioneer for your team's code.</p>`;return}
 const o=owned(mt.id),mx=maxBid(mt);mn.style.display='block';
 mn.innerHTML=`<div class="row">${badge(mt,'l')}<div><h2 style="color:${mt.color}">${esc(mt.name)}</h2><div class="mut">Captain panel</div></div><span class="sp"></span><div style="text-align:right"><div class="mut">Budget left</div><div class="big" style="font-size:44px;color:var(--gold)">${L(mt.budget)}</div></div></div>
 <div class="row mut" style="margin:6px 0"><span>Players: <b>${o.length}</b></span><span>·</span><span>Max bid now ${L(mx)}</span><span class="sp"></span><button onclick="logout()">Log out</button></div>
 ${o.map(p=>`<div class="li">${av(p,1)}<span>${esc(p.name)}</span><span class="sp"></span><span class="stars">${stars(p.level)}</span><b>${L(p.price)}</b></div>`).join('')||'<div class="mut">No players bought yet</div>'}`}
function login(){const t=tm($('lt').value),c=$('lc').value.trim();if(!t||!c)return toast('Enter your captain code');
 fdb.ref('probe/'+t.id).set(c).then(()=>{me={team:t.id,code:c};try{localStorage.setItem('cap',JSON.stringify(me))}catch(e){}$('login').innerHTML='';render()}).catch(()=>toast('Wrong captain code'))}
function logout(){me=null;try{localStorage.removeItem('cap')}catch(e){}render()}
function placeStage(){const st=$('stage'),m=st.parentNode,want=S&&S.cur?$('login'):$('pbody').parentNode;if(want&&st.nextElementSibling!==want)m.insertBefore(st,want)}
function backup(){const R=[['Team','Player','Level (1-5)','Price (₹)']];S.teams.forEach(t=>owned(t.id).forEach(p=>R.push([t.name,p.name,p.level,p.price])));
 R.push([]);R.push(['Team','Players','Spent (₹)','Budget left (₹)']);S.teams.forEach(t=>R.push([t.name,owned(t.id).length,S.cfg.budget-t.budget,t.budget]));
 const un=S.players.filter(p=>p.status!=='sold');if(un.length){R.push([]);R.push(['Not sold','Level (1-5)','Status']);un.forEach(p=>R.push([p.name,p.level,p.status==='unsold'?'Unsold':'Upcoming']))}
 const txt=R.map(r=>r.join('\t')).join('\n');
 const o=document.createElement('div');o.className='ov show';o.innerHTML=`<div class="card" style="color:var(--ink);width:min(560px,92vw);margin:0;text-align:left"><h2>Team-wise backup</h2><p class="mut" style="margin:0 0 8px">Click Copy, then paste into cell A1 of a Google Sheet. It splits into columns automatically.</p><textarea id="bkt" readonly style="min-height:260px;white-space:pre">${esc(txt)}</textarea><div class="row" style="margin-top:8px"><button class="pri" id="bcp">Copy</button><button id="bcl">Close</button></div></div>`;document.body.appendChild(o);
 const ta=o.querySelector('#bkt');o.querySelector('#bcl').onclick=()=>o.remove();
 o.querySelector('#bcp').onclick=async()=>{try{await navigator.clipboard.writeText(txt);toast('Copied. Paste into your Google Sheet')}catch(e){ta.select();try{document.execCommand('copy')}catch(x){}toast('Selected, copy it if it did not auto-copy')}}}
let cbv='',cbF=0;
function customBid(){const mt=cap();const id=mt?mt.id:($('onb')||{}).value;if(!id)return toast('Pick a team');const a=Math.floor(+cbv);if(!a||a<=0)return toast('Enter a bid amount');placeBid(id,a);cbv=''}
let poolOpen=innerWidth>860,topAll=false;
function togglePool(){poolOpen=!poolOpen;render()}
let mini=false,mkey='';
const miniOn=()=>mini&&mode!=='home'&&!!(S&&S.cur);
function setMini(v){mini=v;render()}
function updateMini(){const m=$('mini');if(!m)return;const on=miniOn();m.classList.toggle('on',on);if(!on){mkey='';return}
 const c=S.cur,p=pl(c.pid),lead=c.by&&tm(c.by),mt=cap(),min=nextMin(),k=[c.pid,c.bid,c.by,mt&&mt.id,min].join('|');
 if(k!==mkey){mkey=k;m.innerHTML=`<small>${esc(p.name)}</small><div class="mb">${L(c.bid)}</div><div class="mt" id="mtm"></div><small style="color:${lead?lead.color:'var(--mut)'}">${lead?esc(lead.name):'no bids yet'}</small>${mt?`<button class="pri" style="padding:3px 8px;font-size:12px;margin-top:3px" onclick="event.stopPropagation();doBid(${min})">Bid ${L(min)}</button>`:''}`}
 const left=Math.max(0,Math.ceil((c.ends-Date.now())/1000)),t=$('mtm');if(t){t.textContent='0:'+String(left).padStart(2,'0');t.style.color=left<=10?'var(--acc)':''}}
$('mini').onclick=()=>setMini(false);
function invites(){const U=location.href.replace(/[#?].*$/,'').replace(/[^/]*$/,'');const txt='📺 Watch live (everyone): '+U+'audience.html\n\n'+S.teams.map(t=>`🏏 ${t.name} captain\nBid here: ${U}bidder.html\nTeam: ${t.name}\nCaptain code: ${CODES[t.id]||'—'}`).join('\n\n');
 const o=document.createElement('div');o.className='ov show';o.innerHTML=`<div class="card" style="color:var(--ink);width:min(520px,92vw);margin:0;text-align:left"><h2>Invite messages</h2><textarea id="invt" readonly style="min-height:260px">${esc(txt)}</textarea><div class="row" style="margin-top:8px"><button class="pri" id="icp">Copy all</button><button id="icl">Close</button></div></div>`;document.body.appendChild(o);
 const ta=o.querySelector('#invt');o.querySelector('#icl').onclick=()=>o.remove();
 o.querySelector('#icp').onclick=async()=>{try{await navigator.clipboard.writeText(txt);toast('Copied')}catch(e){ta.select();try{document.execCommand('copy')}catch(x){}toast('Selected, copy it if it did not auto-copy')}}}
setInterval(tick,250);
try{if(!FIREBASE_CONFIG||/PASTE_HERE/.test(JSON.stringify(FIREBASE_CONFIG)))throw new Error('firebase-config.js still contains PASTE_HERE.');firebase.initializeApp(FIREBASE_CONFIG);fdb=firebase.database();fauth=firebase.auth();stateRef=fdb.ref('public/state');
 stateRef.on('value',s=>{const n=norm(s.val());flash(S,n||blank());S=n||blank();render()},e=>toast('Connection issue: '+e.code));
 if(mode==='auctioneer')fauth.onAuthStateChanged(u=>{isAdmin=!!u;if(u&&!adminLoaded){adminLoaded=true;fdb.ref('secrets/codes').on('value',s=>{CODES=s.val()||{};render()});fdb.ref('bids').on('child_added',s=>processBid(s.key,s.val()))}render()});
}catch(e){cfgBanner(e.message||String(e))}
render();
