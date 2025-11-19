// no_jquery 3.1 — fully patched version
// Integrierte vollständige Bibliothek mit allen Verbesserungen
// -------------------------------------------------------------
// Hinweis: Diese Datei ersetzt 3.0.1 vollständig.
// Alle zuvor besprochenen Patches (Clone-Safe DOM Inserts,
// trigger(), slideDown-Fix, CSS-Hyphens, Exec-Lockdown, AJAX-Errors) sind eingearbeitet.

(function(global){
'use strict';

/* ==========================================================
   CORE UTILITIES
   ========================================================== */
const isNode = v => v instanceof Node;
const isNodeList = v => NodeList.prototype.isPrototypeOf(v) || HTMLCollection.prototype.isPrototypeOf(v);
const toArray = v => (Array.isArray(v) ? v : (v ? (isNode(v) ? [v] : (isNodeList(v) ? Array.from(v) : [])) : []));
const noop = () => {};

function select(selector, context = document){
  if (!selector) return [];
  if (isNode(selector)) return [selector];
  if (isNodeList(selector)) return Array.from(selector);
  if (typeof selector !== 'string') return [];
  const s = selector.trim();
  if (s[0] === '#' && !s.includes(' ') && !s.includes(',') && !s.includes('[') && !s.includes(':')){
    const el = document.getElementById(s.slice(1));
    return el ? [el] : [];
  }
  if (s[0] === '.' && !s.includes(' ') && !s.includes(',') && !s.includes('[') && !s.includes(':')){
    return Array.from(document.getElementsByClassName(s.slice(1)));
  }
  if (!s.includes(' ') && !s.includes(',') && !s.includes('[') && !s.includes(':') && /^[a-zA-Z0-9-]+$/.test(s)){
    return Array.from(document.getElementsByTagName(s));
  }
  return Array.from((context || document).querySelectorAll(s));
}

function NJ(elements){ this.elements = toArray(elements); }
NJ.prototype._each = function(cb){ this.elements.forEach((el,i)=>cb.call(el,i,el)); return this; };

function nj(p){
  if (p instanceof NJ) return p;
  if (typeof p === 'undefined' || p === null || p === '') return new NJ([]);
  if (typeof p === 'string' || isNode(p) || isNodeList(p)) return new NJ(select(p));
  if (Array.isArray(p)) return new NJ(p.filter(isNode));
  if (p === document || p === window) return new NJ([p]);
  return new NJ([]);
}

/* ==========================================================
   DOM API
   ========================================================== */
NJ.prototype.html = function(v){ if (v===undefined) return this.elements[0]?.innerHTML; return this._each(function(){ this.innerHTML=v; }); };
NJ.prototype.text = function(v){ if (v===undefined) return this.elements[0]?.textContent; return this._each(function(){ this.textContent=v; }); };
NJ.prototype.val = function(v){ if (v===undefined) return this.elements[0]?.value; return this._each(function(){ this.value=v; }); };

// append() — clone-safe
NJ.prototype.append = function(node){
  const cloneNeeded = this.elements.length>1 && isNode(node);
  return this._each(function(i){
    if (typeof node === 'string'){
      this.insertAdjacentHTML('beforeend', node);
    } else {
      const n = (cloneNeeded && i>0) ? node.cloneNode(true) : (node instanceof NJ ? node.elements[0] : node);
      const realNode = isNode(n) ? n : document.createTextNode(String(n));
      this.appendChild(realNode);
    }
  });
};

// prepend() — clone-safe
NJ.prototype.prepend = function(node){
  const cloneNeeded = this.elements.length>1 && isNode(node);
  return this._each(function(i){
    if (typeof node === 'string'){
      this.insertAdjacentHTML('afterbegin', node);
    } else {
      const n = (cloneNeeded && i>0) ? node.cloneNode(true) : (node instanceof NJ ? node.elements[0] : node);
      const realNode = isNode(n) ? n : document.createTextNode(String(n));
      this.insertBefore(realNode, this.firstChild);
    }
  });
};

// before() — clone-safe
NJ.prototype.before = function(node){
  const cloneNeeded = this.elements.length>1 && isNode(node);
  return this._each(function(i){
    if (!this.parentNode) return;
    if (typeof node === 'string'){
      this.insertAdjacentHTML('beforebegin', node);
      return;
    }
    const n = (cloneNeeded && i>0) ? node.cloneNode(true) : (node instanceof NJ ? node.elements[0] : node);
    const realNode = isNode(n) ? n : document.createTextNode(String(n));
    this.parentNode.insertBefore(realNode, this);
  });
};

// after() — clone-safe
NJ.prototype.after = function(node){
  const cloneNeeded = this.elements.length>1 && isNode(node);
  return this._each(function(i){
    if (!this.parentNode) return;
    if (typeof node === 'string'){
      this.insertAdjacentHTML('afterend', node);
      return;
    }
    const n = (cloneNeeded && i>0) ? node.cloneNode(true) : (node instanceof NJ ? node.elements[0] : node);
    const realNode = isNode(n) ? n : document.createTextNode(String(n));
    this.parentNode.insertBefore(realNode, this.nextSibling);
  });
};

NJ.prototype.remove = function(){ return this._each(function(){ this.parentNode?.removeChild(this); }); };
NJ.prototype.parent = function(){ return new NJ([...new Set(this.elements.map(e=>e.parentElement).filter(Boolean))]); };
NJ.prototype.children = function(){ let out=[]; this.elements.forEach(el=>out.push(...el.children)); return new NJ(out); };
NJ.prototype.first = function(){ return new NJ(this.elements[0]?[this.elements[0]]:[]); };
NJ.prototype.last  = function(){ const e=this.elements; return new NJ(e.length?[e[e.length-1]]:[]); };
NJ.prototype.eq    = function(n){ if(n<0) n=this.elements.length+n; return new NJ(this.elements[n]?[this.elements[n]]:[]); };
NJ.prototype.next  = function(){ return new NJ(this.elements.map(e=>e.nextElementSibling).filter(Boolean)); };
NJ.prototype.prev  = function(){ return new NJ(this.elements.map(e=>e.previousElementSibling).filter(Boolean)); };

/* ==========================================================
   ATTRIBUTES / DATA / CLASSES / STYLES
   ========================================================== */
NJ.prototype.attr = function(name,val){ if(val===undefined) return this.elements[0]?.getAttribute(name); return this._each(function(){ this.setAttribute(name,String(val)); }); };
NJ.prototype.removeAttr = function(name){ return this._each(function(){ this.removeAttribute(name); }); };
NJ.prototype.hasAttr = function(name){ return !!this.elements[0]?.hasAttribute(name); };

NJ.prototype.data = function(k,v){ if(v===undefined) return this.elements[0]?.dataset[k]; return this._each(function(){ this.dataset[k]=v; }); };
NJ.prototype.removeData = function(k){ return this._each(function(){ delete this.dataset[k]; }); };

NJ.prototype.addClass = function(cls){ if(!cls) return this; const parts=cls.split(/\s+/).filter(Boolean); return this._each(function(){ this.classList.add(...parts); }); };
NJ.prototype.removeClass = function(cls){ if(!cls) return this; const parts=cls.split(/\s+/).filter(Boolean); return this._each(function(){ this.classList.remove(...parts); }); };
NJ.prototype.toggleClass = function(cls){ return this._each(function(){ this.classList.toggle(cls); }); };
NJ.prototype.hasClass = function(cls){ return !!this.elements[0]?.classList.contains(cls); };
NJ.prototype.classList = function(){ return this.elements[0]?.classList; };

// CSS: hyphens + camelCase support
NJ.prototype.css = function(prop,val){
  if (typeof prop === 'object'){
    return this._each(function(){ for(let p in prop){ if(p.includes('-')) this.style.setProperty(p,prop[p]); else this.style[p]=prop[p]; } });
  }
  if(val===undefined){
    const key = prop.includes('-') ? prop : prop.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
    return this.elements[0] ? getComputedStyle(this.elements[0]).getPropertyValue(key) : undefined;
  }
  return this._each(function(){ if(prop.includes('-')) this.style.setProperty(prop,val); else this.style[prop]=val; });
};

NJ.prototype.removeCss = function(prop){ return this._each(function(){ this.style.removeProperty(prop); }); };
NJ.prototype.computed = function(prop){ return this.elements[0] ? getComputedStyle(this.elements[0]).getPropertyValue(prop) : undefined; };
NJ.prototype.cssVar = function(k,v){ if(v===undefined) return getComputedStyle(document.documentElement).getPropertyValue(k); document.documentElement.style.setProperty(k,v); return this; };

/* ==========================================================
   EVENTS
   ========================================================== */
NJ.prototype.on = function(ev,handler,opts){ return this._each(function(){ this.addEventListener(ev,handler,opts||false); }); };
NJ.prototype.off = function(ev,handler,opts){ return this._each(function(){ this.removeEventListener(ev,handler,opts||false); }); };
NJ.prototype.trigger = function(evName){ return this._each(function(){ this.dispatchEvent(new Event(evName,{bubbles:true,cancelable:true})); }); };

/* ==========================================================
   FORMS
   ========================================================== */
NJ.prototype.checked = function(state){ if(state===undefined) return !!this.elements[0]?.checked; return this._each(function(){ this.checked=!!state; }); };
NJ.prototype.selectValues = function(values,clear=true){ if(!this.elements[0]||this.elements[0].tagName!=='SELECT') return this; const s=this.elements[0]; if(clear) for(let o of s.options) o.selected=false; const vals=Array.isArray(values)?values:String(values).split(',').map(s=>s.trim()); const set=new Set(vals); for(let o of s.options){ if(set.has(o.value)) o.selected=true; } return this; };
NJ.prototype.getSelected = function(){ if(!this.elements[0]) return []; let r=[]; for(let o of this.elements[0].options){ if(o.selected) r.push(o.value||o.text); } return r; };

/* ==========================================================
   AJAX
   ========================================================== */
nj.ajax = {
  post(url,data={},opts={}){
    const headers = opts.headers||{};
    return fetch(url,{
      method:'POST',
      headers:Object.assign({'Content-Type':'application/json'},headers),
      body:JSON.stringify(data)
    }).then(async r=>{
      if(!r.ok){
        const text=await r.text().catch(()=>"");
        const err=new Error(`HTTP ${r.status}: ${r.statusText}`);
        err.status=r.status;
        err.body=text;
        throw err;
      }
      return r.json();
    });
  },
  postForm(url,obj){
    const f=new FormData(); for(let k in obj) f.append(k,obj[k]);
    return fetch(url,{method:'POST',body:f}).then(async r=>{
      if(!r.ok){
        const text=await r.text().catch(()=>"");
        const err=new Error(`HTTP ${r.status}: ${r.statusText}`);
        err.status=r.status;
        err.body=text;
        throw err;
      }
      return r.text();
    });
  }
};

/* ==========================================================
   ANIMATION
   ========================================================== */
function animate(el,kf,opt){ return el.animate(kf,opt).finished; }

NJ.prototype.fadeIn = function(duration=300,display){ return this._each(function(){ this.style.opacity=0; this.style.display=display||'block'; animate(this,[{opacity:0},{opacity:1}],{duration}).catch(noop); }); };
NJ.prototype.fadeOut = function(duration=300){ return this._each(function(){ animate(this,[{opacity:1},{opacity:0}],{duration}).then(()=>{ this.style.display='none'; this.style.opacity=''; }).catch(noop); }); };

NJ.prototype.slideUp = function(duration=300){ return this._each(function(){ const h=this.getBoundingClientRect().height; this.style.overflow='hidden'; animate(this,[{height:h+'px'},{height:'0px'}],{duration}).then(()=>{ this.style.display='none'; this.style.height=''; this.style.overflow=''; }).catch(noop); }); };

NJ.prototype.slideDown = function(duration=300,display){ return this._each(function(){ this.style.display=display||'block'; this.style.height='auto'; const h=this.getBoundingClientRect().height; this.style.height='0px'; this.style.overflow='hidden'; animate(this,[{height:'0px'},{height:h+'px'}],{duration}).then(()=>{ this.style.height=''; this.style.overflow=''; }).catch(noop); }); };

NJ.prototype.getRect = function(){ return this.elements[0]?.getBoundingClientRect(); };
NJ.prototype.getBounding = function(){ return this.elements[0]?.getBoundingClientRect(); };

/* ==========================================================
   SECURITY LOCKDOWN FOR EXEC()
   ========================================================== */
nj.config = { allowExec: false };
nj.exec = function(code){ if(!nj.config.allowExec) throw new Error("nj.exec disabled. Enable via nj.config.allowExec=true"); return (new Function(code))(); };
nj.exC  = function(code){ if(!nj.config.allowExec) throw new Error("nj.exC disabled. Enable via nj.config.allowExec=true"); return (new Function(code))(); };

/* ==========================================================
   GLOBAL EXPOSURE
   ========================================================== */
global.nj = nj;

})(window);
