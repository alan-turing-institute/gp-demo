import{ad as v,ae as d,af as T,X as m,ag as p,ah as w,A as u,K as i,B as y,D as N}from"./Dk8vFEre.js";function h(r){var t=document.createElement("template");return t.innerHTML=r,t.content}function n(r,t){var e=m;e.nodes_start===null&&(e.nodes_start=r,e.nodes_end=t)}function M(r,t){var e=(t&p)!==0,_=(t&w)!==0,s,l=!r.startsWith("<!>");return()=>{if(u)return n(i,null),i;s===void 0&&(s=h(l?r:"<!>"+r),e||(s=d(s)));var a=_||T?document.importNode(s,!0):s.cloneNode(!0);if(e){var c=d(a),o=a.lastChild;n(c,o)}else n(a,a);return a}}function A(r,t,e="svg"){var _=!r.startsWith("<!>"),s=(t&p)!==0,l=`<${e}>${_?r:"<!>"+r}</${e}>`,a;return()=>{if(u)return n(i,null),i;if(!a){var c=h(l),o=d(c);if(s)for(a=document.createDocumentFragment();d(o);)a.appendChild(d(o));else a=d(o)}var f=a.cloneNode(!0);if(s){var g=d(f),E=f.lastChild;n(g,E)}else n(f,f);return f}}function D(r=""){if(!u){var t=v(r+"");return n(t,t),t}var e=i;return e.nodeType!==3&&(e.before(e=v()),N(e)),n(e,e),e}function L(){if(u)return n(i,null),i;var r=document.createDocumentFragment(),t=document.createComment(""),e=v();return r.append(t,e),n(t,e),r}function P(r,t){if(u){m.nodes_end=i,y();return}r!==null&&r.before(t)}const x="5";typeof window<"u"&&(window.__svelte||(window.__svelte={v:new Set})).v.add(x);export{P as a,n as b,L as c,D as d,h as e,A as n,M as t};
