var content=(function(){"use strict";var me=Object.defineProperty;var ce=(B,_,M)=>_ in B?me(B,_,{enumerable:!0,configurable:!0,writable:!0,value:M}):B[_]=M;var N=(B,_,M)=>ce(B,typeof _!="symbol"?_+"":_,M);function B(o){return o}function _(o){return o&&o.__esModule&&Object.prototype.hasOwnProperty.call(o,"default")?o.default:o}var M={exports:{}},Z=M.exports,V;function J(){return V||(V=1,(function(o,r){(function(e,t){t(o)})(typeof globalThis<"u"?globalThis:typeof self<"u"?self:Z,function(e){if(!(globalThis.chrome&&globalThis.chrome.runtime&&globalThis.chrome.runtime.id))throw new Error("This script should only be loaded in a browser extension.");if(globalThis.browser&&globalThis.browser.runtime&&globalThis.browser.runtime.id)e.exports=globalThis.browser;else{const t="The message port closed before a response was received.",n=i=>{const u={alarms:{clear:{minArgs:0,maxArgs:1},clearAll:{minArgs:0,maxArgs:0},get:{minArgs:0,maxArgs:1},getAll:{minArgs:0,maxArgs:0}},bookmarks:{create:{minArgs:1,maxArgs:1},get:{minArgs:1,maxArgs:1},getChildren:{minArgs:1,maxArgs:1},getRecent:{minArgs:1,maxArgs:1},getSubTree:{minArgs:1,maxArgs:1},getTree:{minArgs:0,maxArgs:0},move:{minArgs:2,maxArgs:2},remove:{minArgs:1,maxArgs:1},removeTree:{minArgs:1,maxArgs:1},search:{minArgs:1,maxArgs:1},update:{minArgs:2,maxArgs:2}},browserAction:{disable:{minArgs:0,maxArgs:1,fallbackToNoCallback:!0},enable:{minArgs:0,maxArgs:1,fallbackToNoCallback:!0},getBadgeBackgroundColor:{minArgs:1,maxArgs:1},getBadgeText:{minArgs:1,maxArgs:1},getPopup:{minArgs:1,maxArgs:1},getTitle:{minArgs:1,maxArgs:1},openPopup:{minArgs:0,maxArgs:0},setBadgeBackgroundColor:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0},setBadgeText:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0},setIcon:{minArgs:1,maxArgs:1},setPopup:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0},setTitle:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0}},browsingData:{remove:{minArgs:2,maxArgs:2},removeCache:{minArgs:1,maxArgs:1},removeCookies:{minArgs:1,maxArgs:1},removeDownloads:{minArgs:1,maxArgs:1},removeFormData:{minArgs:1,maxArgs:1},removeHistory:{minArgs:1,maxArgs:1},removeLocalStorage:{minArgs:1,maxArgs:1},removePasswords:{minArgs:1,maxArgs:1},removePluginData:{minArgs:1,maxArgs:1},settings:{minArgs:0,maxArgs:0}},commands:{getAll:{minArgs:0,maxArgs:0}},contextMenus:{remove:{minArgs:1,maxArgs:1},removeAll:{minArgs:0,maxArgs:0},update:{minArgs:2,maxArgs:2}},cookies:{get:{minArgs:1,maxArgs:1},getAll:{minArgs:1,maxArgs:1},getAllCookieStores:{minArgs:0,maxArgs:0},remove:{minArgs:1,maxArgs:1},set:{minArgs:1,maxArgs:1}},devtools:{inspectedWindow:{eval:{minArgs:1,maxArgs:2,singleCallbackArg:!1}},panels:{create:{minArgs:3,maxArgs:3,singleCallbackArg:!0},elements:{createSidebarPane:{minArgs:1,maxArgs:1}}}},downloads:{cancel:{minArgs:1,maxArgs:1},download:{minArgs:1,maxArgs:1},erase:{minArgs:1,maxArgs:1},getFileIcon:{minArgs:1,maxArgs:2},open:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0},pause:{minArgs:1,maxArgs:1},removeFile:{minArgs:1,maxArgs:1},resume:{minArgs:1,maxArgs:1},search:{minArgs:1,maxArgs:1},show:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0}},extension:{isAllowedFileSchemeAccess:{minArgs:0,maxArgs:0},isAllowedIncognitoAccess:{minArgs:0,maxArgs:0}},history:{addUrl:{minArgs:1,maxArgs:1},deleteAll:{minArgs:0,maxArgs:0},deleteRange:{minArgs:1,maxArgs:1},deleteUrl:{minArgs:1,maxArgs:1},getVisits:{minArgs:1,maxArgs:1},search:{minArgs:1,maxArgs:1}},i18n:{detectLanguage:{minArgs:1,maxArgs:1},getAcceptLanguages:{minArgs:0,maxArgs:0}},identity:{launchWebAuthFlow:{minArgs:1,maxArgs:1}},idle:{queryState:{minArgs:1,maxArgs:1}},management:{get:{minArgs:1,maxArgs:1},getAll:{minArgs:0,maxArgs:0},getSelf:{minArgs:0,maxArgs:0},setEnabled:{minArgs:2,maxArgs:2},uninstallSelf:{minArgs:0,maxArgs:1}},notifications:{clear:{minArgs:1,maxArgs:1},create:{minArgs:1,maxArgs:2},getAll:{minArgs:0,maxArgs:0},getPermissionLevel:{minArgs:0,maxArgs:0},update:{minArgs:2,maxArgs:2}},pageAction:{getPopup:{minArgs:1,maxArgs:1},getTitle:{minArgs:1,maxArgs:1},hide:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0},setIcon:{minArgs:1,maxArgs:1},setPopup:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0},setTitle:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0},show:{minArgs:1,maxArgs:1,fallbackToNoCallback:!0}},permissions:{contains:{minArgs:1,maxArgs:1},getAll:{minArgs:0,maxArgs:0},remove:{minArgs:1,maxArgs:1},request:{minArgs:1,maxArgs:1}},runtime:{getBackgroundPage:{minArgs:0,maxArgs:0},getPlatformInfo:{minArgs:0,maxArgs:0},openOptionsPage:{minArgs:0,maxArgs:0},requestUpdateCheck:{minArgs:0,maxArgs:0},sendMessage:{minArgs:1,maxArgs:3},sendNativeMessage:{minArgs:2,maxArgs:2},setUninstallURL:{minArgs:1,maxArgs:1}},sessions:{getDevices:{minArgs:0,maxArgs:1},getRecentlyClosed:{minArgs:0,maxArgs:1},restore:{minArgs:0,maxArgs:1}},storage:{local:{clear:{minArgs:0,maxArgs:0},get:{minArgs:0,maxArgs:1},getBytesInUse:{minArgs:0,maxArgs:1},remove:{minArgs:1,maxArgs:1},set:{minArgs:1,maxArgs:1}},managed:{get:{minArgs:0,maxArgs:1},getBytesInUse:{minArgs:0,maxArgs:1}},sync:{clear:{minArgs:0,maxArgs:0},get:{minArgs:0,maxArgs:1},getBytesInUse:{minArgs:0,maxArgs:1},remove:{minArgs:1,maxArgs:1},set:{minArgs:1,maxArgs:1}}},tabs:{captureVisibleTab:{minArgs:0,maxArgs:2},create:{minArgs:1,maxArgs:1},detectLanguage:{minArgs:0,maxArgs:1},discard:{minArgs:0,maxArgs:1},duplicate:{minArgs:1,maxArgs:1},executeScript:{minArgs:1,maxArgs:2},get:{minArgs:1,maxArgs:1},getCurrent:{minArgs:0,maxArgs:0},getZoom:{minArgs:0,maxArgs:1},getZoomSettings:{minArgs:0,maxArgs:1},goBack:{minArgs:0,maxArgs:1},goForward:{minArgs:0,maxArgs:1},highlight:{minArgs:1,maxArgs:1},insertCSS:{minArgs:1,maxArgs:2},move:{minArgs:2,maxArgs:2},query:{minArgs:1,maxArgs:1},reload:{minArgs:0,maxArgs:2},remove:{minArgs:1,maxArgs:1},removeCSS:{minArgs:1,maxArgs:2},sendMessage:{minArgs:2,maxArgs:3},setZoom:{minArgs:1,maxArgs:2},setZoomSettings:{minArgs:1,maxArgs:2},update:{minArgs:1,maxArgs:2}},topSites:{get:{minArgs:0,maxArgs:0}},webNavigation:{getAllFrames:{minArgs:1,maxArgs:1},getFrame:{minArgs:1,maxArgs:1}},webRequest:{handlerBehaviorChanged:{minArgs:0,maxArgs:0}},windows:{create:{minArgs:0,maxArgs:1},get:{minArgs:1,maxArgs:2},getAll:{minArgs:0,maxArgs:1},getCurrent:{minArgs:0,maxArgs:1},getLastFocused:{minArgs:0,maxArgs:1},remove:{minArgs:1,maxArgs:1},update:{minArgs:2,maxArgs:2}}};if(Object.keys(u).length===0)throw new Error("api-metadata.json has not been included in browser-polyfill");class A extends WeakMap{constructor(a,m=void 0){super(m),this.createItem=a}get(a){return this.has(a)||this.set(a,this.createItem(a)),super.get(a)}}const R=s=>s&&typeof s=="object"&&typeof s.then=="function",w=(s,a)=>(...m)=>{i.runtime.lastError?s.reject(new Error(i.runtime.lastError.message)):a.singleCallbackArg||m.length<=1&&a.singleCallbackArg!==!1?s.resolve(m[0]):s.resolve(m)},F=s=>s==1?"argument":"arguments",$=(s,a)=>function(c,...b){if(b.length<a.minArgs)throw new Error(`Expected at least ${a.minArgs} ${F(a.minArgs)} for ${s}(), got ${b.length}`);if(b.length>a.maxArgs)throw new Error(`Expected at most ${a.maxArgs} ${F(a.maxArgs)} for ${s}(), got ${b.length}`);return new Promise((C,S)=>{if(a.fallbackToNoCallback)try{c[s](...b,w({resolve:C,reject:S},a))}catch(l){console.warn(`${s} API method doesn't seem to support the callback parameter, falling back to call it without a callback: `,l),c[s](...b),a.fallbackToNoCallback=!1,a.noCallback=!0,C()}else a.noCallback?(c[s](...b),C()):c[s](...b,w({resolve:C,reject:S},a))})},I=(s,a,m)=>new Proxy(a,{apply(c,b,C){return m.call(b,s,...C)}});let T=Function.call.bind(Object.prototype.hasOwnProperty);const v=(s,a={},m={})=>{let c=Object.create(null),b={has(S,l){return l in s||l in c},get(S,l,k){if(l in c)return c[l];if(!(l in s))return;let x=s[l];if(typeof x=="function")if(typeof a[l]=="function")x=I(s,s[l],a[l]);else if(T(m,l)){let D=$(l,m[l]);x=I(s,s[l],D)}else x=x.bind(s);else if(typeof x=="object"&&x!==null&&(T(a,l)||T(m,l)))x=v(x,a[l],m[l]);else if(T(m,"*"))x=v(x,a[l],m["*"]);else return Object.defineProperty(c,l,{configurable:!0,enumerable:!0,get(){return s[l]},set(D){s[l]=D}}),x;return c[l]=x,x},set(S,l,k,x){return l in c?c[l]=k:s[l]=k,!0},defineProperty(S,l,k){return Reflect.defineProperty(c,l,k)},deleteProperty(S,l){return Reflect.deleteProperty(c,l)}},C=Object.create(s);return new Proxy(C,b)},d=s=>({addListener(a,m,...c){a.addListener(s.get(m),...c)},hasListener(a,m){return a.hasListener(s.get(m))},removeListener(a,m){a.removeListener(s.get(m))}}),g=new A(s=>typeof s!="function"?s:function(m){const c=v(m,{},{getContent:{minArgs:0,maxArgs:0}});s(c)}),h=new A(s=>typeof s!="function"?s:function(m,c,b){let C=!1,S,l=new Promise(K=>{S=function(P){C=!0,K(P)}}),k;try{k=s(m,c,S)}catch(K){k=Promise.reject(K)}const x=k!==!0&&R(k);if(k!==!0&&!x&&!C)return!1;const D=K=>{K.then(P=>{b(P)},P=>{let G;P&&(P instanceof Error||typeof P.message=="string")?G=P.message:G="An unexpected error occurred",b({__mozWebExtensionPolyfillReject__:!0,message:G})}).catch(P=>{console.error("Failed to send onMessage rejected reply",P)})};return D(x?k:l),!0}),y=({reject:s,resolve:a},m)=>{i.runtime.lastError?i.runtime.lastError.message===t?a():s(new Error(i.runtime.lastError.message)):m&&m.__mozWebExtensionPolyfillReject__?s(new Error(m.message)):a(m)},E=(s,a,m,...c)=>{if(c.length<a.minArgs)throw new Error(`Expected at least ${a.minArgs} ${F(a.minArgs)} for ${s}(), got ${c.length}`);if(c.length>a.maxArgs)throw new Error(`Expected at most ${a.maxArgs} ${F(a.maxArgs)} for ${s}(), got ${c.length}`);return new Promise((b,C)=>{const S=y.bind(null,{resolve:b,reject:C});c.push(S),m.sendMessage(...c)})},p={devtools:{network:{onRequestFinished:d(g)}},runtime:{onMessage:d(h),onMessageExternal:d(h),sendMessage:E.bind(null,"sendMessage",{minArgs:1,maxArgs:3})},tabs:{sendMessage:E.bind(null,"sendMessage",{minArgs:2,maxArgs:3})}},f={clear:{minArgs:1,maxArgs:1},get:{minArgs:1,maxArgs:1},set:{minArgs:1,maxArgs:1}};return u.privacy={network:{"*":f},services:{"*":f},websites:{"*":f}},v(i,p,u)};e.exports=n(chrome)}})})(M)),M.exports}var Q=J();const L=_(Q),Y=[{hostname:"wetriedtls.com",contentSelector:"#reader-container"},{hostname:"revengernovel.com",contentSelector:"#chapterContent"},{hostname:"fenrirealm.com",contentSelector:".content-area"},{hostname:"mavintranslations.com",contentSelector:"body"},{hostname:"wuxiaworld.com",contentSelector:"div.chapter-content"}];Y.map(o=>`*://*.${o.hostname}/*`);const ee=()=>Y.find(o=>window.location.hostname.includes(o.hostname)),X="goldfish-modal-styles";function te(){if(document.getElementById(X))return;const o=document.createElement("style");o.id=X,o.textContent=`
        .goldfish-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(3px);
            z-index: 2147483647;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
            display: block; /* Allows absolute positioning of children */
        }
        .goldfish-modal-overlay.visible {
            opacity: 1;
        }
        .goldfish-modal {
            position: absolute;
            background: #1e1e1e;
            color: #e0e0e0;
            width: 340px;
            max-width: 90vw;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: scale(0.95);
            transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .goldfish-modal-overlay.visible .goldfish-modal {
            transform: scale(1);
        }
        .goldfish-modal-header {
            padding: 14px 16px;
            background: rgba(255, 255, 255, 0.03);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-weight: 600;
            font-size: 15px;
            color: #fff;
        }
        .goldfish-modal-body {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .goldfish-input-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .goldfish-label {
            font-size: 12px;
            color: #aaa;
            font-weight: 500;
            margin-left: 2px;
        }
        .goldfish-input {
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 6px;
            padding: 8px 10px;
            color: #fff;
            font-size: 13px;
            font-family: inherit;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
            width: 100%;
            box-sizing: border-box;
        }
        .goldfish-input:focus {
            border-color: #6495ED;
            box-shadow: 0 0 0 2px rgba(100, 149, 237, 0.2);
        }
        .goldfish-textarea {
            resize: vertical;
            min-height: 60px;
            line-height: 1.4;
        }
        .goldfish-modal-footer {
            padding: 12px 16px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            background: rgba(0, 0, 0, 0.2);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .goldfish-btn {
            padding: 6px 14px;
            border-radius: 6px;
            border: none;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        .goldfish-btn-secondary {
            background: transparent;
            color: #aaa;
        }
        .goldfish-btn-secondary:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.08);
        }
        .goldfish-btn-primary {
            background: #6495ED;
            color: #fff;
        }
        .goldfish-btn-primary:hover {
            background: #5b89db;
        }
        .goldfish-btn-primary:active {
            transform: translateY(1px);
        }
        .goldfish-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none !important;
        }
    `,(document.head||document.documentElement).appendChild(o)}function re(o,r,e){te();const t=document.getElementById("goldfish-modal-overlay");t&&t.remove();const n=document.createElement("div");n.id="goldfish-modal-overlay",n.className="goldfish-modal-overlay";const i=document.createElement("div");i.className="goldfish-modal";const u=document.createElement("div");u.className="goldfish-modal-header",u.textContent=o,i.appendChild(u);const A=document.createElement("div");A.className="goldfish-modal-body";const R=(g,h,y,E=!1)=>{const p=document.createElement("div");p.className="goldfish-input-group";const f=document.createElement("div");f.className="goldfish-label",f.textContent=g+(E?" (Optional)":""),p.appendChild(f);const s=document.createElement(y==="textarea"?"textarea":"input");return s.className=`goldfish-input ${y==="textarea"?"goldfish-textarea":""}`,s.placeholder=h,p.appendChild(s),{group:p,input:s}},w=R("Description","Who is this character?","textarea"),F=R("Aliases","Nicknames, comma separated","text",!0),$=R("Image URL","https://...","text",!0);A.appendChild(w.group),A.appendChild(F.group),A.appendChild($.group),i.appendChild(A);const I=document.createElement("div");I.className="goldfish-modal-footer";const T=()=>{n.classList.remove("visible"),setTimeout(()=>n.remove(),200)};n.onclick=g=>{g.target===n&&T()};const v=document.createElement("button");v.className="goldfish-btn goldfish-btn-secondary",v.textContent="Cancel",v.onclick=T;const d=document.createElement("button");d.className="goldfish-btn goldfish-btn-primary",d.textContent="Save",d.onclick=async()=>{const g=w.input.value.trim(),h=F.input.value.split(",").map(p=>p.trim()).filter(Boolean),y=$.input.value.trim();if(!g&&!y&&!h.length){w.input.style.borderColor="#ff4d4f",w.input.focus();return}const E=d.textContent;d.textContent="Saving...",d.disabled=!0;try{await L.runtime.sendMessage({type:"ADD_CHARACTER",novelId:r,name:o,description:g,aliases:h,imageUrl:y}),T()}catch(p){console.error(p),d.textContent="Failed",d.style.backgroundColor="#ff4d4f",setTimeout(()=>{d.textContent=E,d.style.backgroundColor="",d.disabled=!1},2e3)}},I.appendChild(v),I.appendChild(d),i.appendChild(I),n.appendChild(i),document.body.appendChild(n),requestAnimationFrame(()=>{n.classList.add("visible"),w.input.focus();const g=12;if(e&&e.width>0){const h=i.getBoundingClientRect(),y=document.documentElement.clientWidth,E=document.documentElement.clientHeight;let p=e.bottom+g,f=e.left;p+h.height>E-g&&(p=e.top-h.height-g),f+h.width>y-g&&(f=y-h.width-g),p<g&&(p=g),f<g&&(f=g),i.style.top=`${p}px`,i.style.left=`${f}px`}else i.style.top="50%",i.style.left="50%",i.style.transform="translate(-50%, -50%)",i.style.transition="opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",i.style.transform="translate(-50%, -50%) scale(0.95)",i.offsetWidth,requestAnimationFrame(()=>{n.classList.contains("visible")&&(i.style.transform="translate(-50%, -50%) scale(1)")})})}const se={matches:["*://*.wetriedtls.com/*","*://*.revengernovel.com/*","*://*.fenrirealm.com/*","*://*.mavintranslations.com/*","*://*.wuxiaworld.com/*"],main(){class o{constructor(){N(this,"currentNovelId",null);N(this,"isProcessing",!1);N(this,"lastUrl",location.href);N(this,"HIGHLIGHT_LIMIT_PER_CHAR",5);this.setupListeners(),this.init()}async init(){const e=ee();e&&(document.readyState==="loading"&&await new Promise(t=>document.addEventListener("DOMContentLoaded",t)),await this.process(e))}setupListeners(){L.runtime.onMessage.addListener(e=>{if(e.type==="RESCAN_PAGE"){this.init();return}e.type==="CONTEXT_MENU_ADD_CHARACTER"&&this.handleAddCharacter(e.text)}),document.addEventListener("mouseover",this.handleTooltipPositioning.bind(this)),setInterval(()=>{location.href!==this.lastUrl&&(this.lastUrl=location.href,this.init())},2e3),L.storage.onChanged.addListener((e,t)=>{t==="local"&&e.activeNovelId&&this.init()})}async handleAddCharacter(e){if(!this.currentNovelId){alert("Please select a novel in the Goldfish extension popup first.");return}let t;const n=window.getSelection();if(n&&n.rangeCount>0)try{t=n.getRangeAt(0).getBoundingClientRect()}catch{}re(e,this.currentNovelId,t)}handleTooltipPositioning(e){var A;const t=e.target;if(!((A=t.classList)!=null&&A.contains("goldfish-highlight")))return;const n=t.querySelector(".goldfish-tooltip");if(!n)return;const i=t.getBoundingClientRect();n.classList.remove("bottom");const u=n.offsetHeight||200;i.top-u<20&&n.classList.add("bottom")}async waitForContainer(e,t=1e4){const n=Date.now();for(;Date.now()-n<t;){const i=document.querySelector(e);if(i!=null&&i.textContent&&i.textContent.trim().length>200)return i;await new Promise(u=>setTimeout(u,500))}return document.querySelector(e)}async process(e){if(!this.isProcessing){this.isProcessing=!0;try{const n=(await L.storage.local.get("activeNovelId")).activeNovelId;if(!n)return;this.currentNovelId=parseInt(n);const i=await L.runtime.sendMessage({type:"GET_CHARACTERS",novelId:this.currentNovelId});if(!i||i.length===0)return;const u=await this.waitForContainer(e.contentSelector);if(!u)return;this.injectStyles();const A=new Map,R=[];for(const d of i){const g=[d.name,...d.aliases||[]].map(h=>h.trim()).filter(Boolean);for(const h of g)A.set(h.toLowerCase(),d),R.push(h.replace(/[.*+?^${}()|[\\]/g,"\\$&"))}R.sort((d,g)=>g.length-d.length);const w=new RegExp(`\\b(${R.join("|")})\\b`,"gi"),F=document.createTreeWalker(u,NodeFilter.SHOW_TEXT,{acceptNode:d=>{const g=d.parentElement;return!g||g.classList.contains("goldfish-highlight")||["SCRIPT","STYLE","TEXTAREA","INPUT","NOSCRIPT"].includes(g.tagName)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),$=[];let I;for(;I=F.nextNode();)$.push(I);const T=new Map;let v=0;for(const d of $){const g=d.nodeValue||"";if(!w.test(g))continue;w.lastIndex=0;const h=[];let y=0,E;for(;(E=w.exec(g))!==null;){const p=E[0].toLowerCase(),f=A.get(p);if(!f||(T.get(f.id)||0)>=this.HIGHLIGHT_LIMIT_PER_CHAR){h.push(g.substring(y,w.lastIndex)),y=w.lastIndex;continue}h.push(g.substring(y,E.index)),h.push(this.createHighlightNode(E[0],f)),T.set(f.id,(T.get(f.id)||0)+1),v++,y=w.lastIndex}v>0&&(h.push(g.substring(y)),d.replaceWith(...h.map(p=>typeof p=="string"?document.createTextNode(p):p)))}v>0&&console.log(`[Goldfish] Applied ${v} highlights.`)}catch(t){console.error("[Goldfish] Content processing failed:",t)}finally{this.isProcessing=!1}}}createHighlightNode(e,t){const n=document.createElement("span");n.className="goldfish-highlight",n.textContent=e;const i=document.createElement("span");if(i.className="goldfish-tooltip",t.imageUrl){const A=document.createElement("img");A.src=t.imageUrl,i.appendChild(A)}const u=document.createElement("span");return u.className="goldfish-tooltip-text",u.textContent=t.description,i.appendChild(u),n.appendChild(i),n}injectStyles(){const e="goldfish-style-tag";if(document.getElementById(e))return;const t=document.createElement("style");t.id=e,t.textContent=`
                    .goldfish-highlight {
                        position: relative !important;
                        color: #6495ED !important;
                        display: inline !important;
                        padding: 0 2px !important;
                        border-radius: 3px !important;
                        border-bottom: 1px dotted #6495ED !important;
                        cursor: help !important;
                        font-weight: bold !important;
                    }
                    .goldfish-tooltip {
                        position: absolute !important;
                        bottom: 125% !important;
                        left: 50% !important;
                        transform: translateX(-50%) !important;
                        background-color: rgba(20, 20, 23, 0.95) !important;
                        color: #f0f0f0 !important;
                        padding: 12px !important;
                        border-radius: 8px !important;
                        font-size: 14px !important;
                        font-family: sans-serif !important;
                        line-height: 1.4 !important;
                        width: max-content !important;
                        max-width: 280px !important;
                        z-index: 2147483647 !important;
                        visibility: hidden;
                        opacity: 0;
                        transition: opacity 0.2s ease, transform 0.2s ease !important;
                        box-shadow: 0 8px 20px rgba(0,0,0,0.5) !important;
                        border: 1px solid rgba(255, 255, 255, 0.1) !important;
                        pointer-events: none !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        backdrop-filter: blur(4px) !important;
                    }
                    .goldfish-highlight:hover .goldfish-tooltip {
                        visibility: visible !important;
                        opacity: 1 !important;
                        transform: translateX(-50%) translateY(-5px) !important;
                    }
                    .goldfish-tooltip.bottom {
                        bottom: auto !important;
                        top: 125% !important;
                    }
                    .goldfish-tooltip img {
                        max-width: 150px !important;
                        max-height: 150px !important;
                        width: auto !important;
                        display: block !important;
                        margin-bottom: 10px !important;
                        border-radius: 4px !important;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
                    }
                    .goldfish-tooltip-text {
                        display: block !important;
                        text-align: center !important;
                    }
                `,(document.head||document.documentElement).appendChild(t)}}new o}};function U(o,...r){}const ne={debug:(...o)=>U(console.debug,...o),log:(...o)=>U(console.log,...o),warn:(...o)=>U(console.warn,...o),error:(...o)=>U(console.error,...o)},j=class j extends Event{constructor(r,e){super(j.EVENT_NAME,{}),this.newUrl=r,this.oldUrl=e}};N(j,"EVENT_NAME",W("wxt:locationchange"));let q=j;function W(o){var r;return`${(r=L==null?void 0:L.runtime)==null?void 0:r.id}:content:${o}`}function ie(o){let r,e;return{run(){r==null&&(e=new URL(location.href),r=o.setInterval(()=>{let t=new URL(location.href);t.href!==e.href&&(window.dispatchEvent(new q(t,e)),e=t)},1e3))}}}const H=class H{constructor(r,e){N(this,"isTopFrame",window.self===window.top);N(this,"abortController");N(this,"locationWatcher",ie(this));N(this,"receivedMessageIds",new Set);this.contentScriptName=r,this.options=e,this.abortController=new AbortController,this.isTopFrame?(this.listenForNewerScripts({ignoreFirstEvent:!0}),this.stopOldScripts()):this.listenForNewerScripts()}get signal(){return this.abortController.signal}abort(r){return this.abortController.abort(r)}get isInvalid(){return L.runtime.id==null&&this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(r){return this.signal.addEventListener("abort",r),()=>this.signal.removeEventListener("abort",r)}block(){return new Promise(()=>{})}setInterval(r,e){const t=setInterval(()=>{this.isValid&&r()},e);return this.onInvalidated(()=>clearInterval(t)),t}setTimeout(r,e){const t=setTimeout(()=>{this.isValid&&r()},e);return this.onInvalidated(()=>clearTimeout(t)),t}requestAnimationFrame(r){const e=requestAnimationFrame((...t)=>{this.isValid&&r(...t)});return this.onInvalidated(()=>cancelAnimationFrame(e)),e}requestIdleCallback(r,e){const t=requestIdleCallback((...n)=>{this.signal.aborted||r(...n)},e);return this.onInvalidated(()=>cancelIdleCallback(t)),t}addEventListener(r,e,t,n){var i;e==="wxt:locationchange"&&this.isValid&&this.locationWatcher.run(),(i=r.addEventListener)==null||i.call(r,e.startsWith("wxt:")?W(e):e,t,{...n,signal:this.signal})}notifyInvalidated(){this.abort("Content script context invalidated"),ne.debug(`Content script "${this.contentScriptName}" context invalidated`)}stopOldScripts(){window.postMessage({type:H.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:Math.random().toString(36).slice(2)},"*")}verifyScriptStartedEvent(r){var i,u,A;const e=((i=r.data)==null?void 0:i.type)===H.SCRIPT_STARTED_MESSAGE_TYPE,t=((u=r.data)==null?void 0:u.contentScriptName)===this.contentScriptName,n=!this.receivedMessageIds.has((A=r.data)==null?void 0:A.messageId);return e&&t&&n}listenForNewerScripts(r){let e=!0;const t=n=>{if(this.verifyScriptStartedEvent(n)){this.receivedMessageIds.add(n.data.messageId);const i=e;if(e=!1,i&&(r!=null&&r.ignoreFirstEvent))return;this.notifyInvalidated()}};addEventListener("message",t),this.onInvalidated(()=>removeEventListener("message",t))}};N(H,"SCRIPT_STARTED_MESSAGE_TYPE",W("wxt:content-script-started"));let z=H;const oe=Symbol("null");let ae=0;class le extends Map{constructor(){super(),this._objectHashes=new WeakMap,this._symbolHashes=new Map,this._publicKeys=new Map;const[r]=arguments;if(r!=null){if(typeof r[Symbol.iterator]!="function")throw new TypeError(typeof r+" is not iterable (cannot read property Symbol(Symbol.iterator))");for(const[e,t]of r)this.set(e,t)}}_getPublicKeys(r,e=!1){if(!Array.isArray(r))throw new TypeError("The keys parameter must be an array");const t=this._getPrivateKey(r,e);let n;return t&&this._publicKeys.has(t)?n=this._publicKeys.get(t):e&&(n=[...r],this._publicKeys.set(t,n)),{privateKey:t,publicKey:n}}_getPrivateKey(r,e=!1){const t=[];for(let n of r){n===null&&(n=oe);const i=typeof n=="object"||typeof n=="function"?"_objectHashes":typeof n=="symbol"?"_symbolHashes":!1;if(!i)t.push(n);else if(this[i].has(n))t.push(this[i].get(n));else if(e){const u=`@@mkm-ref-${ae++}@@`;this[i].set(n,u),t.push(u)}else return!1}return JSON.stringify(t)}set(r,e){const{publicKey:t}=this._getPublicKeys(r,!0);return super.set(t,e)}get(r){const{publicKey:e}=this._getPublicKeys(r);return super.get(e)}has(r){const{publicKey:e}=this._getPublicKeys(r);return super.has(e)}delete(r){const{publicKey:e,privateKey:t}=this._getPublicKeys(r);return!!(e&&super.delete(e)&&this._publicKeys.delete(t))}clear(){super.clear(),this._symbolHashes.clear(),this._publicKeys.clear()}get[Symbol.toStringTag](){return"ManyKeysMap"}get size(){return super.size}}new le;function ue(){}function O(o,...r){}const ge={debug:(...o)=>O(console.debug,...o),log:(...o)=>O(console.log,...o),warn:(...o)=>O(console.warn,...o),error:(...o)=>O(console.error,...o)};return(async()=>{try{const{main:o,...r}=se,e=new z("content",r);return await o(e)}catch(o){throw ge.error('The content script "content" crashed on startup!',o),o}})()})();
content;
