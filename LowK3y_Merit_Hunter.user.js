// ==UserScript==
// @name         LowK3y Merit Hunter
// @namespace    https://github.com/5cyp4csmpb-ctrl
// @version      0.1.0
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
const panel=document.createElement('section');panel.id='lowmh';panel.innerHTML='<header><strong>🎯 LowK3y Merit Hunter v0.1</strong><button id="lowmh-close">✕</button></header><div id="lowmh-status">Read-only • API data</div><main id="lowmh-body"></main>';document.body.appendChild(panel);
const $=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const status=x=>$('lowmh-status').textContent=x;
function req(path){const url='https://api.torn.com/'+path+(path.includes('?')?'&':'?')+'comment=LowK3yMeritHunter';return new Promise((resolve,reject)=>{const done=r=>{try{const d=JSON.parse(typeof r==='string'?r:r.responseText||r.body||'{}');if(d.error)throw Error(d.error.error||'API error');resolve(d)}catch(e){reject(e)}};if(typeof GM_xmlhttpRequest==='function')GM_xmlhttpRequest({method:'GET',url,headers:{Authorization:'ApiKey '+key},timeout:20000,onload:done,onerror:()=>reject(Error('Network error')),ontimeout:()=>reject(Error('Timeout'))});else fetch(url,{headers:{Authorization:'ApiKey '+key}}).then(r=>r.text()).then(done,reject)})}
function ids(v){if(Array.isArray(v))return new Set(v.map(x=>Number(typeof x==='object'?x.id:x)));if(v&&typeof v==='object')return new Set(Object.keys(v).map(Number));return new Set()}
function entries(v){if(Array.isArray(v))return v.map((x,i)=>({...x,id:Number(x.id??i)}));return Object.entries(v||{}).map(([id,x])=>({...x,id:Number(x.id??id)}))}
async function load(){if(!key)return status('Enter your Limited API key');status('Loading Torn awards…');try{const [user,torn]=await Promise.all([req('user/?selections=honors,medals,merits'),req('torn/?selections=honors,medals')]);state={user,torn};localStorage.setItem(CACHE,JSON.stringify(state));status('Awards loaded • '+new Date().toLocaleTimeString());render()}catch(e){status('Error: '+e.message)}}
function render(){const body=$('lowmh-body');if(!state){body.innerHTML='<p>Enter your Torn Limited API key. It stays on this device and requests go only to Torn.</p><input id="lowmh-key" type="password" placeholder="Limited API key" value="'+esc(key)+'"><button id="lowmh-load">Load my awards</button><button id="lowmh-clear">Clear key</button>'; $('lowmh-load').onclick=()=>{key=$('lowmh-key').value.trim();if(!key)return status('Enter a key');localStorage.setItem(KEY,key);load()};$('lowmh-clear').onclick=()=>{key='';localStorage.removeItem(KEY);localStorage.removeItem(CACHE);render()};return}
const h=ids(state.user.honors),m=ids(state.user.medals);
const all=[...entries(state.torn.honors).map(a=>({...a,type:'Honor',earned:h.has(a.id)})),...entries(state.torn.medals).map(a=>({...a,type:'Medal',earned:m.has(a.id)}))];
body.innerHTML='<div><button id="lowmh-refresh">Refresh</button><button id="lowmh-missing">Unearned</button><button id="lowmh-honors">Honors</button><button id="lowmh-medals">Medals</button><button id="lowmh-merits">Merits</button></div><input id="lowmh-search" placeholder="Search awards"><div id="lowmh-list"></div><small>Progress estimates are not yet available for every award. This beta lists awards, not guaranteed quick wins.</small>';
$('lowmh-refresh').onclick=load;for(const t of ['missing','honors','medals','merits'])$('lowmh-'+t).onclick=()=>{tab=t;draw()};
$('lowmh-search').oninput=draw;
function draw(){const q=$('lowmh-search').value.toLowerCase();if(tab==='merits'){$('lowmh-list').innerHTML='<pre style="white-space:pre-wrap">'+esc(JSON.stringify(state.user.merits||{},null,2))+'</pre>';return}
const shown=all.filter(a=>(tab==='missing'?!a.earned:tab==='honors'?a.type==='Honor':a.type==='Medal')).filter(a=>((a.name||a.title||'')+' '+(a.description||'')).toLowerCase().includes(q));
$('lowmh-list').innerHTML='<p>'+shown.length+' awards shown</p>'+shown.slice(0,250).map(a=>'<div class="award"><b>'+esc(a.name||a.title||a.type+' #'+a.id)+'</b> <small>'+a.type+(a.earned?' • earned':' • unearned')+'</small><p>'+esc(a.description||a.requirement||'')+'</p></div>').join('')+(shown.length>250?'<small>Showing first 250; narrow your search.</small>':'')}
draw()}
launch.onclick=()=>{panel.classList.toggle('open');if(panel.classList.contains('open'))render()};$('lowmh-close').onclick=()=>panel.classList.remove('open');
try{state=JSON.parse(localStorage.getItem(CACHE)||'null')}catch(e){}
})();
