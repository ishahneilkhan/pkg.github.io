/* Website Deals - published site data. Admin edits live in this browser; "Publish" saves it to Firebase for every device (data/site-data.json is the fallback). */
(function(){
var MAP={websiteDealsBanners:"banners",websiteDealsPackages:"packages",websiteDealsHomepage:"homepage",websiteDealsSettings:"settings"};
var ROOT=(document.currentScript&&document.currentScript.src)?document.currentScript.src.replace(/shared\/data\.js.*$/,""):"./";
var remote=null;
function ls(k){try{var v=localStorage.getItem(k);return v==null?undefined:JSON.parse(v)}catch(e){return undefined}}
function get(k,d){var l=ls(k);if(l!==undefined&&l!==null)return l;var n=MAP[k];if(remote&&remote[n]!=null)return remote[n];return d}
function addScript(src){return new Promise(function(res,rej){var t=document.createElement("script");t.src=src;t.onload=res;t.onerror=function(){rej(new Error("load failed: "+src))};document.head.appendChild(t)})}
var fbP=null;
function loadFirebase(){if(window.WDFirebase)return Promise.resolve(window.WDFirebase);if(fbP)return fbP;fbP=addScript(ROOT+"shared/firebase-config.js").then(function(){return addScript(ROOT+"shared/firebase.js")}).then(function(){return window.WDFirebase}).catch(function(){return null});return fbP}
function fromFirebase(){return loadFirebase().then(function(f){if(!f||!f.enabled)return null;return f.readData()}).catch(function(){return null})}
function fromJson(){return fetch(ROOT+"data/site-data.json?v="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.json():null}).catch(function(){return null})}
function loadRemote(){return fromFirebase().then(function(j){return j&&typeof j==="object"?j:fromJson()}).then(function(j){if(j&&typeof j==="object"){remote=j;try{window.dispatchEvent(new CustomEvent("wd:data-ready"))}catch(e){}}return remote})}
function publish(){return loadFirebase().then(function(f){if(!f||!f.enabled)throw new Error("Firebase is not configured yet (shared/firebase-config.js).");return f.writeData(bundle())})}
function bundle(){var o={};Object.keys(MAP).forEach(function(k){var v=get(k,null);o[MAP[k]]=v===undefined?null:v});return o}
function download(){var b=new Blob([JSON.stringify(bundle(),null,2)],{type:"application/json"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="site-data.json";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},1000)}
function seedLocal(){return loadRemote().then(function(r){if(!r)return false;Object.keys(MAP).forEach(function(k){if(r[MAP[k]]!=null)localStorage.setItem(k,JSON.stringify(r[MAP[k]]))});return true})}
window.WDData={get:get,loadRemote:loadRemote,bundle:bundle,download:download,seedLocal:seedLocal,publish:publish,loadFirebase:loadFirebase,MAP:MAP};
loadRemote();
})();
