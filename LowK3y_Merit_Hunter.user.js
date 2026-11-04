// ==UserScript==
// @name         LowK3y Merit Hunter
// @namespace    https://github.com/5cyp4csmpb-ctrl
// @version      0.3.4
// @description  Read-only Torn merit and award explorer for Torn PDA
// @author       LowK3y Industries
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @updateURL    https://raw.githubusercontent.com/5cyp4csmpb-ctrl/Lowk3y-Merit-Hunter/main/LowK3y_Merit_Hunter.user.js
// @downloadURL  https://raw.githubusercontent.com/5cyp4csmpb-ctrl/Lowk3y-Merit-Hunter/main/LowK3y_Merit_Hunter.user.js
// @run-at       document-idle
// ==/UserScript==
(function(){
'use strict';
if(window.__lowk3yMH)return;window.__lowk3yMH=true;
const KEY='lowk3y_mh_key',CACHE='lowk3y_mh_cache';
let key=localStorage.getItem(KEY)||'',state=null,tab='missing';
const css=document.createElement('style');
css.textContent='#lowmh,#lowmh *{box-sizing:border-box}#lowmh{position:fixed;inset:5% 3%;z-index:2147483646;background:#101b28;color:#eaf8ff;border:1px solid #30c9eb;border-radius:15px;display:none;flex-direction:column;font:14px system-ui;box-shadow:0 8px 40px #000c}#lowmh.open{display:flex}#lowmh header{display:flex;justify-content:space-between;align-items:center;padding:12px;background:#1c2c3c;border-radius:15px 15px 0 0}#lowmh main{padding:12px;overflow:auto;flex:1}#lowmh button{background:#23425a;color:white;border:1px solid #45748a;padding:9px;border-radius:8px;margin:3px}#lowmh input{width:100%;background:#0b1420;color:white;padding:12px;border:1px solid #527487;border-radius:8px}#lowmh .award{padding:10px;border:1px solid #345268;border-radius:9px;margin:8px 0;background:#182b3a}#lowmh small{color:#a8c0cf}#lowmh-status{padding:8px 12px;color:#a9dcea;background:#1a2c3b}#lowmh-launch{position:fixed;right:8px;top:48%;z-index:2147483645;border-radius:13px;background:#101b28;color:#80e6ff;border:1px solid #30c9eb;padding:12px;font-weight:bold}';
document.head.appendChild(css);
const launch=document.createElement('button');launch.id='lowmh-launch';launch.textContent='🎯 MH';document.body.appendChild(launch);
const panel=document.createElement('section');panel.id='lowmh';panel.innerHTML='<header><strong>🎯 LowK3y Merit Hunter v0.3.4</strong><button id="lowmh-close">✕</button></header><div id="lowmh-status">Read-only • API data</div><main id="lowmh-body"></main>';document.body.appendChild(panel);
const $=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const status=x=>$('lowmh-status').textContent=x;
function req(path){const url='https://api.torn.com/v2/'+path+(path.includes('?')?'&':'?')+'comment=LowK3yMeritHunter';return new Promise((resolve,reject)=>{const done=r=>{try{const d=JSON.parse(typeof r==='string'?r:r.responseText||r.body||'{}');if(d.error)throw Error(d.error.error||'API error');resolve(d)}catch(e){reject(e)}};if(typeof GM_xmlhttpRequest==='function')GM_xmlhttpRequest({method:'GET',url,headers:{Authorization:'ApiKey '+key},timeout:20000,onload:done,onerror:()=>reject(Error('Network error')),ontimeout:()=>reject(Error('Timeout'))});else fetch(url,{headers:{Authorization:'ApiKey '+key}}).then(r=>r.text()).then(done,reject)})}
function legacyStats(){return new Promise((resolve,reject)=>{const url='https://api.torn.com/user/?selections=personalstats&comment=LowK3yMeritHunter&key='+encodeURIComponent(key);const done=r=>{try{const d=JSON.parse(typeof r==='string'?r:r.responseText||r.body||'{}');if(d.error)throw Error(d.error.error||'Legacy API error');resolve(d.personalstats||null)}catch(e){reject(e)}};if(typeof GM_xmlhttpRequest==='function')GM_xmlhttpRequest({method:'GET',url,timeout:20000,onload:done,onerror:()=>reject(Error('Legacy network error')),ontimeout:()=>reject(Error('Legacy timeout'))});else fetch(url).then(r=>r.text()).then(done,reject)})}
function nonempty(v){return v!=null&&typeof v==='object'&&Object.keys(v).length>0}
function ids(v){if(Array.isArray(v))return new Set(v.map(x=>Number(typeof x==='object'?x.id:x)));if(v&&typeof v==='object')return new Set(Object.keys(v).map(Number));return new Set()}
function entries(v){if(Array.isArray(v))return v.map((x,i)=>({...x,id:Number(x.id??i)}));return Object.entries(v||{}).map(([id,x])=>({...x,id:Number(x.id??id)}))}
async function load(){if(!key)return status('Enter your Limited API key');status('Loading Torn API v2…');try{const paths=['user/honors','user/medals','user/merits','user/personalstats','torn/honors','torn/medals'];const out=await Promise.allSettled(paths.map(req));const errors=[];const data=out.map((r,i)=>{if(r.status==='fulfilled')return r.value;errors.push(paths[i]+': '+r.reason.message);return {}});if(errors.length===paths.length){status('API requests failed • '+errors[0]+' • previous data retained');return}let stats=data[3].personalstats;if(!nonempty(stats)){try{stats=await legacyStats();if(!nonempty(stats))errors.push('Personal statistics returned empty from both API versions')}catch(e){errors.push('Legacy personalstats: '+e.message)}}const user={honors:data[0].honors,medals:data[1].medals,merits:data[2].merits,personalstats:stats};const torn={honors:data[4].honors,medals:data[5].medals};if(state){for(const k of ['honors','medals','merits','personalstats'])if(!nonempty(user[k]))user[k]=state.user?.[k];for(const k of ['honors','medals'])if(!nonempty(torn[k]))torn[k]=state.torn?.[k]}state={user,torn,errors};localStorage.setItem(CACHE,JSON.stringify(state));status(errors.length?'Loaded with '+errors.length+' API warnings • see Diagnostics':'API v2 loaded • '+new Date().toLocaleTimeString());render()}catch(e){status('Error: '+e.message)}}

function awardProgress(a){
const desc=String(a.description||a.requirement||'').toLowerCase().replace(/,/g,'').trim();
const raw=state.user.personalstats||{},ps=raw.stats||raw;
const rules=[
{re:/^(?:find|discover|collect) (\\d+) (?:items? )?in the city\\b/,keys:['cityfinds']},
{re:/^(?:win|achieve) (\\d+) (?:attacks?|attack wins?)\\b/,keys:['attackswon']},
{re:/^(?:use|spend) (\\d+) job points?\\b/,keys:['jobpointsused']},
{re:/^(?:achieve|make|perform) (\\d+) (?:finishing )?hits? with slashing weapons?\\b/,keys:['slashinghits']},
{re:/^(?:achieve|commit|complete|perform) (\\d+) theft crimes?\\b/,keys:['theftcrimes']},
{re:/^(?:achieve|commit|complete|perform) (\\d+) other crimes?\\b/,keys:['othercrimes']},
{re:/^(?:achieve|commit|complete|perform) (\\d+) (?:total )?crimes?\\b/,keys:['criminaloffenses']},
{re:/^(?:achieve|perform|complete|make) (\\d+) (?:successful )?busts?\\b/,keys:['peoplebusted']},
{re:/^(?:achieve|perform|complete|make) (\\d+) (?:successful )?revives?\\b/,keys:['revives']},
{re:/^(?:achieve|perform|complete|make) (\\d+) (?:successful )?escapes?\\b/,keys:['escapes']},
{re:/^(?:travel|fly) (\\d+) times?\\b/,keys:['traveltimes']},
{re:/^(?:use|take) (\\d+) xanax\\b/,keys:['xantaken']},
{re:/^(?:use|take) (\\d+) drugs?\\b/,keys:['drugsused']},
{re:/^(?:win|achieve) (\\d+) (?:defends?|defense wins?)\\b/,keys:['defendswon']},
{re:/^(?:achieve|make|perform) (\\d+) (?:successful )?muggings?\\b/,keys:['moneymugged'] ,disabled:true}
];
for(const rule of rules){if(rule.disabled)continue;const m=desc.match(rule.re);if(!m)continue;const target=Number(m[1]);const k=rule.keys.find(k=>Number.isFinite(ps[k])&&ps[k]>=0);if(!k||!Number.isFinite(target)||target<=0)return null;const value=ps[k];return {value,target,percent:Math.min(100,Math.max(0,100*value/target)),source:k}}
return null;
}
function render(){const body=$('lowmh-body');if(!state){body.innerHTML='<p>Enter your Torn Limited API key. It stays on this device and requests go only to Torn.</p><input id="lowmh-key" type="password" placeholder="Limited API key" value="'+esc(key)+'"><button id="lowmh-load">Load my awards</button><button id="lowmh-clear">Clear key</button>'; $('lowmh-load').onclick=()=>{key=$('lowmh-key').value.trim();if(!key)return status('Enter a key');localStorage.setItem(KEY,key);load()};$('lowmh-clear').onclick=()=>{key='';localStorage.removeItem(KEY);localStorage.removeItem(CACHE);render()};return}
const h=ids(state.user.honors),m=ids(state.user.medals);
const all=[...entries(state.torn.honors).map(a=>({...a,type:'Honor',earned:h.has(a.id)})),...entries(state.torn.medals).map(a=>({...a,type:'Medal',earned:m.has(a.id)}))];
body.innerHTML='<div><button id="lowmh-refresh">Refresh</button><button id="lowmh-missing">Unearned</button><button id="lowmh-honors">Honors</button><button id="lowmh-medals">Medals</button><button id="lowmh-merits">Merits</button><button id="lowmh-diag">Diagnostics</button></div><input id="lowmh-search" placeholder="Search awards"><div id="lowmh-list"></div><small>Progress bars appear only when a matching personal statistic is available. Other awards are marked unavailable.</small>';
$('lowmh-refresh').onclick=load;for(const t of ['missing','honors','medals','merits','diag'])$('lowmh-'+t).onclick=()=>{tab=t;draw()};
$('lowmh-search').oninput=draw;
function draw(){const q=$('lowmh-search').value.toLowerCase();if(tab==='diag'){const ps=state.user.personalstats;const keys=ps&&typeof ps==='object'?Object.keys(ps):[];const inspect=['cityfinds','attackswon','jobpointsused','slashinghits'];const mapped=ps?.stats||ps||{};const safe=inspect.map(k=>k+': '+(typeof mapped[k]==='number'?mapped[k]:'missing')).join(' | ');const h=state.user.honors,m=state.user.medals;$('lowmh-list').innerHTML='<div class="award"><b>Safe API diagnostics</b><p>Personalstats: '+(keys.length?keys.length+' top-level fields':'missing or empty')+'</p><p>Example fields: '+esc(keys.slice(0,12).join(', ')||'none')+'</p><p>Mapped values: '+esc(safe)+'</p><p>Honors shape: '+(Array.isArray(h)?'array '+h.length:typeof h)+'</p><p>Medals shape: '+(Array.isArray(m)?'array '+m.length:typeof m)+'</p><small>No API key or private profile details shown. Send a screenshot of this panel.</small></div>';return}if(tab==='merits'){const merits=Object.entries(state.user.merits||{}).filter(([n,v])=>typeof v==='number').sort((a,b)=>b[1]-a[1]);const used=merits.reduce((sum,[,v])=>sum+v,0);$('lowmh-list').innerHTML='<div style="padding:14px;background:#142c3d;border:1px solid #39647a;border-radius:12px;margin:10px 0"><div style="font-size:12px;letter-spacing:1px;color:#9ac8dd">MERIT ALLOCATION</div><div style="font-size:25px;font-weight:750;margin:5px 0">'+used+' <span style="font-size:13px;font-weight:400;color:#a9c9d8">levels invested</span></div><small>Each bar shows your level out of 10. Upgrade costs increase by level.</small></div>'+merits.filter(([n,v])=>v>0).map(([name,value])=>{const focus=name==='Employee Effectiveness';return '<div style="padding:12px;margin:8px 0;background:#182b3a;border:1px solid '+(focus?'#e5bb61':'#345268')+';border-radius:10px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:9px"><strong>'+esc(name)+(focus?' ★':'')+'</strong><strong style="color:'+(focus?'#ffd079':'#8ae5ff')+'">'+value+'/10</strong></div><div style="height:11px;background:#0b1722;border-radius:10px;overflow:hidden"><div style="height:100%;width:'+(value*10)+'%;border-radius:10px;background:'+(focus?'linear-gradient(90deg,#d29b39,#ffdb83)':'linear-gradient(90deg,#157caa,#3de0ee)')+'"></div></div></div>'}).join('')+'<details style="margin:12px 0;padding:10px;background:#142736;border-radius:9px"><summary>Unallocated categories ('+merits.filter(([n,v])=>v===0).length+')</summary><div style="padding-top:10px;color:#a9c9d8">'+merits.filter(([n,v])=>v===0).map(([n])=>'<div style="padding:5px 0">'+esc(n)+' — 0/10</div>').join('')+'</div></details>';return}
const shown=all.filter(a=>(tab==='missing'?!a.earned:tab==='honors'?a.type==='Honor':a.type==='Medal')).filter(a=>((a.name||a.title||'')+' '+(a.description||'')).toLowerCase().includes(q));
$('lowmh-list').innerHTML='<p>'+shown.length+' awards match • '+Math.min(shown.length,250)+' displayed • '+shown.filter(a=>awardProgress(a)).length+' with measurable progress</p>'+shown.slice(0,250).map(a=>{const p=awardProgress(a);return '<div class="award"><b>'+esc(a.name||a.title||a.type+' #'+a.id)+'</b> <small>'+a.type+(a.earned?' • earned':' • unearned')+'</small><p>'+esc(a.description||a.requirement||'')+'</p>'+(p?'<div style="display:flex;justify-content:space-between;color:#9bdff0;font-size:12px;margin:6px 0"><span>'+p.value.toLocaleString()+' / '+p.target.toLocaleString()+'</span><span>'+p.percent.toFixed(1)+'%</span></div><div style="height:10px;background:#0b1722;border-radius:10px;overflow:hidden"><div style="height:100%;width:'+p.percent+'%;background:linear-gradient(90deg,#147caa,#3de0ee);border-radius:10px"></div></div><small>'+(Math.max(0,p.target-p.value)).toLocaleString()+' remaining</small>':'<small>Progress not available from current API statistics</small>')+'</div>'}).join('')+(shown.length>250?'<small>Showing first 250; use search to narrow the results.</small>':'')}
draw()}
const POS='lowk3y_mh_launcher_position';
try{const p=JSON.parse(localStorage.getItem(POS)||'null');if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){launch.style.left=Math.max(0,Math.min(innerWidth-55,p.x))+'px';launch.style.top=Math.max(0,Math.min(innerHeight-45,p.y))+'px';launch.style.right='auto'}}catch(e){}
let drag=null,suppressClick=false;
launch.style.touchAction='none';launch.style.userSelect='none';
launch.addEventListener('pointerdown',e=>{if(e.button!==0)return;const r=launch.getBoundingClientRect();drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,x:r.left,y:r.top,moved:false};launch.setPointerCapture(e.pointerId)});
launch.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;if(Math.hypot(dx,dy)>7)drag.moved=true;if(!drag.moved)return;e.preventDefault();launch.style.left=Math.max(0,Math.min(innerWidth-launch.offsetWidth,drag.x+dx))+'px';launch.style.top=Math.max(0,Math.min(innerHeight-launch.offsetHeight,drag.y+dy))+'px';launch.style.right='auto'});
launch.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;if(drag.moved){suppressClick=true;localStorage.setItem(POS,JSON.stringify({x:parseFloat(launch.style.left),y:parseFloat(launch.style.top)}))}drag=null});
launch.addEventListener('pointercancel',()=>{drag=null});
launch.onclick=()=>{if(suppressClick){suppressClick=false;return}panel.classList.toggle('open');if(panel.classList.contains('open'))render()};$('lowmh-close').onclick=()=>panel.classList.remove('open');
try{state=JSON.parse(localStorage.getItem(CACHE)||'null')}catch(e){}
})();
