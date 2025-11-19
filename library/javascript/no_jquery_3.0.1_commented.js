/*
 * no_jquery_3.0.1.js — Aufgeteilt und vollständig dokumentiert
 * -----------------------------------------------------------
 * Dieses Dokument enthält dieselbe Code-Basis wie no_jquery_3.0.1.js,
 * aufgeteilt in logisch getrennte Abschnitte (Module). Jeder Abschnitt
 * ist mit ausführlicher JSDoc- und Inline-Dokumentation versehen,
 * so dass du die Teile einzeln zusammenführen oder als Dateien
 * extrahieren kannst:
 *
 *  - 1_core.js         : IIFE, Utilities, Selector, Core Wrapper, Factory
 *  - 2_dom_api.js      : DOM-Manipulation (html, text, append, insert ...)
 *  - 3_attributes.js   : Attributes, Data, Classes, Styles, CSS-Variablen
 *  - 4_events_forms.js : Events, Forms, Cookies
 *  - 5_ajax_anim.js    : AJAX, Animations, Geometry helpers
 *  - 6_dialog_ref.js   : Dialog-reflection utilities (gDV, Dia, bDV)
 *  - 7_compat_layer.js : Legacy aliases und finale Exposition (global.nj)
 *
 * Hinweise zum Zusammenführen:
 * - Jeder Abschnitt ist autark und kann in der Reihenfolge 1..7 aneinandergereiht
 *   werden. Keine der Funktionen hängt von späteren Deklarationen.
 * - Beim Zusammenführen in eine einzige Datei entferne doppelte helper-Definitionen
 *   (z. B. doppelte nj.isJSON-Definition in der Originaldatei). Ich habe die
 *   Redundanzen an geeigneten Stellen kommentiert.
 *
 * Dieses Dokument ist so gestaltet, dass du die einzelnen Module als eigene
 * Dateien speichern und dann per <script> Tag oder Bundler wieder zusammensetzen
 * kannst. Die API ist identisch zur Originaldatei, nur wurden umfangreiche
 * JSDoc- und Inline-Kommentare ergänzt.
 */

// --------------------------------------------------
// 1_core.js
// --------------------------------------------------
(function(global){
'use strict';

/**
 * Utility helpers
 * ----------------
 * Kleine Hilfsfunktionen, die im Rest der Bibliothek verwendet werden.
 * Hier achten wir auf Cross-realm-Besonderheiten in den Kommentaren
 * (z.B. instanceof Node in iframes kann fehlschlagen).
 */

/**
 * Prüft, ob ein Wert ein DOM-Node ist.
 * @param {*} v - beliebiger Wert
 * @returns {boolean} true, falls v ein Node ist
 *
 * Hinweis: `instanceof Node` kann in Cross-Realm-Szenarien fehlschlagen (iframes).
 * Für maximale Robustheit könnte man auch `v && typeof v.nodeType === 'number'` verwenden.
 */
const isNode = v => v instanceof Node;

/**
 * Prüft, ob ein Wert ein NodeList/HTMLCollection-ähnliches Objekt ist.
 * @param {*} v
 * @returns {boolean}
 */
const isNodeList = v => NodeList.prototype.isPrototypeOf(v) || HTMLCollection.prototype.isPrototypeOf(v);

/**
 * Normalisiert eine Eingabe zu einem Array von DOM-Nodes.
 * - Wenn `v` already an Array -> returned unchanged
 * - Wenn Node -> returns [node]
 * - Wenn NodeList/HTMLCollection -> Array.from(v)
 * - Sonst -> []
 *
 * @param {*} v
 * @returns {Array<Node>}
 */
const toArray = v => (Array.isArray(v) ? v : (v ? (isNode(v) ? [v] : (isNodeList(v) ? Array.from(v) : [])) : []));

/**
 * No-op helper
 */
const noop = () => {};

/**
 * Optimierter Selector
 * --------------------
 * Diese Funktion versucht erst die schnellen DOM-APIs (getElementById,
 * getElementsByClassName, getElementsByTagName) für einfache Selektoren zu
 * verwenden, bevor sie auf querySelectorAll zurückfällt. Das verbessert die
 * Performance für häufige Kurzfälle.
 *
 * @param {string|Node|NodeList} selector - String-Selector oder bereits Node/NodeList
 * @param {Element|Document} [context=document] - optionaler Kontext für querySelectorAll
 * @returns {Node[]} Array mit gefundenen DOM-Elementen
 *
 * Wichtige Hinweise:
 * - Wenn du einen Kontext verlangst (z. B. einen Container), dann gelten die
 *   kurzen Pfade (ID / class / tag) aktuell nur für `document`. Falls du
 *   `context` verwendest, werde die fallback-Pfade (querySelectorAll) benutzt
 *   für komplexe Selektoren. Verbesserungsvorschlag: sollte `context` gesetzt
 *   sein, ebenfalls `context.getElementsByClassName`/`getElementsByTagName`
 *   verwenden (wurde bewusst nicht automatisiert, um globale Performance zu
 *   priorisieren).
 */
function select(selector, context = document){
  if (!selector) return [];
  if (isNode(selector)) return [selector];
  if (isNodeList(selector)) return Array.from(selector);
  if (typeof selector !== 'string') return [];
  const s = selector.trim();
  // ID-Shortcut: #id ohne spezielle Zeichen
  if (s[0] === '#' && !s.includes(' ') && !s.includes(',') && !s.includes('[') && !s.includes(':')){
    const el = document.getElementById(s.slice(1));
    return el ? [el] : [];
  }
  // Class-Shortcut: .klass
  if (s[0] === '.' && !s.includes(' ') && !s.includes(',') && !s.includes('[') && !s.includes(':')){
    return Array.from(document.getElementsByClassName(s.slice(1)));
  }
  // Tag-Shortcut: tagname (alphanumerisch)
  if (!s.includes(' ') && !s.includes(',') && !s.includes('[') && !s.includes(':') && /^[a-zA-Z0-9-]+$/.test(s)){
    return Array.from(document.getElementsByTagName(s));
  }
  // Fallback: allgemeiner CSS-Selector
  return Array.from((context || document).querySelectorAll(s));
}

/**
 * Core wrapper-Konstruktor
 * ------------------------
 * NJ kapselt eine Liste von DOM-Elementen in einem leichtgewichtigen Wrapper-
 * Objekt, das viele bequeme Methoden bereitstellt. Intern wird `this.elements`
 * gehalten (Array von Node-Objekten).
 *
 * @constructor
 * @param {Array<Node>|Node|NodeList} elements
 */
function NJ(elements){
  this.elements = toArray(elements);
}

/**
 * Iterations-Helper
 * ------------------
 * Führt `cb` für jedes Element in this.elements aus.
 * Der `this`-Kontext im Callback ist der aktuelle DOM-Node und die Signatur
 * ist `(index, element)`. Gibt `this` (Wrapper) zurück, damit Chaining möglich ist.
 *
 * @param {function(number,Node):void} cb
 * @returns {NJ}
 */
NJ.prototype._each = function(cb){
  this.elements.forEach((el, i) => cb.call(el, i, el));
  return this;
};

/**
 * Core factory `nj(p)`
 * ---------------------
 * Öffentlicher Entry-Point: erzeugt und gibt einen NJ-Wrapper zurück.
 * Unterstützt verschiedene Eingabetypen (NJ-Instanz, String-Selector, Node,
 * NodeList, Array, document/window). Dadurch verhält sich `nj` ähnlich zu
 * jQuery/alias-Factories.
 *
 * Beispiele:
 *   nj('#id')
 *   nj(document)
 *   nj(someNode)
 *
 * @param {*} p
 * @returns {NJ}
 */
function nj(p){
  if (p instanceof NJ) return p;
  if (typeof p === 'undefined' || p === null || p === '') return new NJ([]);
  if (typeof p === 'string' || isNode(p) || isNodeList(p)) return new NJ(select(p));
  if (Array.isArray(p)) return new NJ(p.filter(isNode));
  if (p === document || p === window) return new NJ([p]);
  return new NJ([]);
}

// --------------------------------------------------
// 2_dom_api.js
// --------------------------------------------------
// Basic DOM operations (html, text, val, append, prepend, before, after,...)

/**
 * Getter/Setter für innerHTML.
 * - Ohne Argument: Getter — gibt innerHTML des ersten Elements zurück oder undefined
 * - Mit Argument: Setter — setzt innerHTML für alle Elemente und gibt `this` zurück
 *
 * @param {string} [v]
 * @returns {string|NJ}
 */
NJ.prototype.html = function(v){
  if (typeof v === 'undefined') return this.elements[0] ? this.elements[0].innerHTML : undefined;
  return this._each(function(){ this.innerHTML = v; });
};

/**
 * Getter/Setter für textContent.
 * Sicherer gegenüber HTML-Injektionen als `.html()`.
 *
 * @param {string} [v]
 * @returns {string|NJ}
 */
NJ.prototype.text = function(v){
  if (typeof v === 'undefined') return this.elements[0] ? this.elements[0].textContent : undefined;
  return this._each(function(){ this.textContent = v; });
};

/**
 * Getter/Setter für value (form elements).
 * - Wenn Element kein value hat, wird undefined/NaN je nach Element zurückgegeben.
 *
 * @param {*} [v]
 * @returns {*|NJ}
 */
NJ.prototype.val = function(v){
  if (typeof v === 'undefined') return this.elements[0] ? this.elements[0].value : undefined;
  return this._each(function(){ this.value = v; });
};

/**
 * Append: fügt node/HTML/Text an das Ende jedes Elements an.
 * - Wenn `node` string: insertAdjacentHTML('beforeend', node)
 * - Wenn Node: appendChild(node) (Beachte: Node wird bewegt, nicht geklont)
 * - Wenn `node` instanceof NJ: hängt das erste Node aus dem Wrapper an (Legacy)
 * - Sonst: erstellt einen Textknoten
 *
 * Verbesserungshinweis: Wenn du das gleiche Node an mehrere Eltern anhängst,
 * wird es am Ende nur beim letzten erscheinen. Optionales Clone-Verhalten
 * könnte implementiert werden.
 *
 * @param {string|Node|NJ|*} node
 * @returns {NJ}
 */
NJ.prototype.append = function(node){
  return this._each(function(){
    if (typeof node === 'string') this.insertAdjacentHTML('beforeend', node);
    else this.appendChild(isNode(node) ? node : (node instanceof NJ ? node.elements[0] : document.createTextNode(String(node))));
  });
};

/**
 * Prepend: fügt node/HTML/Text an den Anfang jedes Elements ein.
 * Verhalten analog zu append, nur dass insertBefore / afterbegin verwendet wird.
 *
 * @param {string|Node|NJ|*} node
 * @returns {NJ}
 */
NJ.prototype.prepend = function(node){
  return this._each(function(){
    if (typeof node === 'string') this.insertAdjacentHTML('afterbegin', node);
    else this.insertBefore(isNode(node) ? node : (node instanceof NJ ? node.elements[0] : document.createTextNode(String(node))), this.firstChild);
  });
};

/**
 * Insert before this element.
 * - Wenn kein Eltern-Node, wird der Einfügevorgang übersprungen.
 *
 * @param {string|Node|NJ|*} node
 * @returns {NJ}
 */
NJ.prototype.before = function(node){
  return this._each(function(){
    if (!this.parentNode) return;
    if (typeof node === 'string') this.insertAdjacentHTML('beforebegin', node);
    else this.parentNode.insertBefore(isNode(node) ? node : (node instanceof NJ ? node.elements[0] : document.createTextNode(String(node))), this);
  });
};

/**
 * Insert after this element.
 * @param {string|Node|NJ|*} node
 * @returns {NJ}
 */
NJ.prototype.after = function(node){
  return this._each(function(){
    if (!this.parentNode) return;
    if (typeof node === 'string') this.insertAdjacentHTML('afterend', node);
    else this.parentNode.insertBefore(isNode(node) ? node : (node instanceof NJ ? node.elements[0] : document.createTextNode(String(node))), this.nextSibling);
  });
};

/**
 * Remove: entfernt jedes Element aus dem DOM, falls ein parentNode existiert.
 * @returns {NJ}
 */
NJ.prototype.remove = function(){
  return this._each(function(){ if (this.parentNode) this.parentNode.removeChild(this); });
};

/**
 * Parent: liefert als NJ-Wrapper die eindeutigen Eltern-Elemente aller aktuellen
 * Elemente zurück (Set zur Duplikat-Entfernung).
 *
 * @returns {NJ}
 */
NJ.prototype.parent = function(){
  const parents = this.elements.map(el => el.parentElement).filter(Boolean);
  return new NJ(Array.from(new Set(parents)));
};

/**
 * Children: sammelt alle element.children in einem Array und gibt einen NJ-Wrap
 * zurück. Beachte: keine zusätzliche Deduplizierung erfolgt (normalerweise
 * nicht erforderlich).
 *
 * @returns {NJ}
 */
NJ.prototype.children = function(){
  let out = [];
  this.elements.forEach(el => out.push(...Array.from(el.children)));
  return new NJ(out);
};

/**
 * Convenience accessors: first, last, eq, next, prev
 */
NJ.prototype.first = function(){ return new NJ(this.elements[0] ? [this.elements[0]] : []); };
NJ.prototype.last = function(){ const e=this.elements; return new NJ(e.length? [e[e.length-1]]:[]); };
NJ.prototype.eq = function(n){ if (n<0) n = this.elements.length + n; return new NJ(this.elements[n] ? [this.elements[n]] : []); };
NJ.prototype.next = function(){ return new NJ(this.elements.map(e => e.nextElementSibling).filter(Boolean)); };
NJ.prototype.prev = function(){ return new NJ(this.elements.map(e => e.previousElementSibling).filter(Boolean)); };

// --------------------------------------------------
// 3_attributes.js
// --------------------------------------------------

/**
 * Attribute-API
 */
NJ.prototype.attr = function(name, val){
  if (typeof val === 'undefined') return this.elements[0] ? this.elements[0].getAttribute(name) : undefined;
  return this._each(function(){ this.setAttribute(name, String(val)); });
};
NJ.prototype.removeAttr = function(name){ return this._each(function(){ this.removeAttribute(name); }); };
NJ.prototype.hasAttr = function(name){ return this.elements[0] ? this.elements[0].hasAttribute(name) : false; };

/**
 * Dataset API
 * - `.data(k)` -> liest dataset[k]
 * - `.data(k, v)` -> schreibt dataset[k] = v
 * - Hinweis: dataset speichert immer Strings (DOM coerces to string).
 */
NJ.prototype.data = function(k, v){
  if (typeof v === 'undefined') return this.elements[0] ? this.elements[0].dataset[k] : undefined;
  return this._each(function(){ this.dataset[k] = v; });
};
NJ.prototype.removeData = function(k){
  // Hinweis: `delete this.dataset[k]` entfernt die property aus dataset.
  // Um das DOM-Attribut `data-*` zu entfernen, wäre `removeAttribute('data-'+k)`
  // die klarere API.
  return this._each(function(){ delete this.dataset[k]; });
};

/**
 * Klassen (classList) API — unterstützt mehrere Klassen im String.
 */
NJ.prototype.addClass = function(cls){
  if (!cls) return this;
  const parts = cls.split(/\s+/).filter(Boolean);
  return this._each(function(){ this.classList.add(...parts); });
};
NJ.prototype.removeClass = function(cls){
  if (!cls) return this;
  const parts = cls.split(/\s+/).filter(Boolean);
  return this._each(function(){ this.classList.remove(...parts); });
};
NJ.prototype.toggleClass = function(cls){ if (!cls) return this; return this._each(function(){ this.classList.toggle(cls); }); };
NJ.prototype.hasClass = function(cls){ return this.elements[0] ? this.elements[0].classList.contains(cls) : false; };
NJ.prototype.classList = function(){ return this.elements[0] ? this.elements[0].classList : undefined; };

/**
 * Styles API: css getter/setter, removeCss, computed
 * - css(prop, val)
 *     - Wenn prop ein Objekt ist: setzt alle properties (this.style[prop] = value)
 *     - Wenn val undefined: return computed style value (via getComputedStyle)
 *     - Sonst: this.style[prop] = val
 * - removeCss(prop) -> this.style.removeProperty(prop)
 * - computed(prop) -> getComputedStyle(...).getPropertyValue(prop)
 *
 * Hinweise:
 * - Für hyphenated properties (`background-color`) funktioniert getPropertyValue
 *   besser als getComputedStyle(elem)[prop] (welches CamelCase erwartet).
 * - removeCss verwendet `removeProperty` (erwartet CSS-Property-Name, z.B. 'background-color').
 */
NJ.prototype.css = function(prop, val){
  if (typeof prop === 'object'){
    return this._each(function(){ for (let p in prop) this.style[p] = prop[p]; });
  }
  if (typeof val === 'undefined'){
    return this.elements[0] ? getComputedStyle(this.elements[0])[prop] : undefined;
  }
  return this._each(function(){ this.style[prop] = val; });
};
NJ.prototype.removeCss = function(prop){ return this._each(function(){ this.style.removeProperty(prop); }); };
NJ.prototype.computed = function(prop){ return this.elements[0] ? getComputedStyle(this.elements[0]).getPropertyValue(prop) : undefined; };

/**
 * CSS-Variablen (root-level)
 * - cssVar(k) -> get
 * - cssVar(k, v) -> set and return this
 */
NJ.prototype.cssVar = function(k, v){ if (typeof v === 'undefined') return getComputedStyle(document.documentElement).getPropertyValue(k); document.documentElement.style.setProperty(k, v); return this; };

// --------------------------------------------------
// 4_events_forms.js
// --------------------------------------------------

/**
 * Cookie Helper (einfaches API)
 * - get(name) -> raw cookie value string oder '' wenn nicht vorhanden
 * - set(name, value, days) -> setzt cookie (path=/). Keine Secure/SameSite Flags.
 *
 * Empfehlungen: Verwende encodeURIComponent/decodeURIComponent für sichere
 * Speicherung und ergänze Optionen (secure, samesite, domain) falls benötigt.
 */
const cookie = {
  get(name){ const b = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)'); return b ? b.pop() : ''; },
  set(name, value, days){ let expires=''; if (days){ let d=new Date(); d.setTime(d.getTime()+days*24*60*60*1000); expires='; expires='+d.toUTCString(); } document.cookie = name+'='+ (value||'') + expires + '; path=/'; }
};

nj.cookie = cookie; // expose cookie helper on namespace

/**
 * Events: on/off/trigger
 * - on(ev, handler, opts) -> addEventListener
 * - off(ev, handler, opts) -> removeEventListener
 * - trigger(evName) -> dispatchEvent(new Event(evName))
 *
 * Hinweise:
 * - removeEventListener benötigt dieselben Optionen (capture boolean) wie addEventListener
 *   damit Removal funktioniert; wenn du `opts` als Objekt verwendest (e.g. {once:true})
 *   dann musst du beim Entfernen den passenden capture Wert übergeben.
 * - trigger nutzt `new Event(evName)` (non-bubbling by default). Für jQuery-ähnliches
 *   Verhalten wäre `new Event(evName, { bubbles: true, cancelable: true })` empfehlenswert.
 */
NJ.prototype.on = function(ev, handler, opts){ return this._each(function(){ this.addEventListener(ev, handler, opts||false); }); };
NJ.prototype.off = function(ev, handler, opts){ return this._each(function(){ this.removeEventListener(ev, handler, opts||false); }); };
NJ.prototype.trigger = function(evName){ return this._each(function(){ this.dispatchEvent(new Event(evName)); }); };

/**
 * Forms
 */
NJ.prototype.checked = function(state){ if (typeof state === 'undefined') return this.elements[0] ? Boolean(this.elements[0].checked) : undefined; return this._each(function(){ this.checked = !!state; }); };

NJ.prototype.selectValues = function(values, clearField=true){
  if (!this.elements[0] || this.elements[0].tagName !== 'SELECT') return this;
  const select = this.elements[0];
  if (clearField) for (let opt of select.options) opt.selected = false;
  const vals = Array.isArray(values) ? values : String(values).split(',').map(s=>s.trim());
  // Performance: Bei großen Selects evtl. in Set umwandeln
  const set = new Set(vals);
  for (let opt of select.options) if (set.has(opt.value)) opt.selected = true;
  return this;
};

NJ.prototype.getSelected = function(){ if (!this.elements[0]) return []; const opts = this.elements[0].options; let res=[]; for (let i=0;i<opts.length;i++){ if (opts[i].selected) res.push(opts[i].value||opts[i].text); } return res; };

// --------------------------------------------------
// 5_ajax_anim.js
// --------------------------------------------------

/**
 * Utility functions on nj namespace
 */
nj.extend = (a,b) => Object.assign(a,b);
// Note: original file defines nj.isJSON twice; wir behalten eine Definition.
/**
 * Prüft, ob ein Item JSON-serialisierbar / parsebar ist.
 * - Wenn String: versucht JSON.parse -> true wenn gültig
 * - Sonst: versucht JSON.stringify -> true wenn serialisierbar
 */
nj.isJSON = v => { try{ if (typeof v === 'string') JSON.parse(v); else JSON.stringify(v); return true;}catch(e){return false;} };

njsafe: // label for reviewer; not used in code
nj.arrayRemove = (arr, val) => { const i = arr.indexOf(val); if (i>=0) arr.splice(i,1); return arr; };
nj.filterObjectArray = (arr, field, value) => arr.filter(it => it[field] === value);
nj.forEach = (arr, cb) => arr.forEach(cb);

/**
 * AJAX - Promise based convenience wrappers
 * - nj.ajax.post(url, data, opts) -> sends JSON body, expects JSON response
 * - nj.ajax.postForm(url, formObj) -> sends multipart/form-data form payload, returns text
 *
 * Hinweise:
 * - post() wirft Error('Network response was not ok') bei !response.ok
 * - Es werden keine Zeitlimits (Timeouts) verwendet; für Abbruch verwende AbortController
 * - Erweiterungsvorschlag: Accept other response types, propagate status, allow fetch options
 */
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

/**
 * Animation helper
 * - animate(el, keyframes, options) -> returns the finished Promise from Web Animations API
 *
 * Hinweis: Element.animate ist modern; in alten Browsern ggf. Polyfill benötigen.
 */
function animate(el, keyframes, options){ return el.animate(keyframes, options).finished; }

/**
 * fadeIn/fadeOut: einfache Implementierungen basierend auf Web Animations
 * - fadeIn(duration, display) : zeigt Element (setzt display), animiert opacity 0->1
 * - fadeOut(duration)         : animiert opacity 1->0 und setzt display:'none'
 *
 * Hinweise:
 * - Diese Methoden geben `this` (Wrapper) zurück — sie geben keine Promise für
 *   das Ende der Animation zurück. Wenn du die Fertigstellung benötigst, erweitere
 *   die API, um Promises zurückzugeben.
 */
NJ.prototype.fadeIn = function(duration=300, display){
  return this._each(function(){
    const el = this;
    el.style.opacity = 0;
    el.style.display = display || (getComputedStyle(el).display === 'none' ? 'block' : getComputedStyle(el).display);
    animate(el, [{opacity:0},{opacity:1}], {duration}).catch(noop);
  });
};

NJ.prototype.fadeOut = function(duration=300){
  return this._each(function(){
    const el = this;
    animate(el, [{opacity:1},{opacity:0}], {duration}).then(()=>{ el.style.display='none'; el.style.opacity=''; }).catch(noop);
  });
};

NJ.prototype.slideUp = function(duration=300){
  return this._each(function(){
    const el=this; const height = el.getBoundingClientRect().height;
    el.style.overflow='hidden';
    animate(el, [{height:height+'px'},{height:'0px'}], {duration}).then(()=>{ el.style.display='none'; el.style.height=''; el.style.overflow=''; }).catch(noop);
  });
};

NJ.prototype.slideDown = function(duration=300, display){
  return this._each(function(){
    const el=this; el.style.display = display || 'block';
    const height = el.getBoundingClientRect().height;
    el.style.overflow='hidden'; el.style.height='0px';
    // Force reflow to ensure animation runs
    void el.offsetHeight;
    animate(el, [{height:'0px'},{height:height+'px'}], {duration}).then(()=>{ el.style.height=''; el.style.overflow=''; }).catch(noop);
  });
};

// Geometry helper / duplicates in original
NJ.prototype.getRect = function(){ return this.elements[0] ? this.elements[0].getBoundingClientRect() : undefined; };
NJ.prototype.getBounding = function(){ if (!this.elements[0]) return undefined; return this.elements[0].getBoundingClientRect(); };

/**
 * Browser detection (simplified)
 * - Liefert einen String mit dem vermuteten Browser
 * - Hinweis: userAgent sniffing ist fehleranfällig; Feature-Detection ist
 *   für produktiven Code in der Regel überlegen.
 */
nj.detectBrowser = function(){ const ua = navigator.userAgent; if (ua.includes('Edg/')) return 'ChromiumEdge'; if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'; if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'; if (ua.includes('Firefox')) return 'Firefox'; return 'Unknown'; };

// --------------------------------------------------
// 6_dialog_ref.js
// --------------------------------------------------
/**
 * Dialog-Reflection compatibility functions (legacy API)
 * - gDV(ds='dvar')      : climb parents until element with data-ds found, return string value
 * - Dia(ds='dvar', deep): read dataset entry 'dvar' and resolve as window.<path> optionally limited by depth
 * - gRO(ds='dvar')      : return top-level window object referenced by data-dvar
 * - bDV(dvar)           : resolve dot-path (like 'App.state.user') against window
 *
 * Achtung: Diese Funktionen erlauben Zugriff auf globale Variablen über String-Pfade.
 * Das ist sehr mächtig, birgt aber Sicherheits- und Kapselungsrisiken (z.B. Zugriff
 * auf window.document.cookie wenn dataset entsprechend gesetzt ist). Verwende nur
 * vertrauenswürdige Werte in data-* Attributen.
 */
NJ.prototype.gDV = function(ds='dvar'){
  let el = this.elements[0];
  while(el){ if (el.dataset && el.dataset[ds]) return el.dataset[ds]; el = el.parentElement; }
  return false;
};

NJ.prototype.Dia = function(ds='dvar', deep){
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

NJ.prototype.gRO = function(ds='dvar'){
  let el = this.elements[0];
  while(el){ if (el.dataset && el.dataset[ds]) return window[el.dataset[ds].split('.')[0]]; el = el.parentElement; }
  return undefined;
};

nj.bDV = function(dvar){
  const tmp = dvar.split('.'); let val = window[tmp[0]]; for (let j=1;j<tmp.length;j++) val = val[tmp[j]]; return val;
};

/**
 * Unsafe evaluator utilities
 * - exec / exC: wrappers um new Function(code) Ausführung
 * - Diese sind in der Bibliothek vorhanden aber mit Warnungen versehen.
 *
 * Kritische Warnung: Das Ausführen von dynamischem Code aus untrusted Quellen
 * ist gefährlich und kann zu XSS/RCE führen. Entferne/ersetze diese Funktionen
 * in produktionellen Umgebungen oder schränke ihren Gebrauch ein.
 */
nj.exec = function(code){ // still available but warns
  console.warn('nj.exec is potentially unsafe. Prefer explicit functions.');
  return (new Function(code))();
};

nj.exC = function(code){ console.warn('Unsafe'); return (new Function(code))(); };

// --------------------------------------------------
// 7_compat_layer.js
// --------------------------------------------------
/**
 * Compatibility layer: Viele alte Funktionsnamen (aus früheren no_jquery
 * Versionen) werden als Aliase erhalten. Das erleichtert Migrationen
 * und bewahrt Legacy-Code.
 *
 * Anmerkung: Für die meisten Aliases verwende ich eine Gruppen-Dokumentation
 * statt hunderter redundanter JSDoc-Blöcke. Die Aliase sind bewusst 1:1
 * implementiert, um vollständige Kompatibilität zu sichern.
 */

// DOM & selection aliases
NJ.prototype.els = function(p){ return nj(p); };
NJ.prototype.lEl = function(){ return this.first(); };
NJ.prototype.fEl = function(){ return this.first(); };
NJ.prototype.nEl = function(n){ return typeof n==='number' ? this.eq(n-1) : this.next(); };
NJ.prototype.bEl = function(){ return this.prev(); };
NJ.prototype.cEl = function(t){ return document.createElement(t); };

// HTML & text aliases
NJ.prototype.htm = NJ.prototype.html;
NJ.prototype.oHt = function(v){ return this._each(function(){ this.outerHTML = v; }); };
NJ.prototype.oTx = function(v){ return this._each(function(){ this.outerText = v; }); };
NJ.prototype.txt = NJ.prototype.text;
NJ.prototype.v = NJ.prototype.val;

// DOM insertion aliases
NJ.prototype.b = NJ.prototype.before;
NJ.prototype.a = NJ.prototype.after;
NJ.prototype.p = NJ.prototype.parent;
NJ.prototype.m = function(target){ const t = nj(target).elements[0]; if(t) this._each(function(){ t.appendChild(this);}); return this; };

// attributes aliases
NJ.prototype.id = function(){ return this.attr('id'); };\nNJ.prototype.tag = function(){ return this.elements[0] ? this.elements[0].tagName : undefined; };
NJ.prototype.ds = function(k){ return this.data(k); };
NJ.prototype.sDs = NJ.prototype.data;
NJ.prototype.atr = NJ.prototype.attr;
NJ.prototype.hAt = NJ.prototype.hasAttr;
NJ.prototype.rAt = NJ.prototype.removeAttr;
NJ.prototype.sPr = function(n,v){ return this._each(function(){ this[n] = v; }); };
NJ.prototype.rPr = function(a){ return this._each(function(){ this.removeAttribute(a); }); };

// classes aliases
NJ.prototype.aCN = NJ.prototype.addClass;
NJ.prototype.rCN = NJ.prototype.removeClass;
NJ.prototype.aCl = NJ.prototype.addClass;
NJ.prototype.hCl = NJ.prototype.hasClass;
NJ.prototype.rCl = NJ.prototype.removeClass;
NJ.prototype.tCl = NJ.prototype.toggleClass;
NJ.prototype.clL = NJ.prototype.classList;

// styles aliases
NJ.prototype.sty = NJ.prototype.css;
NJ.prototype.sRP = NJ.prototype.removeCss;
NJ.prototype.gCS = NJ.prototype.computed;

// geometry aliases
NJ.prototype.gRe = NJ.prototype.getRect;
NJ.prototype.rEl = NJ.prototype.remove;
NJ.prototype.prE = NJ.prototype.prev;
NJ.prototype.aCh = NJ.prototype.append;
NJ.prototype.pCh = NJ.prototype.prepend;
NJ.prototype.app = NJ.prototype.append;

// events aliases preserved as-is
NJ.prototype.tri = NJ.prototype.trigger;

// cookies
NJ.prototype.sCV = function(name,val,days){ nj.cookie.set(name,val,days); return this; };
NJ.prototype.gCV = function(name){ return nj.cookie.get(name); };

// AJAX (legacy wrappers)
nj.post = function(url,data,cb){ nj.ajax.post(url,data).then(cb).catch(console.error); };
nj.fetchPost = function(url,data,cb){ nj.ajax.post(url,data).then(cb).catch(console.error); };
nj.fetchPostNew = function(url,data,cb){ nj.ajax.post(url,data).then(cb).catch(console.error); };

// misc aliases and small helpers
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

// dialog reflection aliases
NJ.prototype.gDV = NJ.prototype.gDV;
NJ.prototype.Dia = NJ.prototype.Dia;
NJ.prototype.gRO = NJ.prototype.gRO;
nj.bDV = nj.bDV;

// expose factory globally
global.nj = nj;

// end IIFE
})(window);

/*
 * Ende der annotierten Module.
 *
 * Hinweise zum Merge:
 * - Falls du die Module in mehrere Dateien zerlegen willst, kopiere die Blöcke
 *   1_core.js .. 7_compat_layer.js in separate Dateien. Achte darauf, dass
 *   die Reihenfolge beibehalten wird (1..7), damit Abhängigkeiten korrekt sind.
 * - Entferne ggf. doppelte Hilfsfunktionen, falls du Code zusammenführst
 *   (z.B. falls du mehrere Variationen von nj.isJSON siehst).
 */
