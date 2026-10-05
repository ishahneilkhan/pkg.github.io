/* Salah bar: edit times here (24h). */
(function(){var P=[["Fajr","04:45","🌙"],["Dhuhr","12:05","☀️"],["Asr","16:15","🌤"],["Maghrib","18:00","🌇"],["Isha","19:20","🌙"]];
function m(s){var p=s.split(":");return +p[0]*60+ +p[1]}
function go(){var d=new Date(),n=d.getHours()*60+d.getMinutes(),c=P.length-1;for(var i=0;i<P.length;i++){if(m(P[i][1])<=n)c=i}if(m(P[0][1])>n)c=P.length-1;var x=(c+1)%P.length,h='<span class="lbl">🕌 SALAH</span>';
P.forEach(function(p,i){h+='<span class="pt'+(i===c?' now':'')+'">'+p[2]+' <b>'+p[0]+'</b><span>'+p[1]+'</span></span>'});
var t=document.getElementById("times"),nx=document.getElementById("next");if(t)t.innerHTML=h;if(nx)nx.innerHTML='Next: <b>'+P[x][0]+'</b> · '+P[x][1]}
go();setInterval(go,60000)})();
