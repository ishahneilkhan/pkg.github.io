/* Website Deals - premium checkout (details -> payment -> confirm). Settings: websiteDealsSite.checkout */
(function(){
var $=function(s,r){return(r||document).querySelector(s)};
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function site(){try{var v=window.WDData?WDData.get("websiteDealsSite",null):JSON.parse(localStorage.getItem("websiteDealsSite")||"null");return v||{}}catch(e){return{}}}
function cfg(){var c=site().checkout||{};return c}
function wa(){try{var s=window.WDData?WDData.get("websiteDealsSettings",{}):{};return String((s||{}).whatsapp||"").replace(/\D/g,"")||"8801705633700"}catch(e){return"8801705633700"}}
function safeUrl(u){u=String(u||"").trim();return/^https?:\/\//i.test(u)?u:""}
var el,P,state;
function build(){
  el=document.createElement("div");el.className="wdc";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");
  el.innerHTML='<div class="wdc-bg"></div><div class="wdc-box"><button class="wdc-x" aria-label="Close">✕</button><div class="wdc-main"><div class="wdc-steps"><i></i><i></i><i></i></div><div id="wdcBody"></div></div><aside class="wdc-side" id="wdcSide"></aside></div>';
  document.body.appendChild(el);
  el.querySelector(".wdc-bg").onclick=close;el.querySelector(".wdc-x").onclick=close;
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&el.classList.contains("on"))close()});
}
function close(){el.classList.remove("on");document.documentElement.style.overflow=""}
function steps(n){[].forEach.call(el.querySelectorAll(".wdc-steps i"),function(i,k){i.classList.toggle("on",k<n)})}
function side(){
  var f=(P.features||[]).slice(0,5);
  $("#wdcSide").innerHTML='<h4>Your order</h4><div><div class="wdc-pn">'+esc(P.name)+'</div></div><div class="wdc-pp">৳'+Number(P.price||0).toLocaleString("en-US")+'<small>'+esc(P.period||"")+'</small></div><ul>'+f.map(function(x){return"<li>"+esc(x)+"</li>"}).join("")+'</ul><div class="wdc-sec">🔒 Secure checkout · Fast human confirmation</div>';
}
function methods(){
  var c=cfg(),m=[];
  if(safeUrl(c.gatewayUrl))m.push({id:"gw",ic:"💳",t:c.gatewayLabel||"Pay online",s:"Card, bKash, Nagad, bank — secure gateway"});
  if(c.bkash)m.push({id:"bkash",ic:"📱",t:"bKash",s:"Send money to "+c.bkash,num:c.bkash});
  if(c.nagad)m.push({id:"nagad",ic:"📲",t:"Nagad",s:"Send money to "+c.nagad,num:c.nagad});
  if(c.bank)m.push({id:"bank",ic:"🏦",t:"Bank transfer",s:"Account details",text:c.bank});
  if(!m.length)m.push({id:"wa",ic:"💬",t:"Pay via WhatsApp",s:"We send you the payment details right away"});
  return m;
}
function gwLink(){var c=cfg(),u=safeUrl(c.gatewayUrl);if(!u)return"";
  return u.replace(/\{amount\}/g,encodeURIComponent(P.price)).replace(/\{package\}/g,encodeURIComponent(P.name)).replace(/\{order\}/g,encodeURIComponent(state.order)).replace(/\{name\}/g,encodeURIComponent(state.name||"")).replace(/\{phone\}/g,encodeURIComponent(state.phone||""))}
function step1(){
  steps(1);
  $("#wdcBody").innerHTML='<div class="wdc-step on"><h3>Your details</h3><p class="wdc-sub">So we can set up your website and reach you.</p><label>Full name</label><input id="cn" autocomplete="name" placeholder="Your name" value="'+esc(state.name||"")+'"><div class="wdc-2"><div><label>Phone / WhatsApp</label><input id="cp" type="tel" autocomplete="tel" placeholder="01XXXXXXXXX" value="'+esc(state.phone||"")+'"></div><div><label>Email (optional)</label><input id="ce" type="email" autocomplete="email" placeholder="you@email.com" value="'+esc(state.email||"")+'"></div></div><label>Business / domain (optional)</label><input id="cb" placeholder="e.g. mybrand.com" value="'+esc(state.biz||"")+'"><div class="wdc-act"><button class="btn lime" id="n1" type="button">Continue to payment →</button></div></div>';
  $("#n1").onclick=function(){var n=$("#cn"),p=$("#cp");n.classList.toggle("bad",n.value.trim().length<2);p.classList.toggle("bad",p.value.replace(/\D/g,"").length<8);if($(".bad",el))return;
    state.name=n.value.trim();state.phone=p.value.trim();state.email=$("#ce").value.trim();state.biz=$("#cb").value.trim();step2()};
}
function step2(){
  steps(2);var ms=methods();state.method=state.method||ms[0].id;
  $("#wdcBody").innerHTML='<div class="wdc-step on"><h3>Choose payment</h3><p class="wdc-sub">Pick how you want to pay ৳'+Number(P.price).toLocaleString("en-US")+'.</p><div class="wdc-meth">'+ms.map(function(m){return'<button type="button" class="wdc-m'+(m.id===state.method?" on":"")+'" data-m="'+m.id+'"><span class="wdc-ic">'+m.ic+'</span><span><b>'+esc(m.t)+'</b><small>'+esc(m.s)+'</small></span></button>'}).join("")+'</div><div class="wdc-info" id="winfo"></div><div class="wdc-act"><button class="btn wdc-ghost" id="b2" type="button">← Back</button><button class="btn lime" id="n2" type="button"></button></div></div>';
  function paint(){var m=ms.filter(function(x){return x.id===state.method})[0],c=cfg(),i=$("#winfo"),b=$("#n2");
    [].forEach.call(el.querySelectorAll(".wdc-m"),function(x){x.classList.toggle("on",x.dataset.m===state.method)});
    i.classList.remove("on");
    if(m.id==="gw"){b.textContent="Open secure payment ↗";i.innerHTML="A secure payment page opens in a new tab. Come back here after paying and press <b>I have paid</b>.";i.classList.add("on")}
    else if(m.num){b.textContent="I have paid →";i.innerHTML="Send <b>৳"+Number(P.price).toLocaleString("en-US")+"</b> to <code data-copy=\""+esc(m.num)+"\">"+esc(m.num)+"</code> (tap to copy), then enter the Transaction ID on the next step."+(c.note?"<br>"+esc(c.note):"");i.classList.add("on")}
    else if(m.text){b.textContent="I have paid →";i.innerHTML=esc(m.text).replace(/\n/g,"<br>");i.classList.add("on")}
    else b.textContent="Continue on WhatsApp →";
  }
  paint();
  el.querySelector(".wdc-meth").onclick=function(e){var b=e.target.closest(".wdc-m");if(b){state.method=b.dataset.m;paint()}};
  $("#winfo").onclick=function(e){var c=e.target.closest("[data-copy]");if(c&&navigator.clipboard){navigator.clipboard.writeText(c.dataset.copy);c.textContent="Copied ✓"}};
  $("#b2").onclick=step1;
  $("#n2").onclick=function(){
    if(state.method==="gw"){var u=gwLink();if(u)window.open(u,"_blank","noopener");}
    if(state.method==="wa"){window.open("https://wa.me/"+wa()+"?text="+encodeURIComponent("Hello, I want the "+P.name+" package (৳"+P.price+"). Order "+state.order+". Name: "+state.name+", phone: "+state.phone),"_blank","noopener")}
    step3()};
}
function step3(){
  steps(3);
  $("#wdcBody").innerHTML='<div class="wdc-step on"><h3>Confirm payment</h3><p class="wdc-sub">Enter your payment details so we can verify and start building right away.</p><label>Transaction ID</label><input id="tx" placeholder="e.g. 9A7B2C3D4E" autocomplete="off"><label>Paid from (number / name)</label><input id="tf" placeholder="Number you paid from" value="'+esc(state.phone||"")+'"><div class="wdc-act"><button class="btn wdc-ghost" id="b3" type="button">← Back</button><button class="btn lime" id="n3" type="button">Confirm payment ✓</button></div></div>';
  $("#b3").onclick=step2;
  $("#n3").onclick=function(){var t=$("#tx");t.classList.toggle("bad",t.value.trim().length<4&&state.method!=="wa");if($(".bad",el))return;
    state.tx=t.value.trim();state.from=$("#tf").value.trim();done()};
}
function done(){
  steps(3);
  var o={order:state.order,pkg:P.name,price:P.price,name:state.name,phone:state.phone,email:state.email,biz:state.biz,method:state.method,tx:state.tx,from:state.from,at:new Date().toISOString()};
  try{var L=JSON.parse(localStorage.getItem("wdOrders")||"[]");L.push(o);localStorage.setItem("wdOrders",JSON.stringify(L.slice(-20)))}catch(e){}
  try{if(window.WDData)WDData.loadFirebase().then(function(f){if(f&&f.enabled)return f.addOrder(o)}).catch(function(){})}catch(e){}
  var msg="✅ Payment confirmation\nOrder: "+o.order+"\nPackage: "+P.name+" (৳"+P.price+(P.period||"")+")\nMethod: "+o.method+"\nTransaction ID: "+(o.tx||"-")+"\nPaid from: "+(o.from||"-")+"\nName: "+o.name+"\nPhone: "+o.phone+(o.email?"\nEmail: "+o.email:"")+(o.biz?"\nBusiness/domain: "+o.biz:"");
  var url="https://wa.me/"+wa()+"?text="+encodeURIComponent(msg);
  $("#wdcBody").innerHTML='<div class="wdc-step on wdc-ok"><div class="wdc-ring">✓</div><h3>Payment submitted</h3><p class="wdc-sub">Send the confirmation to our team on WhatsApp so we can verify it in minutes.</p><div class="wdc-ord">'+esc(o.order)+'</div><div class="wdc-act"><a class="btn lime" target="_blank" rel="noopener" href="'+url+'">Send confirmation on WhatsApp</a><button class="btn wdc-ghost" id="cl" type="button">Close</button></div></div>';
  $("#cl").onclick=close;
}
function open(p){
  if(!el)build();P=p;state={order:"WD-"+Date.now().toString(36).toUpperCase().slice(-6)};
  side();step1();el.classList.add("on");document.documentElement.style.overflow="hidden";
}
window.WDCheckout={open:open};
document.addEventListener("click",function(e){var b=e.target.closest("[data-wd-checkout]");if(!b)return;e.preventDefault();
  var id=b.getAttribute("data-wd-checkout"),list=window.WDPackages?WDPackages.get():[],p=list.filter(function(x){return String(x.id)===id})[0];if(p)open(p)});
})();
