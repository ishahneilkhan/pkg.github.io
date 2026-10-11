/* Website Deals - shared admin sidebar + mobile bar + auth guard. Usage: <div id="wdShell" data-active="dashboard"></div> */
(function(){
if(sessionStorage.getItem("websiteDealsAdminAuth")!=="true"){location.replace("./login.html");return}
var N=[["dashboard","⌂","Dashboard"],["orders","◫","Orders"],["packages","◈","Packages"],["websites","▣","Websites"],["presentation","▶","Presentation"],["homepage","⌁","Homepage"],["site-editor","✦","Site Editor"],["banners","▤","Banners"],["settings","⚙","Settings"]];
var host=document.getElementById("wdShell"),act=host.getAttribute("data-active");
var links=N.map(function(n){return'<a href="./'+n[0]+'.html" class="'+(n[0]===act?"active":"")+'"><span class="nav-icon">'+n[1]+'</span>'+n[2]+(n[0]==="orders"?'<span class="badge" id="ordBadge"></span>':"")+'</a>'}).join("");
var side=document.createElement("aside");side.className="sidebar";
side.innerHTML='<div class="brand"><div class="brand-mark">WD</div><div><strong>Website Deals</strong><span>Admin Control Center</span></div></div><div class="nav-label">Manage</div><nav class="nav">'+links+'</nav><div class="nav-label">Quick access</div><nav class="nav"><a href="../index.html" target="_blank" rel="noopener"><span class="nav-icon">↗</span>Open website</a><a href="../presentation/index.html" target="_blank" rel="noopener"><span class="nav-icon">◉</span>Live presentation</a></nav><div class="side-foot"><span>Signed in as</span><b id="wdUser">Admin</b><button id="wdOut" type="button">Sign out</button></div>';
var mt=document.createElement("nav");mt.className="mtop";mt.innerHTML=N.map(function(n){return'<a href="./'+n[0]+'.html" class="'+(n[0]===act?"active":"")+'">'+n[2]+'</a>'}).join("");
document.body.insertBefore(mt,document.body.firstChild);document.body.insertBefore(side,document.body.firstChild);
try{var u=sessionStorage.getItem("websiteDealsAdminUser");if(u)document.getElementById("wdUser").textContent=u}catch(e){}
document.getElementById("wdOut").onclick=function(){try{sessionStorage.removeItem("websiteDealsAdminAuth");sessionStorage.removeItem("websiteDealsAdminUser")}catch(e){}location.replace("./login.html")};
})();
