import{s as c,g as l}from"./nsZmu0Fd.js";import{N as o,a1 as f,x as b,e as p,a2 as d,a3 as _}from"./C_nTGglK.js";let s=!1,i=Symbol();function y(e,n,r){const u=r[n]??(r[n]={store:null,source:b(void 0),unsubscribe:f});if(u.store!==e&&!(i in r))if(u.unsubscribe(),u.store=e??null,e==null)u.source.v=void 0,u.unsubscribe=f;else{var t=!0;u.unsubscribe=c(e,a=>{t?u.source.v=a:d(u.source,a)}),t=!1}return e&&i in r?l(e):p(u.source)}function m(){const e={};function n(){o(()=>{for(var r in e)e[r].unsubscribe();_(e,i,{enumerable:!1,value:!0})})}return[e,n]}function N(e){var n=s;try{return s=!1,[e(),s]}finally{s=n}}export{y as a,N as c,m as s};
