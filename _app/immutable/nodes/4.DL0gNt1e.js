import{t as ft,a as nt}from"../chunks/Dl42bQaK.js";import"../chunks/Cns6LDpP.js";import{a5 as kt,ab as At,ac as zt,aa as Ct,a6 as Et,s as u,a7 as g,i as Vt,e as i,ad as A,a2 as m,a8 as p,a9 as It}from"../chunks/C_nTGglK.js";import{e as Q,s as L}from"../chunks/D15B_ygG.js";import{i as Wt}from"../chunks/BiG_kpbh.js";import{s as q}from"../chunks/CThLS2ih.js";import{l as st,s as Rt,c as Ft}from"../chunks/CSJ2tm9-.js";import{b as rt}from"../chunks/BOcuyyEv.js";import{i as Gt}from"../chunks/-d2lr63c.js";import{o as $t}from"../chunks/BfnemT7e.js";import{r as X,s as Ht,v as ct,z as dt,l as Lt,m as qt}from"../chunks/Di72JI2_.js";var Xt=ft('<button class="svelte-i0d8w">Clear Samples</button>'),jt=ft('<main class="svelte-i0d8w"><h1 class="svelte-i0d8w">Astroid with Velocity Vector Explorer</h1> <div class="container svelte-i0d8w"><div class="panel svelte-i0d8w"><h2 class="svelte-i0d8w">Astroid Visualization</h2> <canvas class="svelte-i0d8w"></canvas></div> <div class="panel svelte-i0d8w"><h2 class="svelte-i0d8w">Energy Landscape</h2> <div class="contour-container svelte-i0d8w"><canvas></canvas></div> <div class="info svelte-i0d8w"><p class="svelte-i0d8w"> </p> <p class="svelte-i0d8w"> </p> <div class="instruction svelte-i0d8w"><p class="highlight svelte-i0d8w">Click on the plot above to add sample points and update the GP model</p></div> <div class="button-group svelte-i0d8w"><!> <button class="info-button svelte-i0d8w"> </button></div> <div class="energy-function svelte-i0d8w"><h3 class="svelte-i0d8w">About the Visualization:</h3> <p class="svelte-i0d8w"> </p> <p class="svelte-i0d8w">The energy function (flyby distance) represents the closest approach distance given an object’s hyperbolic speed and impact parameter. A value of 0 indicates a collision with Earth.</p> <p class="svelte-i0d8w">Click directly on the plot to add sample points and build a GP model that learns this landscape.</p></div></div></div></div></main>');function ee(vt,ht){kt(ht,!1);const P={primary:"#3c6382",accent:"#60a3bc",highlight:"#6a89cc",text:"#2c3e50"};let _=A(5e3),x=A(3),b=A([]),z=[],k=A(),C=A(),V=A(!1),I=A(!1);const T=6371;function gt(t,r,d=398600.4418,e=6371){const a=Math.sqrt(1+Math.pow(r,2)*Math.pow(t,4)/Math.pow(d,2)),l=d*(a-1)/Math.pow(t,2);return l>=e?l:0}function F(t,r){return gt(r,t)}const h=400,c=400,o=40,U=h-2*o,G=st().domain([5e3,5*T]).range([o,h-o]),$=st().domain([3,20]).range([c-o,o]);let y=1/0,S=-1/0;function pt(){const r=X(5e3,5*T,(5*T-5e3)/50).toArray(),d=X(3,20,17/50).toArray();for(const e of r)for(const a of d){const l=F(e,a);y=Math.min(y,l),S=Math.max(S,l)}y=Math.floor(y*10)/10,S=Math.ceil(S*10)/10,console.log(`Energy range: ${y} to ${S}`)}function yt(){m(b,[]),z=[],H()}function ut(t){if(i(V))return;const r=i(C).getBoundingClientRect(),d=t.clientX-r.left,e=t.clientY-r.top;if(d>=o&&d<=h-o&&e>=o&&e<=c-o){const a=G.invert(d),l=$.invert(e);m(_,a),m(x,l);const s=F(i(_),i(x));m(b,[...i(b),{angle:i(_),velocity:i(x),energy:s}]),mt(),j()}}function mt(){if(m(V,!0),i(b).length===0){m(V,!1);return}setTimeout(()=>{const t=i(b).map(n=>[n.angle,n.velocity]),r=i(b).map(n=>n.energy),d=(n,v)=>{const E=(n[0]-v[0])/1e4,R=(n[1]-v[1])/5;return Math.exp(-.5*(E*E+R*R))},e=t.length,a=dt(e,e);for(let n=0;n<e;n++)for(let v=0;v<e;v++)a.set([n,v],d(t[n],t[v]));const l=.01;for(let n=0;n<e;n++)a.set([n,n],a.get([n,n])+l);const s=40,f=X(5e3,5*T,(5*T-5e3)/s).toArray(),w=X(3,20,17/s).toArray();z=[];for(const n of f)for(const v of w){const E=[n,v],R=dt(1,e);for(let M=0;M<e;M++)R.set([0,M],d(E,t[M]));try{const M=Lt(a,r),Pt=qt(R,M).get([0,0]);z.push({angle:n,velocity:v,predicted:Pt})}catch(M){console.error("Error in GP calculation:",M)}}H(),m(V,!1)},50)}function H(){if(!i(C))return;const t=i(C).getContext("2d");t.clearRect(0,0,h,c);const r=Ht(ct).domain([S,y]).interpolator(ct);if(i(I)||z.length===0){const a=U/80;for(let l=0;l<80;l++)for(let s=0;s<80;s++){const f=5e3+(5*T-5e3)*l/80,w=3+17*s/80,n=F(f,w),v=G(f),E=$(w);t.fillStyle=r(n),t.fillRect(v-a/2,E-a/2,a,a)}}else{const e=U/Math.sqrt(z.length);z.forEach(a=>{const l=G(a.angle),s=$(a.velocity);t.fillStyle=r(a.predicted),t.fillRect(l-e/2,s-e/2,e,e)})}bt(t,r),t.strokeStyle=P.primary,t.lineWidth=2,t.beginPath(),t.moveTo(o,c-o),t.lineTo(h-o,c-o),t.moveTo(o,o),t.lineTo(o,c-o),t.stroke(),t.fillStyle=P.text,t.font="bold 14px Arial, sans-serif",t.textAlign="center";const d=Math.round((5e3+5*T)/2);t.fillText("5000",o,c-o+15),t.fillText(d.toString(),h/2,c-o+15),t.fillText(String(5*T),h-o,c-o+15),t.fillText("impact parameter (km)",h-o+15,c-o+5),t.textAlign="right",t.fillText("3",o-5,c-o),t.fillText("11.5",o-5,c/2),t.fillText("20",o-5,o),t.fillText("Velocity (km/s)",o-15,o-10),i(b).forEach(e=>{const a=G(e.angle),l=$(e.velocity),s=8,f=t.createRadialGradient(a,l,2,a,l,s);f.addColorStop(0,P.highlight),f.addColorStop(1,"rgba(106, 137, 204, 0)"),t.fillStyle=f,t.beginPath(),t.arc(a,l,s,0,2*Math.PI),t.fill(),t.fillStyle=P.accent,t.beginPath(),t.arc(a,l,4,0,2*Math.PI),t.fill(),t.strokeStyle=P.primary,t.lineWidth=1,t.stroke()})}function bt(t,r){const e=c-2*o,a=h-o+20,l=o,s=100,f=e/s;for(let n=0;n<s;n++){const v=y+(S-y)*(s-n-1)/s;t.fillStyle=r(v),t.fillRect(a,l+n*f,20,f+1)}t.strokeStyle=P.text,t.lineWidth=1,t.strokeRect(a,l,20,e),t.fillStyle=P.text,t.font="12px Arial, sans-serif",t.textAlign="left",t.fillText(y.toFixed(1),a+20+5,l+e),t.fillText(S.toFixed(1),a+20+5,l);const w=(y+S)/2;t.fillText(w.toFixed(1),a+20+5,l+e/2),t.save(),t.translate(a+20+25,l+e/2),t.rotate(-Math.PI/2),t.textAlign="center",t.fillText("Distance to Earth",0,0),t.restore()}function j(){if(!i(k))return;const t=i(k).getContext("2d");t.clearRect(0,0,h,c);const r=h/2,d=c/2,e=120;t.save(),t.translate(r,d),t.rotate(i(_)*Math.PI/180),t.beginPath();for(let s=0;s<=2*Math.PI;s+=.01){const f=e*Math.pow(Math.cos(s),3),w=e*Math.pow(Math.sin(s),3);s===0?t.moveTo(f,w):t.lineTo(f,w)}t.closePath(),t.fillStyle="rgba(200,200,200,0.3)",t.fill(),t.strokeStyle="#333",t.lineWidth=2,t.stroke();const a=i(x)*50;t.strokeStyle="#cc0000",t.lineWidth=2,t.beginPath(),t.moveTo(e,0),t.lineTo(e+a,0),t.stroke();const l=8;t.beginPath(),t.moveTo(e+a,0),t.lineTo(e+a-l,-8/2),t.lineTo(e+a-l,l/2),t.closePath(),t.fillStyle="#cc0000",t.fill(),t.fillStyle="#0066cc",t.beginPath(),t.arc(0,0,5,0,2*Math.PI),t.fill(),t.fillStyle="#00cc00",t.beginPath(),t.arc(e,0,5,0,2*Math.PI),t.fill(),t.restore(),t.fillStyle="#000",t.font="14px Arial",t.textAlign="left",t.fillText(`impact parameter: ${i(_).toFixed(0)} km`,20,30),t.fillText(`Velocity: ${i(x).toFixed(2)} km/s`,20,50)}function St(){m(I,!i(I)),H()}$t(()=>{console.log("Astroid canvas:",i(k)),console.log("Contour canvas:",i(C)),pt(),j(),H()}),At(()=>(i(k),i(_),i(x)),()=>{i(k)&&(i(_)!==void 0||i(x)!==void 0)&&j()}),zt(),Gt();var B=jt(),tt=u(g(B),2),O=g(tt),Y=u(g(O),2);q(Y,"width",h),q(Y,"height",c),rt(Y,t=>m(k,t),()=>i(k)),p(O);var et=u(O,2),D=u(g(et),2),W=g(D);q(W,"width",h+60),q(W,"height",c),rt(W,t=>m(C,t),()=>i(C)),p(D);var it=u(D,2),K=g(it),wt=g(K);p(K);var N=u(K,2),_t=g(N);p(N);var Z=u(N,4),at=g(Z);{var xt=t=>{var r=Xt();Q("click",r,yt),nt(t,r)};Wt(at,t=>{i(b).length>0&&t(xt)})}var J=u(at,2),Tt=g(J,!0);p(J),p(Z);var ot=u(Z,2),lt=u(g(ot),2),Mt=g(lt,!0);p(lt),It(4),p(ot),p(it),p(et),p(tt),p(B),Ct(t=>{Rt(W,1,Ft(i(V)?"loading":""),"svelte-i0d8w"),L(wt,`Samples: ${i(b).length??""}`),L(_t,`Current energy: ${t??""}`),L(Tt,i(I)?"Show GP Prediction":"Show Energy Function"),L(Mt,i(I)?"Showing actual energy function":"Showing Gaussian Process prediction")},[()=>F(i(_),i(x)).toFixed(2)],Vt),Q("click",W,ut),Q("click",J,St),nt(vt,B),Et()}export{ee as component};
