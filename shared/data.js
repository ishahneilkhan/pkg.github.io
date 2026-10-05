/* Website Deals - published site data. Admin edits live in this browser; "Export site data" makes data/site-data.json for every device. */
(function(){
var MAP={websiteDealsBanners:"banners",websiteDealsPackages:"packages",websiteDealsHomepage:"homepage",websiteDealsSettings:"settings"};
var ROOT=(document.currentScript&&document.currentScript.src)?document.currentScript.src.replace(/shared\/data\.js.*$/,""):"./";
var remote=null;
function ls(k){try{var v=localStorage.getItem(k);return v==null?undefined:JSON.parse(v)}catch(e){return undefined}}
function get(k,d){var l=ls(k);if(l!==undefined&&l!==null)return l;var n=MAP[k];if(remote&&remote[n]!=null)return remote[n];return d}
function loadRemote(){return fetch(ROOT+"data/site-data.json?v="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.json():null}).then(function(j){if(j&&typeof j==="object"){remote=j;try{window.dispatchEvent(new CustomEvent("wd:data-ready"))}catch(e){}}return remote}).catch(function(){return null})}
function bundle(){var o={};Object.keys(MAP).forEach(function(k){var v=get(k,null);o[MAP[k]]=v===undefined?null:v});return o}
function download(){var b=new Blob([JSON.stringify(bundle(),null,2)],{type:"application/json"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="site-data.json";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},1000)}
function seedLocal(){return loadRemote().then(function(r){if(!r)return false;Object.keys(MAP).forEach(function(k){if(r[MAP[k]]!=null)localStorage.setItem(k,JSON.stringify(r[MAP[k]]))});return true})}
window.WDData={get:get,loadRemote:loadRemote,bundle:bundle,download:download,seedLocal:seedLocal,MAP:MAP};
loadRemote();
})();
