import{t as pt,a as gt}from"../chunks/DDK9J2ve.js";import"../chunks/D6NYvkbl.js";import{p as At,l as It,j as zt,t as Ct,k as Vt,s as b,m as v,o as Et,g as l,q as A,v as S,w as p,n as Rt}from"../chunks/Dk8vFEre.js";import{e as tt,s as X}from"../chunks/DHzYZD1q.js";import{b as dt,i as Wt}from"../chunks/BgWHAIsa.js";import{l as ft,s as D,a as Ft,c as Gt}from"../chunks/BrztiYA3.js";import{i as qt}from"../chunks/xHnnKOVN.js";import{o as Xt}from"../chunks/B6DROYHl.js";import{r as Y,s as Dt,v as ht,z as vt,l as Yt,m as $t,a as Ht,d as Lt,b as Ot,e as Kt}from"../chunks/Bo287F7M.js";var Bt=pt('<button class="svelte-jwpglc">Clear Samples</button>'),Nt=pt('<main class="svelte-jwpglc"><h1 class="svelte-jwpglc">Astroid with Velocity Vector Explorer</h1> <div class="container svelte-jwpglc"><div class="panel svelte-jwpglc"><h2 class="svelte-jwpglc">Astroid Visualization</h2> <canvas class="svelte-jwpglc"></canvas></div> <div class="panel svelte-jwpglc"><h2 class="svelte-jwpglc">Energy Landscape</h2> <div class="contour-container svelte-jwpglc"><canvas></canvas></div> <div class="info svelte-jwpglc"><p class="svelte-jwpglc"> </p> <p class="svelte-jwpglc"> </p> <div class="instruction svelte-jwpglc"><p class="highlight svelte-jwpglc">Click on the plot above to add sample points and update the GP model</p></div> <div class="button-group svelte-jwpglc"><!> <button class="info-button svelte-jwpglc"> </button></div> <div class="energy-function svelte-jwpglc"><h3 class="svelte-jwpglc">About the Visualization:</h3> <p class="svelte-jwpglc"> </p> <p class="svelte-jwpglc">The energy function represents different stable conformations of the protein backbone. Darker regions indicate lower energy (more stable conformations).</p> <p class="svelte-jwpglc">Click directly on the plot to add sample points and build a GP model that learns this energy landscape.</p></div></div></div></div></main>');function ie(yt,ut){At(ut,!1);const j={primary:"#3c6382",accent:"#60a3bc",highlight:"#6a89cc",text:"#2c3e50"};let M=A(0),P=A(1),w=A([]),I=[],k=A(),z=A(),C=A(!1),V=A(!1);const h=400,d=400,n=40,et=h-2*n,R=ft().domain([0,360]).range([n,h-n]),W=ft().domain([.1,3]).range([d-n,n]);let u=1/0,x=-1/0;function mt(){const r=Y(0,360,7.2).toArray(),i=Y(.1,3,(3-.1)/50).toArray();for(const e of r)for(const o of i){const a=F(e,o);u=Math.min(u,a),x=Math.max(x,a)}u=Math.floor(u*10)/10,x=Math.ceil(x*10)/10,console.log(`Energy range: ${u} to ${x}`)}function F(t,r){const i=t*Math.PI/180,e=.5,o=-1.2,a=Math.cos(i),c=Math.sin(i),f=r*Math.cos(i+Math.PI/2),y=r*Math.sin(i+Math.PI/2),s=a-e,g=c-o,_=f,T=y,m=s*_+g*T,q=_*_+T*T;if(q<1e-4)return Math.sqrt(s*s+g*g);const Q=-m/q;let U;if(Q<=0)U=Math.sqrt(s*s+g*g);else{const ct=a+f*Q,rt=c+y*Q;U=Math.sqrt((ct-e)*(ct-e)+(rt-o)*(rt-o))}return Math.max(.1,U*2)}function bt(){S(w,[]),I=[],G()}function St(t){if(l(C))return;const r=l(z).getBoundingClientRect(),i=t.clientX-r.left,e=t.clientY-r.top;if(i>=n&&i<=h-n&&e>=n&&e<=d-n){const o=R.invert(i),a=W.invert(e);S(M,o),S(P,a);const c=F(l(M),l(P)),f=l(M)*Math.PI/180;S(w,[...l(w),{angle:f,velocity:l(P),energy:c}]),wt(),$()}}function wt(){if(S(C,!0),l(w).length===0){S(C,!1);return}setTimeout(()=>{const t=l(w).map(s=>[s.angle,s.velocity]),r=l(w).map(s=>s.energy),i=(s,g,_=1)=>{const T=Ht(Lt(Ot(s,g),2));return Kt(-.5*T/(_*_))},e=t.length,o=vt(e,e);for(let s=0;s<e;s++)for(let g=0;g<e;g++)o.set([s,g],i(t[s],t[g]));const a=.01;for(let s=0;s<e;s++)o.set([s,s],o.get([s,s])+a);const c=40,f=Y(0,2*Math.PI,2*Math.PI/c).toArray(),y=Y(.1,3,(3-.1)/c).toArray();I=[];for(const s of f)for(const g of y){const _=[s,g],T=vt(1,e);for(let m=0;m<e;m++)T.set([0,m],i(_,t[m]));try{const m=Yt(o,r),q=$t(T,m).get([0,0]);I.push({angle:s*180/Math.PI,velocity:g,predicted:q})}catch(m){console.error("Error in GP calculation:",m)}}G(),S(C,!1)},50)}function G(){if(!l(z))return;const t=l(z).getContext("2d");t.clearRect(0,0,h,d);const r=Dt(ht).domain([x,u]).interpolator(ht);if(l(V)||I.length===0){const e=et/80;for(let o=0;o<80;o++)for(let a=0;a<80;a++){const c=360*o/80,f=.1+(3-.1)*a/80,y=F(c,f),s=R(c),g=W(f);t.fillStyle=r(y),t.fillRect(s-e/2,g-e/2,e,e)}}else{const i=et/Math.sqrt(I.length);I.forEach(e=>{const o=R(e.angle),a=W(e.velocity);t.fillStyle=r(e.predicted),t.fillRect(o-i/2,a-i/2,i,i)})}xt(t,r),t.strokeStyle=j.primary,t.lineWidth=2,t.beginPath(),t.moveTo(n,d-n),t.lineTo(h-n,d-n),t.moveTo(n,n),t.lineTo(n,d-n),t.stroke(),t.fillStyle=j.text,t.font="bold 14px Arial, sans-serif",t.textAlign="center",t.fillText("0°",n,d-n+15),t.fillText("180°",h/2,d-n+15),t.fillText("360°",h-n,d-n+15),t.fillText("Angle",h-n+15,d-n+5),t.textAlign="right",t.fillText("0.1",n-5,d-n),t.fillText("1.55",n-5,d/2),t.fillText("3",n-5,n),t.fillText("Velocity",n-15,n-10),l(w).forEach(i=>{const e=R(i.angle*180/Math.PI),o=W(i.velocity),a=8,c=t.createRadialGradient(e,o,2,e,o,a);c.addColorStop(0,j.highlight),c.addColorStop(1,"rgba(106, 137, 204, 0)"),t.fillStyle=c,t.beginPath(),t.arc(e,o,a,0,2*Math.PI),t.fill(),t.fillStyle=j.accent,t.beginPath(),t.arc(e,o,4,0,2*Math.PI),t.fill(),t.strokeStyle=j.primary,t.lineWidth=1,t.stroke()})}function xt(t,r){const e=d-2*n,o=h-n+20,a=n,c=100,f=e/c;for(let s=0;s<c;s++){const g=u+(x-u)*(c-s-1)/c;t.fillStyle=r(g),t.fillRect(o,a+s*f,20,f+1)}t.strokeStyle=j.text,t.lineWidth=1,t.strokeRect(o,a,20,e),t.fillStyle=j.text,t.font="12px Arial, sans-serif",t.textAlign="left",t.fillText(u.toFixed(1),o+20+5,a+e),t.fillText(x.toFixed(1),o+20+5,a);const y=(u+x)/2;t.fillText(y.toFixed(1),o+20+5,a+e/2),t.save(),t.translate(o+20+25,a+e/2),t.rotate(-Math.PI/2),t.textAlign="center",t.fillText("Distance to Earth",0,0),t.restore()}function $(){if(!l(k))return;const t=l(k).getContext("2d");t.clearRect(0,0,h,d);const r=h/2,i=d/2,e=120;t.save(),t.translate(r,i),t.rotate(l(M)*Math.PI/180),t.beginPath();for(let c=0;c<=2*Math.PI;c+=.01){const f=e*Math.pow(Math.cos(c),3),y=e*Math.pow(Math.sin(c),3);c===0?t.moveTo(f,y):t.lineTo(f,y)}t.closePath(),t.fillStyle="rgba(200,200,200,0.3)",t.fill(),t.strokeStyle="#333",t.lineWidth=2,t.stroke();const o=l(P)*50;t.strokeStyle="#cc0000",t.lineWidth=2,t.beginPath(),t.moveTo(e,0),t.lineTo(e+o,0),t.stroke();const a=8;t.beginPath(),t.moveTo(e+o,0),t.lineTo(e+o-a,-8/2),t.lineTo(e+o-a,a/2),t.closePath(),t.fillStyle="#cc0000",t.fill(),t.fillStyle="#0066cc",t.beginPath(),t.arc(0,0,5,0,2*Math.PI),t.fill(),t.fillStyle="#00cc00",t.beginPath(),t.arc(e,0,5,0,2*Math.PI),t.fill(),t.restore(),t.fillStyle="#000",t.font="14px Arial",t.textAlign="left",t.fillText(`Angle: ${l(M)}°`,20,30),t.fillText(`Velocity: ${l(P).toFixed(2)}`,20,50)}function Mt(){S(V,!l(V)),G()}Xt(()=>{console.log("Astroid canvas:",l(k)),console.log("Contour canvas:",l(z)),mt(),$(),G()}),It(()=>(l(k),l(M),l(P)),()=>{l(k)&&(l(M)!==void 0||l(P)!==void 0)&&$()}),zt(),qt();var H=Nt(),lt=b(v(H),2),L=v(lt),O=b(v(L),2);D(O,"width",h),D(O,"height",d),dt(O,t=>S(k,t),()=>l(k)),p(L);var ot=b(L,2),K=b(v(ot),2),E=v(K);D(E,"width",h+60),D(E,"height",d),dt(E,t=>S(z,t),()=>l(z)),p(K);var nt=b(K,2),B=v(nt),Pt=v(B);p(B);var N=b(B,2),_t=v(N);p(N);var Z=b(N,4),st=v(Z);{var Tt=t=>{var r=Bt();tt("click",r,bt),gt(t,r)};Wt(st,t=>{l(w).length>0&&t(Tt)})}var J=b(st,2),jt=v(J,!0);p(J),p(Z);var at=b(Z,2),it=b(v(at),2),kt=v(it,!0);p(it),Rt(4),p(at),p(nt),p(ot),p(lt),p(H),Ct(t=>{Ft(E,1,Gt(l(C)?"loading":""),"svelte-jwpglc"),X(Pt,`Samples: ${l(w).length??""}`),X(_t,`Current energy: ${t??""}`),X(jt,l(V)?"Show GP Prediction":"Show Energy Function"),X(kt,l(V)?"Showing actual energy function":"Showing Gaussian Process prediction")},[()=>F(l(M),l(P)).toFixed(2)],Et),tt("click",E,St),tt("click",J,Mt),gt(yt,H),Vt()}export{ie as component};
