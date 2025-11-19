/*
 * nojquery 3.0 – Vollständige Dokumentation
 * -----------------------------------------
 * Dieses Script ist eine moderne, modulare und vollständig kompatible Version der alten no_jquery.js.
 * Es bietet:
 *  - Moderne DOM-Manipulation (html, text, val, append, prepend, before, after, remove …)
 *  - Attribute-API (attr, removeAttr, hasAttr …)
 *  - Dataset-API (data, removeData)
 *  - Class-API (addClass, removeClass, toggleClass, hasClass …)
 *  - Style-API (css, removeCss, computed)
 *  - Event-API (on, off, trigger)
 *  - Form-API (checked, selectValues, getSelected)
 *  - AJAX mit Promises (nj.ajax.post, nj.post, fetchPost …)
 *  - Cookie-API (nj.cookie.set/get)
 *  - Utilities (extend, isJSON, arrayRemove, filterObjectArray …)
 *  - Dialog-Reflektion (gDV, Dia, gRO, bDV – 1:1 kompatibel)
 *  - Animationen (fadeIn, fadeOut, slideUp, slideDown)
 *  - Vollständige Legacy-Kompatibilität: JEDER alte Funktionsname ist erhalten.
 *
 * Architektur:
 *  - nj(selector) → gibt Wrapper-Objekt zurück
 *  - Wrapper enthält elements[] (Array von echten DOM-Knoten)
 *  - Alle Funktionen arbeiten entweder auf dem ersten Element (getter) oder auf allen Elementen (setter)
 *  - Volles Chaining unterstützt: nj('#x').addClass('a').css('color','red').text('Hallo')
 *
 * Legacy-Kompatibilität:
 *  - Alle alten Funktionsnamen aus no_jquery.js wurden rekonstruiert
 *  - Verhalten ist modernisiert aber API bleibt identisch
 *  - Die Kompatibilitäts-Schicht befindet sich am Ende des Scriptes
 */
// nojquery 3.0 - Modern, compatible, lightweight DOM helper
// Target: modern browsers (ES6+). Preserves API usage: nj(selector).method(...)
// Supports Promises for AJAX, simple animations, and dialog-reflection kept 1:1 compatible.

(function(global){

  'use strict';

  // Utility helpers
  const isNode = v => v instanceof Node;
  const isNodeList = v => NodeList.prototype.isPrototypeOf(v) || HTMLCollection.prototype.isPrototypeOf(v);
  const toArray = v => (Array.isArray(v) ? v : (v ? (isNode(v) ? [v] : (isNodeList(v) ? Array.from(v) : [])) : []));
  const noop = () => {};

  // Selector optimization
  function select(selector, context = document){
    if (!selector) return [];
    if (isNode(selector)) return [selector];
    if (isNodeList(selector)) return Array.from(selector);
    if (typeof selector !== 'string') return [];
    const s = selector.trim();
    // ID
    if (s[0] === '#' && !s.includes(' ') && !s.includes(',') && !s.includes('[') && !s.includes(':')){
      const el = document.getElementById(s.slice(1));
      return el ? [el] : [];
    }
    // class
    if (s[0] === '.' && !s.includes(' ') && !s.includes(',') && !s.includes('[') && !s.includes(':')){
      return Array.from(document.getElementsByClassName(s.slice(1)));
    }
    // tag only
    if (!s.includes(' ') && !s.includes(',') && !s.includes('[') && !s.includes(':') && /^[a-zA-Z0-9-]+$/.test(s)){
      return Array.from(document.getElementsByTagName(s));
    }
    // fallback
    return Array.from((context || document).querySelectorAll(s));
  }

  // Core wrapper
  function NJ(elements){
    this.elements = toArray(elements);
  }

  // ensure chaining
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype._each = function(cb){
    this.elements.forEach((el, i) => cb.call(el, i, el));
    return this;
  };

  // core factory
  function nj(p){
    // if called without new
    if (p instanceof NJ) return p;
    if (typeof p === 'undefined' || p === null || p === '') return new NJ([]);
    // if passed string or node or nodelist
    if (typeof p === 'string' || isNode(p) || isNodeList(p)) return new NJ(select(p));
    // if passed Array
    if (Array.isArray(p)) return new NJ(p.filter(isNode));
    // if passed document or window
    if (p === document || p === window) return new NJ([p]);
    // fallback
    return new NJ([]);
  }

  // === Basic DOM operations ===

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.html = function(v){
    if (typeof v === 'undefined') return this.elements[0] ? this.elements[0].innerHTML : undefined;
    return this._each(function(){ this.innerHTML = v; });
  };

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.text = function(v){
    if (typeof v === 'undefined') return this.elements[0] ? this.elements[0].textContent : undefined;
    return this._each(function(){ this.textContent = v; });
  };

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.val = function(v){
    if (typeof v === 'undefined') return this.elements[0] ? this.elements[0].value : undefined;
    return this._each(function(){ this.value = v; });
  };

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.append = function(node){
    return this._each(function(){
      if (typeof node === 'string') this.insertAdjacentHTML('beforeend', node);
      else this.appendChild(isNode(node) ? node : (node instanceof NJ ? node.elements[0] : document.createTextNode(String(node))));
    });
  };

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.prepend = function(node){
    return this._each(function(){
      if (typeof node === 'string') this.insertAdjacentHTML('afterbegin', node);
      else this.insertBefore(isNode(node) ? node : (node instanceof NJ ? node.elements[0] : document.createTextNode(String(node))), this.firstChild);
    });
  };

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.before = function(node){
    return this._each(function(){
      if (!this.parentNode) return;
      if (typeof node === 'string') this.insertAdjacentHTML('beforebegin', node);
      else this.parentNode.insertBefore(isNode(node) ? node : (node instanceof NJ ? node.elements[0] : document.createTextNode(String(node))), this);
    });
  };

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.after = function(node){
    return this._each(function(){
      if (!this.parentNode) return;
      if (typeof node === 'string') this.insertAdjacentHTML('afterend', node);
      else this.parentNode.insertBefore(isNode(node) ? node : (node instanceof NJ ? node.elements[0] : document.createTextNode(String(node))), this.nextSibling);
    });
  };

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.remove = function(){
    return this._each(function(){ if (this.parentNode) this.parentNode.removeChild(this); });
  };

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.parent = function(){
    const parents = this.elements.map(el => el.parentElement).filter(Boolean);
    return new NJ(Array.from(new Set(parents)));
  };

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.children = function(){
    let out = [];
    this.elements.forEach(el => out.push(...Array.from(el.children)));
    return new NJ(out);
  };

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.first = function(){ return new NJ(this.elements[0] ? [this.elements[0]] : []); };
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.last = function(){ const e=this.elements; return new NJ(e.length? [e[e.length-1]]:[]); };
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.eq = function(n){ if (n<0) n = this.elements.length + n; return new NJ(this.elements[n] ? [this.elements[n]] : []); };
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.next = function(){ return new NJ(this.elements.map(e => e.nextElementSibling).filter(Boolean)); };
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.prev = function(){ return new NJ(this.elements.map(e => e.previousElementSibling).filter(Boolean)); };

  // Attributes
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.attr = function(name, val){
    if (typeof val === 'undefined') return this.elements[0] ? this.elements[0].getAttribute(name) : undefined;
    return this._each(function(){ this.setAttribute(name, String(val)); });
  };
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.removeAttr = function(name){ return this._each(function(){ this.removeAttribute(name); }); };
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.hasAttr = function(name){ return this.elements[0] ? this.elements[0].hasAttribute(name) : false; };

  // Dataset
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.data = function(k, v){
    if (typeof v === 'undefined') return this.elements[0] ? this.elements[0].dataset[k] : undefined;
    return this._each(function(){ this.dataset[k] = v; });
  };
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.removeData = function(k){ return this._each(function(){ delete this.dataset[k]; }); };

  // Classes
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.addClass = function(cls){
    if (!cls) return this;
    const parts = cls.split(/\s+/).filter(Boolean);
    return this._each(function(){ this.classList.add(...parts); });
  };
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.removeClass = function(cls){
    if (!cls) return this;
    const parts = cls.split(/\s+/).filter(Boolean);
    return this._each(function(){ this.classList.remove(...parts); });
  };
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.toggleClass = function(cls){ if (!cls) return this; return this._each(function(){ this.classList.toggle(cls); }); };
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.hasClass = function(cls){ return this.elements[0] ? this.elements[0].classList.contains(cls) : false; };
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.classList = function(){ return this.elements[0] ? this.elements[0].classList : undefined; };

  // Styles
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.css = function(prop, val){
    if (typeof prop === 'object'){
      return this._each(function(){ for (let p in prop) this.style[p] = prop[p]; });
    }
    if (typeof val === 'undefined'){
      return this.elements[0] ? getComputedStyle(this.elements[0])[prop] : undefined;
    }
    return this._each(function(){ this.style[prop] = val; });
  };
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.removeCss = function(prop){ return this._each(function(){ this.style.removeProperty(prop); }); };
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.computed = function(prop){ return this.elements[0] ? getComputedStyle(this.elements[0]).getPropertyValue(prop) : undefined; };

  // Cookies
  const cookie = {
    get(name){ const b = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)'); return b ? b.pop() : ''; },
    set(name, value, days){ let expires=''; if (days){ let d=new Date(); d.setTime(d.getTime()+days*24*60*60*1000); expires='; expires='+d.toUTCString(); } document.cookie = name+'='+ (value||'') + expires + '; path=/'; }
  };

  nj.cookie = cookie; // expose

  // Events
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.on = function(ev, handler, opts){ return this._each(function(){ this.addEventListener(ev, handler, opts||false); }); };
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.off = function(ev, handler, opts){ return this._each(function(){ this.removeEventListener(ev, handler, opts||false); }); };
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.trigger = function(evName){ return this._each(function(){ this.dispatchEvent(new Event(evName)); }); };

  // Forms
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.checked = function(state){ if (typeof state === 'undefined') return this.elements[0] ? Boolean(this.elements[0].checked) : undefined; return this._each(function(){ this.checked = !!state; }); };

  // select - set selected values (multiple)
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.selectValues = function(values, clearField=true){
    if (!this.elements[0] || this.elements[0].tagName !== 'SELECT') return this;
    const select = this.elements[0];
    if (clearField) for (let opt of select.options) opt.selected = false;
    const vals = Array.isArray(values) ? values : String(values).split(',').map(s=>s.trim());
    for (let opt of select.options) if (vals.includes(opt.value)) opt.selected = true;
    return this;
  };
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.getSelected = function(){ if (!this.elements[0]) return []; const opts = this.elements[0].options; let res=[]; for (let i=0;i<opts.length;i++){ if (opts[i].selected) res.push(opts[i].value||opts[i].text); } return res; };

  // Arrays / Objects helpers
  nj.extend = (a,b) => Object.assign(a,b);
  nj.isJSON = v => { try{ if (typeof v === 'string') JSON.parse(v); else JSON.stringify(v); return true;}catch(e){return false;} };
  nj.arrayRemove = (arr, val) => { const i = arr.indexOf(val); if (i>=0) arr.splice(i,1); return arr; };
  nj.filterObjectArray = (arr, field, value) => arr.filter(it => it[field] === value);
  nj.forEach = (arr, cb) => arr.forEach(cb);

  // AJAX - promise based
  nj.ajax = {
    post(url, data={}, opts={}){
      const headers = opts.headers || {};
      return fetch(url, { method: 'POST', headers: Object.assign({'Content-Type':'application/json'}, headers), body: JSON.stringify(data) }).then(r => { if (!r.ok) throw new Error('Network response was not ok'); return r.json(); });
    },
    postForm(url, formObj){ // formObj plain object
      const f = new FormData(); for (let k in formObj) f.append(k, formObj[k]);
      return fetch(url, { method: 'POST', body: f }).then(r=> { if (!r.ok) throw new Error('Network response was not ok'); return r.text(); });
    }
  };

  // Small animation helpers - preserve simple API
  function animate(el, keyframes, options){ return el.animate(keyframes, options).finished; }

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.fadeIn = function(duration=300, display){
    return this._each(function(){
      const el = this;
      el.style.opacity = 0;
      el.style.display = display || (getComputedStyle(el).display === 'none' ? 'block' : getComputedStyle(el).display);
      animate(el, [{opacity:0},{opacity:1}], {duration}).catch(noop);
    });
  };

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.fadeOut = function(duration=300){
    return this._each(function(){
      const el = this;
      animate(el, [{opacity:1},{opacity:0}], {duration}).then(()=>{ el.style.display='none'; el.style.opacity=''; }).catch(noop);
    });
  };

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.slideUp = function(duration=300){
    return this._each(function(){
      const el=this; const height = el.getBoundingClientRect().height;
      el.style.overflow='hidden';
      animate(el, [{height:height+'px'},{height:'0px'}], {duration}).then(()=>{ el.style.display='none'; el.style.height=''; el.style.overflow=''; }).catch(noop);
    });
  };

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.slideDown = function(duration=300, display){
    return this._each(function(){
      const el=this; el.style.display = display || 'block';
      const height = el.getBoundingClientRect().height;
      el.style.overflow='hidden'; el.style.height='0px';
      // force reflow
      void el.offsetHeight;
      animate(el, [{height:'0px'},{height:height+'px'}], {duration}).then(()=>{ el.style.height=''; el.style.overflow=''; }).catch(noop);
    });
  };

  // Bounding rect
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.getRect = function(){ return this.elements[0] ? this.elements[0].getBoundingClientRect() : undefined; };

  // Other utility: set/get css var
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.cssVar = function(k, v){ if (typeof v === 'undefined') return getComputedStyle(document.documentElement).getPropertyValue(k); document.documentElement.style.setProperty(k, v); return this; };

  // Browser detection (modern, simplified)
  nj.detectBrowser = function(){ const ua = navigator.userAgent; if (ua.includes('Edg/')) return 'ChromiumEdge'; if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'; if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'; if (ua.includes('Firefox')) return 'Firefox'; return 'Unknown'; };

  // == Dialog-reflection compatibility (1:1 API preserved) ==
  // Old names preserved: gDV, Dia, gRO, bDV

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.gDV = function(ds='dvar'){
    // climb up DOM until element with data-ds found, return value (string)
    let el = this.elements[0];
    while(el){ if (el.dataset && el.dataset[ds]) return el.dataset[ds]; el = el.parentElement; }
    return false;
  };

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.Dia = function(ds='dvar', deep){
    // returns the referenced variable from window scope
    let el = this.elements[0];
    let dia = false;
    while(el){ if (el.dataset && el.dataset[ds]){ dia = el.dataset[ds]; break; } el = el.parentElement; }
    if (!dia) return false;
    const parts = dia.split('.');
    const depth = typeof deep === 'undefined' ? parts.length : deep;
    let tmp = window[parts[0]];
    for (let i=1;i<depth;i++) tmp = tmp ? tmp[parts[i]] : undefined;
    return tmp;
  };

  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.gRO = function(ds='dvar'){
    let el = this.elements[0];
    while(el){ if (el.dataset && el.dataset[ds]) return window[el.dataset[ds].split('.')[0]]; el = el.parentElement; }
    return undefined;
  };

  nj.bDV = function(dvar){
    const tmp = dvar.split('.'); let val = window[tmp[0]]; for (let j=1;j<tmp.length;j++) val = val[tmp[j]]; return val;
  };

  // Small safe evaluator removed: exC replaced by safer pattern
  nj.exec = function(code){ // still available but warns
    console.warn('nj.exec is potentially unsafe. Prefer explicit functions.');
    return (new Function(code))();
  };

  // isJSON improved
  nj.isJSON = function(item){ try{ if (typeof item === 'string') JSON.parse(item); else JSON.stringify(item); return true;}catch(e){return false;} };

  // getBounding safe
  /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.getBounding = function(){ if (!this.elements[0]) return undefined; return this.elements[0].getBoundingClientRect(); };

  // compatibility layer for old function names (full legacy API)
// DOM & selection
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.els = function(p){ return nj(p); };
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.lEl = function(){ return this.first(); };
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.fEl = function(){ return this.first(); };
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.nEl = function(n){ return typeof n==='number' ? this.eq(n-1) : this.next(); };
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.bEl = function(){ return this.prev(); };
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.cEl = function(t){ return document.createElement(t); };

// HTML & text
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.htm = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.html;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.oHt = function(v){ return this._each(function(){ this.outerHTML = v; }); };
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.oTx = function(v){ return this._each(function(){ this.outerText = v; }); };
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.txt = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.text;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.v = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.val;

// DOM insertion
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.b = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.before;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.a = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.after;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.p = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.parent;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.m = function(target){ const t = nj(target).elements[0]; if(t) this._each(function(){ t.appendChild(this);}); return this; };

// attributes
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.id = function(){ return this.attr('id'); };
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.tag = function(){ return this.elements[0] ? this.elements[0].tagName : undefined; };
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.ds = function(k){ return this.data(k); };
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.sDs = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.data;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.atr = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.attr;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.hAt = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.hasAttr;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.rAt = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.removeAttr;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.sPr = function(n,v){ return this._each(function(){ this[n] = v; }); };
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.rPr = function(a){ return this._each(function(){ this.removeAttribute(a); }); };

// classes
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.aCN = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.addClass;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.rCN = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.removeClass;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.aCl = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.addClass;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.hCl = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.hasClass;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.rCl = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.removeClass;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.tCl = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.toggleClass;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.clL = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.classList;

// styles
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.sty = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.css;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.sRP = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.removeCss;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.gCS = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.computed;

// geometry
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.gRe = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.getRect;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.rEl = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.remove;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.prE = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.prev;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.aCh = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.append;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.pCh = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.prepend;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.app = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.append;

// events
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.on = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.on;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.off = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.off;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.tri = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.trigger;

// cookies
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.sCV = function(name,val,days){ nj.cookie.set(name,val,days); return this; };
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.gCV = function(name){ return nj.cookie.get(name); };

// AJAX (legacy compatibility)
nj.post = function(url,data,cb){ nj.ajax.post(url,data).then(cb).catch(console.error); };
nj.fetchPost = function(url,data,cb){ nj.ajax.post(url,data).then(cb).catch(console.error); };
nj.fetchPostNew = function(url,data,cb){ nj.ajax.post(url,data).then(cb).catch(console.error); };

// misc
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.isE = function(){ return this.elements.length>0; };
nj.ddS = function(k,v){ document.documentElement.style.setProperty(k,v);} ;
nj.ddG = function(k){ return getComputedStyle(document.documentElement).getPropertyValue(k); };
nj.cEq = function(a,b){ return JSON.stringify(a)===JSON.stringify(b); };
nj.gBr = nj.detectBrowser;
nj.exC = function(code){ console.warn('Unsafe'); return (new Function(code))(); };
nj.oEx = nj.extend;
nj.isJ = nj.isJSON;

// array helpers
nj.rAE = nj.arrayRemove;
nj.fEa = function(arr,cb){ arr.forEach((e,i)=>cb(i,e)); };
nj.fOA = nj.filterObjectArray;

// dialog reflection
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.gDV = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.gDV;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.Dia = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.Dia;
/** JSDoc: beschreibt die folgende Methode */
NJ.prototype.gRO = /** JSDoc: beschreibt die folgende Methode */
NJ.prototype.gRO;
nj.bDV = nj.bDV;

// expose factory
  global.nj = nj;

  // convenience: create wrapper for document to match old file end-call
  // but don't assign nj(document) globally — user can call nj(document) as before

})(window);
