import{m as G,aw as Dn,V as Bn,ax as Gn,ay as Vn}from"./eDbGWMUz.js";import{a as Xn}from"./DgiF_L6T.js";function Hn(n){var r,e,t="";if(typeof n=="string"||typeof n=="number")t+=n;else if(typeof n=="object")if(Array.isArray(n)){var i=n.length;for(r=0;r<i;r++)n[r]&&(e=Hn(n[r]))&&(t&&(t+=" "),t+=e)}else for(e in n)n[e]&&(t&&(t+=" "),t+=e);return t}function Yn(){for(var n,r,e=0,t="",i=arguments.length;e<i;e++)(n=arguments[e])&&(r=Hn(n))&&(t&&(t+=" "),t+=r);return t}function re(n){return typeof n=="object"?Yn(n):n??""}const dn=[...` 	
\r\f \v\uFEFF`];function Kn(n,r,e){var t=n==null?"":""+n;if(r&&(t=t?t+" "+r:r),e){for(var i in e)if(e[i])t=t?t+" "+i:i;else if(t.length)for(var o=i.length,f=0;(f=t.indexOf(i,f))>=0;){var a=f+o;(f===0||dn.includes(t[f-1]))&&(a===t.length||dn.includes(t[a]))?t=(f===0?"":t.substring(0,f))+t.substring(a+1):f=a}}return t===""?null:t}function ee(n,r,e,t,i,o){var f=n.__className;if(G||f!==e){var a=Kn(e,t,o);(!G||a!==n.getAttribute("class"))&&(a==null?n.removeAttribute("class"):r?n.className=a:n.setAttribute("class",a)),n.__className=e}else if(o){i??(i={});for(var s in o){var u=!!o[s];u!==!!i[s]&&n.classList.toggle(s,u)}}return o}function te(n){if(G){var r=!1,e=()=>{if(!r){if(r=!0,n.hasAttribute("value")){var t=n.value;gn(n,"value",null),n.value=t}if(n.hasAttribute("checked")){var i=n.checked;gn(n,"checked",null),n.checked=i}}};n.__on_r=e,Vn(e),Xn()}}function gn(n,r,e,t){var i=n.__attributes??(n.__attributes={});G&&(i[r]=n.getAttribute(r),r==="src"||r==="srcset"||r==="href"&&n.nodeName==="LINK")||i[r]!==(i[r]=e)&&(r==="style"&&"__styles"in n&&(n.__styles={}),r==="loading"&&(n[Dn]=e),e==null?n.removeAttribute(r):typeof e!="string"&&Un(n).includes(r)?n[r]=e:n.setAttribute(r,e))}var xn=new Map;function Un(n){var r=xn.get(n.nodeName);if(r)return r;xn.set(n.nodeName,r=[]);for(var e,t=n,i=Element.prototype;i!==t;){e=Gn(t);for(var o in e)e[o].set&&r.push(o);t=Bn(t)}return r}function B(n,r){return n==null||r==null?NaN:n<r?-1:n>r?1:n>=r?0:NaN}function Zn(n,r){return n==null||r==null?NaN:r<n?-1:r>n?1:r>=n?0:NaN}function En(n){let r,e,t;n.length!==2?(r=B,e=(a,s)=>B(n(a),s),t=(a,s)=>n(a)-s):(r=n===B||n===Zn?n:Jn,e=n,t=n);function i(a,s,u=0,l=a.length){if(u<l){if(r(s,s)!==0)return l;do{const c=u+l>>>1;e(a[c],s)<0?u=c+1:l=c}while(u<l)}return u}function o(a,s,u=0,l=a.length){if(u<l){if(r(s,s)!==0)return l;do{const c=u+l>>>1;e(a[c],s)<=0?u=c+1:l=c}while(u<l)}return u}function f(a,s,u=0,l=a.length){const c=i(a,s,u,l-1);return c>u&&t(a[c-1],s)>-t(a[c],s)?c-1:c}return{left:i,center:f,right:o}}function Jn(){return 0}function Qn(n){return n===null?NaN:+n}const Wn=En(B),nr=Wn.right;En(Qn).center;const rr=Math.sqrt(50),er=Math.sqrt(10),tr=Math.sqrt(2);function V(n,r,e){const t=(r-n)/Math.max(0,e),i=Math.floor(Math.log10(t)),o=t/Math.pow(10,i),f=o>=rr?10:o>=er?5:o>=tr?2:1;let a,s,u;return i<0?(u=Math.pow(10,-i)/f,a=Math.round(n*u),s=Math.round(r*u),a/u<n&&++a,s/u>r&&--s,u=-u):(u=Math.pow(10,i)*f,a=Math.round(n/u),s=Math.round(r/u),a*u<n&&++a,s*u>r&&--s),s<a&&.5<=e&&e<2?V(n,r,e*2):[a,s,u]}function ir(n,r,e){if(r=+r,n=+n,e=+e,!(e>0))return[];if(n===r)return[n];const t=r<n,[i,o,f]=t?V(r,n,e):V(n,r,e);if(!(o>=i))return[];const a=o-i+1,s=new Array(a);if(t)if(f<0)for(let u=0;u<a;++u)s[u]=(o-u)/-f;else for(let u=0;u<a;++u)s[u]=(o-u)*f;else if(f<0)for(let u=0;u<a;++u)s[u]=(i+u)/-f;else for(let u=0;u<a;++u)s[u]=(i+u)*f;return s}function nn(n,r,e){return r=+r,n=+n,e=+e,V(n,r,e)[2]}function fr(n,r,e){r=+r,n=+n,e=+e;const t=r<n,i=t?nn(r,n,e):nn(n,r,e);return(t?-1:1)*(i<0?1/-i:i)}function ar(n,r){switch(arguments.length){case 0:break;case 1:this.range(n);break;default:this.range(r).domain(n);break}return this}function ie(n,r){switch(arguments.length){case 0:break;case 1:{typeof n=="function"?this.interpolator(n):this.range(n);break}default:{this.domain(n),typeof r=="function"?this.interpolator(r):this.range(r);break}}return this}function fn(n,r,e){n.prototype=r.prototype=e,e.constructor=n}function Pn(n,r){var e=Object.create(n.prototype);for(var t in r)e[t]=r[t];return e}function z(){}var P=.7,X=1/P,S="\\s*([+-]?\\d+)\\s*",q="\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",y="\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",or=/^#([0-9a-f]{3,8})$/,ur=new RegExp(`^rgb\\(${S},${S},${S}\\)$`),sr=new RegExp(`^rgb\\(${y},${y},${y}\\)$`),cr=new RegExp(`^rgba\\(${S},${S},${S},${q}\\)$`),lr=new RegExp(`^rgba\\(${y},${y},${y},${q}\\)$`),hr=new RegExp(`^hsl\\(${q},${y},${y}\\)$`),dr=new RegExp(`^hsla\\(${q},${y},${y},${q}\\)$`),mn={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074};fn(z,I,{copy(n){return Object.assign(new this.constructor,this,n)},displayable(){return this.rgb().displayable()},hex:bn,formatHex:bn,formatHex8:gr,formatHsl:xr,formatRgb:pn,toString:pn});function bn(){return this.rgb().formatHex()}function gr(){return this.rgb().formatHex8()}function xr(){return qn(this).formatHsl()}function pn(){return this.rgb().formatRgb()}function I(n){var r,e;return n=(n+"").trim().toLowerCase(),(r=or.exec(n))?(e=r[1].length,r=parseInt(r[1],16),e===6?yn(r):e===3?new g(r>>8&15|r>>4&240,r>>4&15|r&240,(r&15)<<4|r&15,1):e===8?F(r>>24&255,r>>16&255,r>>8&255,(r&255)/255):e===4?F(r>>12&15|r>>8&240,r>>8&15|r>>4&240,r>>4&15|r&240,((r&15)<<4|r&15)/255):null):(r=ur.exec(n))?new g(r[1],r[2],r[3],1):(r=sr.exec(n))?new g(r[1]*255/100,r[2]*255/100,r[3]*255/100,1):(r=cr.exec(n))?F(r[1],r[2],r[3],r[4]):(r=lr.exec(n))?F(r[1]*255/100,r[2]*255/100,r[3]*255/100,r[4]):(r=hr.exec(n))?Nn(r[1],r[2]/100,r[3]/100,1):(r=dr.exec(n))?Nn(r[1],r[2]/100,r[3]/100,r[4]):mn.hasOwnProperty(n)?yn(mn[n]):n==="transparent"?new g(NaN,NaN,NaN,0):null}function yn(n){return new g(n>>16&255,n>>8&255,n&255,1)}function F(n,r,e,t){return t<=0&&(n=r=e=NaN),new g(n,r,e,t)}function mr(n){return n instanceof z||(n=I(n)),n?(n=n.rgb(),new g(n.r,n.g,n.b,n.opacity)):new g}function rn(n,r,e,t){return arguments.length===1?mr(n):new g(n,r,e,t??1)}function g(n,r,e,t){this.r=+n,this.g=+r,this.b=+e,this.opacity=+t}fn(g,rn,Pn(z,{brighter(n){return n=n==null?X:Math.pow(X,n),new g(this.r*n,this.g*n,this.b*n,this.opacity)},darker(n){return n=n==null?P:Math.pow(P,n),new g(this.r*n,this.g*n,this.b*n,this.opacity)},rgb(){return this},clamp(){return new g(k(this.r),k(this.g),k(this.b),Y(this.opacity))},displayable(){return-.5<=this.r&&this.r<255.5&&-.5<=this.g&&this.g<255.5&&-.5<=this.b&&this.b<255.5&&0<=this.opacity&&this.opacity<=1},hex:wn,formatHex:wn,formatHex8:br,formatRgb:Mn,toString:Mn}));function wn(){return`#${$(this.r)}${$(this.g)}${$(this.b)}`}function br(){return`#${$(this.r)}${$(this.g)}${$(this.b)}${$((isNaN(this.opacity)?1:this.opacity)*255)}`}function Mn(){const n=Y(this.opacity);return`${n===1?"rgb(":"rgba("}${k(this.r)}, ${k(this.g)}, ${k(this.b)}${n===1?")":`, ${n})`}`}function Y(n){return isNaN(n)?1:Math.max(0,Math.min(1,n))}function k(n){return Math.max(0,Math.min(255,Math.round(n)||0))}function $(n){return n=k(n),(n<16?"0":"")+n.toString(16)}function Nn(n,r,e,t){return t<=0?n=r=e=NaN:e<=0||e>=1?n=r=NaN:r<=0&&(n=NaN),new b(n,r,e,t)}function qn(n){if(n instanceof b)return new b(n.h,n.s,n.l,n.opacity);if(n instanceof z||(n=I(n)),!n)return new b;if(n instanceof b)return n;n=n.rgb();var r=n.r/255,e=n.g/255,t=n.b/255,i=Math.min(r,e,t),o=Math.max(r,e,t),f=NaN,a=o-i,s=(o+i)/2;return a?(r===o?f=(e-t)/a+(e<t)*6:e===o?f=(t-r)/a+2:f=(r-e)/a+4,a/=s<.5?o+i:2-o-i,f*=60):a=s>0&&s<1?0:f,new b(f,a,s,n.opacity)}function pr(n,r,e,t){return arguments.length===1?qn(n):new b(n,r,e,t??1)}function b(n,r,e,t){this.h=+n,this.s=+r,this.l=+e,this.opacity=+t}fn(b,pr,Pn(z,{brighter(n){return n=n==null?X:Math.pow(X,n),new b(this.h,this.s,this.l*n,this.opacity)},darker(n){return n=n==null?P:Math.pow(P,n),new b(this.h,this.s,this.l*n,this.opacity)},rgb(){var n=this.h%360+(this.h<0)*360,r=isNaN(n)||isNaN(this.s)?0:this.s,e=this.l,t=e+(e<.5?e:1-e)*r,i=2*e-t;return new g(Q(n>=240?n-240:n+120,i,t),Q(n,i,t),Q(n<120?n+240:n-120,i,t),this.opacity)},clamp(){return new b(vn(this.h),T(this.s),T(this.l),Y(this.opacity))},displayable(){return(0<=this.s&&this.s<=1||isNaN(this.s))&&0<=this.l&&this.l<=1&&0<=this.opacity&&this.opacity<=1},formatHsl(){const n=Y(this.opacity);return`${n===1?"hsl(":"hsla("}${vn(this.h)}, ${T(this.s)*100}%, ${T(this.l)*100}%${n===1?")":`, ${n})`}`}}));function vn(n){return n=(n||0)%360,n<0?n+360:n}function T(n){return Math.max(0,Math.min(1,n||0))}function Q(n,r,e){return(n<60?r+(e-r)*n/60:n<180?e:n<240?r+(e-r)*(240-n)/60:r)*255}const an=n=>()=>n;function yr(n,r){return function(e){return n+e*r}}function wr(n,r,e){return n=Math.pow(n,e),r=Math.pow(r,e)-n,e=1/e,function(t){return Math.pow(n+t*r,e)}}function Mr(n){return(n=+n)==1?In:function(r,e){return e-r?wr(r,e,n):an(isNaN(r)?e:r)}}function In(n,r){var e=r-n;return e?yr(n,e):an(isNaN(n)?r:n)}const $n=function n(r){var e=Mr(r);function t(i,o){var f=e((i=rn(i)).r,(o=rn(o)).r),a=e(i.g,o.g),s=e(i.b,o.b),u=In(i.opacity,o.opacity);return function(l){return i.r=f(l),i.g=a(l),i.b=s(l),i.opacity=u(l),i+""}}return t.gamma=n,t}(1);function Nr(n,r){r||(r=[]);var e=n?Math.min(r.length,n.length):0,t=r.slice(),i;return function(o){for(i=0;i<e;++i)t[i]=n[i]*(1-o)+r[i]*o;return t}}function vr(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function $r(n,r){var e=r?r.length:0,t=n?Math.min(e,n.length):0,i=new Array(t),o=new Array(e),f;for(f=0;f<t;++f)i[f]=on(n[f],r[f]);for(;f<e;++f)o[f]=r[f];return function(a){for(f=0;f<t;++f)o[f]=i[f](a);return o}}function kr(n,r){var e=new Date;return n=+n,r=+r,function(t){return e.setTime(n*(1-t)+r*t),e}}function K(n,r){return n=+n,r=+r,function(e){return n*(1-e)+r*e}}function Ar(n,r){var e={},t={},i;(n===null||typeof n!="object")&&(n={}),(r===null||typeof r!="object")&&(r={});for(i in r)i in n?e[i]=on(n[i],r[i]):t[i]=r[i];return function(o){for(i in e)t[i]=e[i](o);return t}}var en=/[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,W=new RegExp(en.source,"g");function _r(n){return function(){return n}}function Rr(n){return function(r){return n(r)+""}}function Sr(n,r){var e=en.lastIndex=W.lastIndex=0,t,i,o,f=-1,a=[],s=[];for(n=n+"",r=r+"";(t=en.exec(n))&&(i=W.exec(r));)(o=i.index)>e&&(o=r.slice(e,o),a[f]?a[f]+=o:a[++f]=o),(t=t[0])===(i=i[0])?a[f]?a[f]+=i:a[++f]=i:(a[++f]=null,s.push({i:f,x:K(t,i)})),e=W.lastIndex;return e<r.length&&(o=r.slice(e),a[f]?a[f]+=o:a[++f]=o),a.length<2?s[0]?Rr(s[0].x):_r(r):(r=s.length,function(u){for(var l=0,c;l<r;++l)a[(c=s[l]).i]=c.x(u);return a.join("")})}function on(n,r){var e=typeof r,t;return r==null||e==="boolean"?an(r):(e==="number"?K:e==="string"?(t=I(r))?(r=t,$n):Sr:r instanceof I?$n:r instanceof Date?kr:vr(r)?Nr:Array.isArray(r)?$r:typeof r.valueOf!="function"&&typeof r.toString!="function"||isNaN(r)?Ar:K)(n,r)}function jr(n,r){return n=+n,r=+r,function(e){return Math.round(n*(1-e)+r*e)}}function Hr(n){return function(){return n}}function Er(n){return+n}var kn=[0,1];function R(n){return n}function tn(n,r){return(r-=n=+n)?function(e){return(e-n)/r}:Hr(isNaN(r)?NaN:.5)}function Pr(n,r){var e;return n>r&&(e=n,n=r,r=e),function(t){return Math.max(n,Math.min(r,t))}}function qr(n,r,e){var t=n[0],i=n[1],o=r[0],f=r[1];return i<t?(t=tn(i,t),o=e(f,o)):(t=tn(t,i),o=e(o,f)),function(a){return o(t(a))}}function Ir(n,r,e){var t=Math.min(n.length,r.length)-1,i=new Array(t),o=new Array(t),f=-1;for(n[t]<n[0]&&(n=n.slice().reverse(),r=r.slice().reverse());++f<t;)i[f]=tn(n[f],n[f+1]),o[f]=e(r[f],r[f+1]);return function(a){var s=nr(n,a,1,t)-1;return o[s](i[s](a))}}function zr(n,r){return r.domain(n.domain()).range(n.range()).interpolate(n.interpolate()).clamp(n.clamp()).unknown(n.unknown())}function Lr(){var n=kn,r=kn,e=on,t,i,o,f=R,a,s,u;function l(){var d=Math.min(n.length,r.length);return f!==R&&(f=Pr(n[0],n[d-1])),a=d>2?Ir:qr,s=u=null,c}function c(d){return d==null||isNaN(d=+d)?o:(s||(s=a(n.map(t),r,e)))(t(f(d)))}return c.invert=function(d){return f(i((u||(u=a(r,n.map(t),K)))(d)))},c.domain=function(d){return arguments.length?(n=Array.from(d,Er),l()):n.slice()},c.range=function(d){return arguments.length?(r=Array.from(d),l()):r.slice()},c.rangeRound=function(d){return r=Array.from(d),e=jr,l()},c.clamp=function(d){return arguments.length?(f=d?!0:R,l()):f!==R},c.interpolate=function(d){return arguments.length?(e=d,l()):e},c.unknown=function(d){return arguments.length?(o=d,c):o},function(d,M){return t=d,i=M,l()}}function Or(){return Lr()(R,R)}function Cr(n){return Math.abs(n=Math.round(n))>=1e21?n.toLocaleString("en").replace(/,/g,""):n.toString(10)}function U(n,r){if((e=(n=r?n.toExponential(r-1):n.toExponential()).indexOf("e"))<0)return null;var e,t=n.slice(0,e);return[t.length>1?t[0]+t.slice(2):t,+n.slice(e+1)]}function j(n){return n=U(Math.abs(n)),n?n[1]:NaN}function Fr(n,r){return function(e,t){for(var i=e.length,o=[],f=0,a=n[0],s=0;i>0&&a>0&&(s+a+1>t&&(a=Math.max(1,t-s)),o.push(e.substring(i-=a,i+a)),!((s+=a+1)>t));)a=n[f=(f+1)%n.length];return o.reverse().join(r)}}function Tr(n){return function(r){return r.replace(/[0-9]/g,function(e){return n[+e]})}}var Dr=/^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;function Z(n){if(!(r=Dr.exec(n)))throw new Error("invalid format: "+n);var r;return new un({fill:r[1],align:r[2],sign:r[3],symbol:r[4],zero:r[5],width:r[6],comma:r[7],precision:r[8]&&r[8].slice(1),trim:r[9],type:r[10]})}Z.prototype=un.prototype;function un(n){this.fill=n.fill===void 0?" ":n.fill+"",this.align=n.align===void 0?">":n.align+"",this.sign=n.sign===void 0?"-":n.sign+"",this.symbol=n.symbol===void 0?"":n.symbol+"",this.zero=!!n.zero,this.width=n.width===void 0?void 0:+n.width,this.comma=!!n.comma,this.precision=n.precision===void 0?void 0:+n.precision,this.trim=!!n.trim,this.type=n.type===void 0?"":n.type+""}un.prototype.toString=function(){return this.fill+this.align+this.sign+this.symbol+(this.zero?"0":"")+(this.width===void 0?"":Math.max(1,this.width|0))+(this.comma?",":"")+(this.precision===void 0?"":"."+Math.max(0,this.precision|0))+(this.trim?"~":"")+this.type};function Br(n){n:for(var r=n.length,e=1,t=-1,i;e<r;++e)switch(n[e]){case".":t=i=e;break;case"0":t===0&&(t=e),i=e;break;default:if(!+n[e])break n;t>0&&(t=0);break}return t>0?n.slice(0,t)+n.slice(i+1):n}var zn;function Gr(n,r){var e=U(n,r);if(!e)return n+"";var t=e[0],i=e[1],o=i-(zn=Math.max(-8,Math.min(8,Math.floor(i/3)))*3)+1,f=t.length;return o===f?t:o>f?t+new Array(o-f+1).join("0"):o>0?t.slice(0,o)+"."+t.slice(o):"0."+new Array(1-o).join("0")+U(n,Math.max(0,r+o-1))[0]}function An(n,r){var e=U(n,r);if(!e)return n+"";var t=e[0],i=e[1];return i<0?"0."+new Array(-i).join("0")+t:t.length>i+1?t.slice(0,i+1)+"."+t.slice(i+1):t+new Array(i-t.length+2).join("0")}const _n={"%":(n,r)=>(n*100).toFixed(r),b:n=>Math.round(n).toString(2),c:n=>n+"",d:Cr,e:(n,r)=>n.toExponential(r),f:(n,r)=>n.toFixed(r),g:(n,r)=>n.toPrecision(r),o:n=>Math.round(n).toString(8),p:(n,r)=>An(n*100,r),r:An,s:Gr,X:n=>Math.round(n).toString(16).toUpperCase(),x:n=>Math.round(n).toString(16)};function Rn(n){return n}var Sn=Array.prototype.map,jn=["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];function Vr(n){var r=n.grouping===void 0||n.thousands===void 0?Rn:Fr(Sn.call(n.grouping,Number),n.thousands+""),e=n.currency===void 0?"":n.currency[0]+"",t=n.currency===void 0?"":n.currency[1]+"",i=n.decimal===void 0?".":n.decimal+"",o=n.numerals===void 0?Rn:Tr(Sn.call(n.numerals,String)),f=n.percent===void 0?"%":n.percent+"",a=n.minus===void 0?"−":n.minus+"",s=n.nan===void 0?"NaN":n.nan+"";function u(c){c=Z(c);var d=c.fill,M=c.align,p=c.sign,H=c.symbol,A=c.zero,E=c.width,J=c.comma,N=c.precision,sn=c.trim,x=c.type;x==="n"?(J=!0,x="g"):_n[x]||(N===void 0&&(N=12),sn=!0,x="g"),(A||d==="0"&&M==="=")&&(A=!0,d="0",M="=");var Cn=H==="$"?e:H==="#"&&/[boxX]/.test(x)?"0"+x.toLowerCase():"",Fn=H==="$"?t:/[%p]/.test(x)?f:"",cn=_n[x],Tn=/[defgprs%]/.test(x);N=N===void 0?6:/[gprs]/.test(x)?Math.max(1,Math.min(21,N)):Math.max(0,Math.min(20,N));function ln(h){var v=Cn,m=Fn,_,hn,L;if(x==="c")m=cn(h)+m,h="";else{h=+h;var O=h<0||1/h<0;if(h=isNaN(h)?s:cn(Math.abs(h),N),sn&&(h=Br(h)),O&&+h==0&&p!=="+"&&(O=!1),v=(O?p==="("?p:a:p==="-"||p==="("?"":p)+v,m=(x==="s"?jn[8+zn/3]:"")+m+(O&&p==="("?")":""),Tn){for(_=-1,hn=h.length;++_<hn;)if(L=h.charCodeAt(_),48>L||L>57){m=(L===46?i+h.slice(_+1):h.slice(_))+m,h=h.slice(0,_);break}}}J&&!A&&(h=r(h,1/0));var C=v.length+h.length+m.length,w=C<E?new Array(E-C+1).join(d):"";switch(J&&A&&(h=r(w+h,w.length?E-m.length:1/0),w=""),M){case"<":h=v+h+m+w;break;case"=":h=v+w+h+m;break;case"^":h=w.slice(0,C=w.length>>1)+v+h+m+w.slice(C);break;default:h=w+v+h+m;break}return o(h)}return ln.toString=function(){return c+""},ln}function l(c,d){var M=u((c=Z(c),c.type="f",c)),p=Math.max(-8,Math.min(8,Math.floor(j(d)/3)))*3,H=Math.pow(10,-p),A=jn[8+p/3];return function(E){return M(H*E)+A}}return{format:u,formatPrefix:l}}var D,Ln,On;Xr({thousands:",",grouping:[3],currency:["$",""]});function Xr(n){return D=Vr(n),Ln=D.format,On=D.formatPrefix,D}function Yr(n){return Math.max(0,-j(Math.abs(n)))}function Kr(n,r){return Math.max(0,Math.max(-8,Math.min(8,Math.floor(j(r)/3)))*3-j(Math.abs(n)))}function Ur(n,r){return n=Math.abs(n),r=Math.abs(r)-n,Math.max(0,j(r)-j(n))+1}function Zr(n,r,e,t){var i=fr(n,r,e),o;switch(t=Z(t??",f"),t.type){case"s":{var f=Math.max(Math.abs(n),Math.abs(r));return t.precision==null&&!isNaN(o=Kr(i,f))&&(t.precision=o),On(t,f)}case"":case"e":case"g":case"p":case"r":{t.precision==null&&!isNaN(o=Ur(i,Math.max(Math.abs(n),Math.abs(r))))&&(t.precision=o-(t.type==="e"));break}case"f":case"%":{t.precision==null&&!isNaN(o=Yr(i))&&(t.precision=o-(t.type==="%")*2);break}}return Ln(t)}function Jr(n){var r=n.domain;return n.ticks=function(e){var t=r();return ir(t[0],t[t.length-1],e??10)},n.tickFormat=function(e,t){var i=r();return Zr(i[0],i[i.length-1],e??10,t)},n.nice=function(e){e==null&&(e=10);var t=r(),i=0,o=t.length-1,f=t[i],a=t[o],s,u,l=10;for(a<f&&(u=f,f=a,a=u,u=i,i=o,o=u);l-- >0;){if(u=nn(f,a,e),u===s)return t[i]=f,t[o]=a,r(t);if(u>0)f=Math.floor(f/u)*u,a=Math.ceil(a/u)*u;else if(u<0)f=Math.ceil(f*u)/u,a=Math.floor(a*u)/u;else break;s=u}return n},n}function Qr(){var n=Or();return n.copy=function(){return zr(n,Qr())},ar.apply(n,arguments),Jr(n)}function fe(n){for(var r=n.length/6|0,e=new Array(r),t=0;t<r;)e[t]="#"+n.slice(t*6,++t*6);return e}export{gn as a,K as b,fe as c,Jr as d,R as e,ie as f,on as g,jr as h,ar as i,$n as j,Sr as k,Qr as l,I as m,re as n,te as r,ee as s};
