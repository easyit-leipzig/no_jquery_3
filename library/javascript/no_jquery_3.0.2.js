/*!
 * nojquery 3.0.2
 * ----------------
 * Modern, backward-compatible small DOM helper.
 * - Vollständige JSDoc-Dokumentation
 * - Verbesserte Architektur gegenüber 3.0.1
 * - Performance-, Sicherheits- und API-Feinschliff
 * - Vollständige Legacy-Kompatibilität (alle alten Funktionsnamen)
 *
 * Usage:
 *   const $ = nj;          // factory
 *   nj('#myId').html('Hi');
 *
 * Author: nojquery project
 * Version: 3.0.2
 */

(function (global) {
  'use strict';

  // -------------------------
  // Utility helpers
  // -------------------------

  /**
   * Prüft, ob ein Wert ein Element ist.
   * @param {*} v
   * @returns {boolean}
   */
  const isNode = v => v instanceof Node;

  /**
   * Prüft, ob ein Wert eine NodeList oder HTMLCollection ist.
   * @param {*} v
   * @returns {boolean}
   */
  const isNodeList = v =>
    NodeList.prototype.isPrototypeOf(v) || HTMLCollection.prototype.isPrototypeOf(v);

  /**
   * Wandelt Eingabe in ein Array mit DOM-Knoten.
   * @param {*} v
   * @returns {Node[]}
   */
  const toArray = v => {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter(isNode);
    if (isNode(v)) return [v];
    if (isNodeList(v)) return Array.from(v);
    return [];
  };

  /**
   * No-op helper.
   */
  const noop = () => {};

  /**
   * Safe JSON check
   * @param {*} item
   * @returns {boolean}
   */
  function isJSON(item) {
    try {
      if (typeof item === 'string') JSON.parse(item);
      else JSON.stringify(item);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Deep equality via JSON stringify (deterministic enough for our use cases).
   * @param {any} a
   * @param {any} b
   * @returns {boolean}
   */
  function deepEqual(a, b) {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch (e) {
      return false;
    }
  }

  // -------------------------
  // Selector optimisation
  // -------------------------

  /**
   * Schnell-Auswahl für einfache Selektoren (ID, Klasse, Tag) ansonsten querySelectorAll.
   * @param {string|Node|NodeList} selector
   * @param {Element|Document} [context]
   * @returns {Node[]}
   */
  function select(selector, context = document) {
    if (!selector && selector !== 0) return [];
    if (isNode(selector)) return [selector];
    if (isNodeList(selector)) return Array.from(selector);
    if (Array.isArray(selector)) return selector.filter(isNode);
    if (typeof selector !== 'string') return [];

    const s = selector.trim();

    // ID
    if (
      s[0] === '#' &&
      !s.includes(' ') &&
      !s.includes(',') &&
      !s.includes('[') &&
      !s.includes(':')
    ) {
      const el = document.getElementById(s.slice(1));
      return el ? [el] : [];
    }
    // class
    if (
      s[0] === '.' &&
      !s.includes(' ') &&
      !s.includes(',') &&
      !s.includes('[') &&
      !s.includes(':')
    ) {
      return Array.from(document.getElementsByClassName(s.slice(1)));
    }
    // tag only (alphanumerisch + dash)
    if (!s.includes(' ') && !s.includes(',') && !s.includes('[') && !s.includes(':') && /^[a-zA-Z0-9-]+$/.test(s)) {
      return Array.from(document.getElementsByTagName(s));
    }

    // fallback
    try {
      return Array.from((context || document).querySelectorAll(s));
    } catch (e) {
      // invalid selector
      return [];
    }
  }

  // -------------------------
  // Core wrapper
  // -------------------------

  /**
   * Core wrapper constructor.
   * @constructor
   * @param {Node[]|Node} elements
   */
  function NJ(elements) {
    this.elements = toArray(elements);
  }

  /**
   * internal foreach with chaining.
   * @param {function(number, Element):void} cb
   * @returns {NJ}
   */
  NJ.prototype._each = function (cb) {
    this.elements.forEach((el, i) => cb.call(el, i, el));
    return this;
  };

  /**
   * Factory function.
   * @param {string|Node|NodeList|Array|Document|Window} p
   * @returns {NJ}
   */
  function nj(p) {
    if (p instanceof NJ) return p;
    if (typeof p === 'undefined' || p === null || p === '') return new NJ([]);
    if (typeof p === 'string' || isNode(p) || isNodeList(p)) return new NJ(select(p));
    if (Array.isArray(p)) return new NJ(p.filter(isNode));
    if (p === document || p === window) return new NJ([p]);
    return new NJ([]);
  }

  // -------------------------
  // DOM operations
  // -------------------------

  /**
   * Get/Set innerHTML.
   * @param {string} [v]
   * @returns {NJ|string|undefined}
   */
  NJ.prototype.html = function (v) {
    if (typeof v === 'undefined') return this.elements[0] ? this.elements[0].innerHTML : undefined;
    return this._each(function () {
      this.innerHTML = v;
    });
  };

  /**
   * Get/Set textContent.
   * @param {string} [v]
   * @returns {NJ|string|undefined}
   */
  NJ.prototype.text = function (v) {
    if (typeof v === 'undefined') return this.elements[0] ? this.elements[0].textContent : undefined;
    return this._each(function () {
      this.textContent = v;
    });
  };

  /**
   * Get/Set value for inputs/selects.
   * @param {*} [v]
   * @returns {NJ|*}
   */
  NJ.prototype.val = function (v) {
    if (typeof v === 'undefined') return this.elements[0] ? this.elements[0].value : undefined;
    return this._each(function () {
      this.value = v;
    });
  };

  /**
   * Append node or HTML string.
   * @param {Node|string|NJ} node
   * @returns {NJ}
   */
  NJ.prototype.append = function (node) {
    return this._each(function () {
      if (typeof node === 'string') this.insertAdjacentHTML('beforeend', node);
      else if (isNode(node)) this.appendChild(node);
      else if (node instanceof NJ && node.elements[0]) this.appendChild(node.elements[0]);
      else this.appendChild(document.createTextNode(String(node)));
    });
  };

  /**
   * Prepend node or HTML string.
   * @param {Node|string|NJ} node
   * @returns {NJ}
   */
  NJ.prototype.prepend = function (node) {
    return this._each(function () {
      if (typeof node === 'string') this.insertAdjacentHTML('afterbegin', node);
      else if (isNode(node)) this.insertBefore(node, this.firstChild);
      else if (node instanceof NJ && node.elements[0]) this.insertBefore(node.elements[0], this.firstChild);
      else this.insertBefore(document.createTextNode(String(node)), this.firstChild);
    });
  };

  /**
   * Insert before element.
   * @param {Node|string|NJ} node
   * @returns {NJ}
   */
  NJ.prototype.before = function (node) {
    return this._each(function () {
      if (!this.parentNode) return;
      if (typeof node === 'string') this.insertAdjacentHTML('beforebegin', node);
      else if (isNode(node)) this.parentNode.insertBefore(node, this);
      else if (node instanceof NJ && node.elements[0]) this.parentNode.insertBefore(node.elements[0], this);
      else this.parentNode.insertBefore(document.createTextNode(String(node)), this);
    });
  };

  /**
   * Insert after element.
   * @param {Node|string|NJ} node
   * @returns {NJ}
   */
  NJ.prototype.after = function (node) {
    return this._each(function () {
      if (!this.parentNode) return;
      if (typeof node === 'string') this.insertAdjacentHTML('afterend', node);
      else if (isNode(node)) this.parentNode.insertBefore(node, this.nextSibling);
      else if (node instanceof NJ && node.elements[0]) this.parentNode.insertBefore(node.elements[0], this.nextSibling);
      else this.parentNode.insertBefore(document.createTextNode(String(node)), this.nextSibling);
    });
  };

  /**
   * Remove elements.
   * @returns {NJ}
   */
  NJ.prototype.remove = function () {
    return this._each(function () {
      if (this.parentNode) this.parentNode.removeChild(this);
    });
  };

  /**
   * Get parent(s) as NJ.
   * @returns {NJ}
   */
  NJ.prototype.parent = function () {
    const parents = this.elements.map(el => el.parentElement).filter(Boolean);
    return new NJ(Array.from(new Set(parents)));
  };

  /**
   * Get children.
   * @returns {NJ}
   */
  NJ.prototype.children = function () {
    let out = [];
    this.elements.forEach(el => out.push(...Array.from(el.children)));
    return new NJ(out);
  };

  /**
   * Return first element as wrapper.
   * @returns {NJ}
   */
  NJ.prototype.first = function () {
    return new NJ(this.elements[0] ? [this.elements[0]] : []);
  };

  /**
   * Return last element as wrapper.
   * @returns {NJ}
   */
  NJ.prototype.last = function () {
    const e = this.elements;
    return new NJ(e.length ? [e[e.length - 1]] : []);
  };

  /**
   * Return eq(n) (1-based compatible with legacy `nEl`).
   * @param {number} n - 0-based index or negative
   * @returns {NJ}
   */
  NJ.prototype.eq = function (n) {
    if (n < 0) n = this.elements.length + n;
    return new NJ(this.elements[n] ? [this.elements[n]] : []);
  };

  /**
   * Next siblings.
   * @returns {NJ}
   */
  NJ.prototype.next = function () {
    return new NJ(this.elements.map(e => e.nextElementSibling).filter(Boolean));
  };

  /**
   * Previous siblings.
   * @returns {NJ}
   */
  NJ.prototype.prev = function () {
    return new NJ(this.elements.map(e => e.previousElementSibling).filter(Boolean));
  };

  // -------------------------
  // Attributes
  // -------------------------

  /**
   * Get/set attribute
   * @param {string} name
   * @param {*} [val]
   * @returns {NJ|*}
   */
  NJ.prototype.attr = function (name, val) {
    if (typeof val === 'undefined') return this.elements[0] ? this.elements[0].getAttribute(name) : undefined;
    return this._each(function () {
      this.setAttribute(name, String(val));
    });
  };

  /**
   * Remove attribute
   * @param {string} name
   * @returns {NJ}
   */
  NJ.prototype.removeAttr = function (name) {
    return this._each(function () {
      this.removeAttribute(name);
    });
  };

  /**
   * Has attribute
   * @param {string} name
   * @returns {boolean}
   */
  NJ.prototype.hasAttr = function (name) {
    return this.elements[0] ? this.elements[0].hasAttribute(name) : false;
  };

  // -------------------------
  // Dataset
  // -------------------------

  /**
   * Get/set dataset value
   * @param {string} key
   * @param {string} [val]
   * @returns {NJ|string|undefined}
   */
  NJ.prototype.data = function (key, val) {
    if (typeof val === 'undefined') return this.elements[0] ? this.elements[0].dataset[key] : undefined;
    return this._each(function () {
      this.dataset[key] = val;
    });
  };

  /**
   * Remove dataset key
   * @param {string} key
   * @returns {NJ}
   */
  NJ.prototype.removeData = function (key) {
    return this._each(function () {
      delete this.dataset[key];
    });
  };

  // -------------------------
  // Class helpers
  // -------------------------

  /**
   * Add one or many classes.
   * @param {string} cls
   * @returns {NJ}
   */
  NJ.prototype.addClass = function (cls) {
    if (!cls) return this;
    const parts = cls.split(/\s+/).filter(Boolean);
    return this._each(function () {
      this.classList.add(...parts);
    });
  };

  /**
   * Remove classes.
   * @param {string} cls
   * @returns {NJ}
   */
  NJ.prototype.removeClass = function (cls) {
    if (!cls) return this;
    const parts = cls.split(/\s+/).filter(Boolean);
    return this._each(function () {
      this.classList.remove(...parts);
    });
  };

  /**
   * Toggle a class.
   * @param {string} cls
   * @returns {NJ}
   */
  NJ.prototype.toggleClass = function (cls) {
    if (!cls) return this;
    return this._each(function () {
      this.classList.toggle(cls);
    });
  };

  /**
   * Check if first element has class.
   * @param {string} cls
   * @returns {boolean}
   */
  NJ.prototype.hasClass = function (cls) {
    return this.elements[0] ? this.elements[0].classList.contains(cls) : false;
  };

  /**
   * Return classList of first element.
   * @returns {DOMTokenList|undefined}
   */
  NJ.prototype.classList = function () {
    return this.elements[0] ? this.elements[0].classList : undefined;
  };

  // -------------------------
  // Styles
  // -------------------------

  /**
   * Get/Set CSS properties. Accepts (prop, val) or ({prop: val}).
   * @param {string|Object} prop
   * @param {string} [val]
   * @returns {NJ|string|undefined}
   */
  NJ.prototype.css = function (prop, val) {
    if (typeof prop === 'object') {
      return this._each(function () {
        for (let p in prop) {
          try {
            this.style[p] = prop[p];
          } catch (e) {
            /* ignore invalid names */
          }
        }
      });
    }
    if (typeof val === 'undefined') {
      return this.elements[0] ? getComputedStyle(this.elements[0])[prop] : undefined;
    }
    return this._each(function () {
      this.style[prop] = val;
    });
  };

  /**
   * Remove CSS property (uses removeProperty).
   * @param {string} prop
   * @returns {NJ}
   */
  NJ.prototype.removeCss = function (prop) {
    return this._each(function () {
      this.style.removeProperty(prop);
    });
  };

  /**
   * Get computed style property.
   * @param {string} prop
   * @returns {string|undefined}
   */
  NJ.prototype.computed = function (prop) {
    return this.elements[0] ? getComputedStyle(this.elements[0]).getPropertyValue(prop) : undefined;
  };

  // -------------------------
  // Events
  // -------------------------

  /**
   * Bind event listener.
   * @param {string} ev
   * @param {Function} handler
   * @param {Object|boolean} [opts]
   * @returns {NJ}
   */
  NJ.prototype.on = function (ev, handler, opts) {
    if (!ev || typeof handler !== 'function') return this;
    return this._each(function () {
      this.addEventListener(ev, handler, opts || false);
    });
  };

  /**
   * Remove event listener.
   * @param {string} ev
   * @param {Function} handler
   * @param {Object|boolean} [opts]
   * @returns {NJ}
   */
  NJ.prototype.off = function (ev, handler, opts) {
    if (!ev || typeof handler !== 'function') return this;
    return this._each(function () {
      this.removeEventListener(ev, handler, opts || false);
    });
  };

  /**
   * Trigger custom event name.
   * @param {string} evName
   * @returns {NJ}
   */
  NJ.prototype.trigger = function (evName) {
    if (!evName) return this;
    return this._each(function () {
      try {
        this.dispatchEvent(new Event(evName));
      } catch (e) {
        // fallback for very old browsers
        const evt = document.createEvent('Event');
        evt.initEvent(evName, true, true);
        this.dispatchEvent(evt);
      }
    });
  };

  // -------------------------
  // Form helpers
  // -------------------------

  /**
   * Checked getter/setter for checkboxes/radios.
   * @param {boolean} [state]
   * @returns {NJ|boolean}
   */
  NJ.prototype.checked = function (state) {
    if (typeof state === 'undefined') return this.elements[0] ? Boolean(this.elements[0].checked) : undefined;
    return this._each(function () {
      this.checked = !!state;
    });
  };

  /**
   * Set selected values on a select (supports multiple).
   * @param {Array|string} values
   * @param {boolean} [clearField=true]
   * @returns {NJ}
   */
  NJ.prototype.selectValues = function (values, clearField = true) {
    if (!this.elements[0] || this.elements[0].tagName !== 'SELECT') return this;
    const select = this.elements[0];
    if (clearField) for (let opt of select.options) opt.selected = false;
    const vals = Array.isArray(values) ? values : String(values).split(',').map(s => s.trim());
    for (let opt of select.options) if (vals.includes(opt.value)) opt.selected = true;
    return this;
  };

  /**
   * Get selected values from select.
   * @returns {Array}
   */
  NJ.prototype.getSelected = function () {
    if (!this.elements[0]) return [];
    const opts = this.elements[0].options;
    const res = [];
    for (let i = 0; i < opts.length; i++) {
      if (opts[i].selected) res.push(opts[i].value || opts[i].text);
    }
    return res;
  };

  // -------------------------
  // AJAX (Promise-based)
  // -------------------------

  nj.ajax = {
    /**
     * POST JSON and parse JSON response.
     * @param {string} url
     * @param {Object} [data={}]
     * @param {Object} [opts={}] - optional: headers
     * @returns {Promise<any>}
     */
    post(url, data = {}, opts = {}) {
      const headers = opts.headers || {};
      return fetch(url, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
        body: JSON.stringify(data)
      }).then(r => {
        if (!r.ok) throw new Error(`Network response was not ok (${r.status})`);
        // attempt to parse JSON; allow empty body
        return r.text().then(t => {
          if (!t) return null;
          try {
            return JSON.parse(t);
          } catch (e) {
            return t;
          }
        });
      });
    },

    /**
     * POST FormData (from plain object)
     * @param {string} url
     * @param {Object} formObj
     * @returns {Promise<string>}
     */
    postForm(url, formObj = {}) {
      const f = new FormData();
      for (let k in formObj) f.append(k, formObj[k]);
      return fetch(url, { method: 'POST', body: f }).then(r => {
        if (!r.ok) throw new Error(`Network response was not ok (${r.status})`);
        return r.text();
      });
    }
  };

  // backward-compatible convenience wrappers
  /**
   * Legacy: nj.post(url, data, cb)
   * @deprecated prefer nj.ajax.post
   */
  nj.post = function (url, data, cb) {
    nj.ajax.post(url, data).then(res => {
      if (typeof cb === 'function') cb(res);
    }).catch(err => {
      console.error(err);
      if (typeof cb === 'function') cb(null, err);
    });
  };

  nj.fetchPost = function (url, data, cb) {
    nj.post(url, data, cb);
  };

  nj.fetchPostNew = function (url, data, cb) {
    nj.post(url, data, cb);
  };

  // -------------------------
  // Cookies
  // -------------------------

  const cookie = {
    /**
     * Get cookie value by name.
     * @param {string} name
     * @returns {string}
     */
    get(name) {
      const b = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
      return b ? b.pop() : '';
    },

    /**
     * Set cookie.
     * @param {string} name
     * @param {string} value
     * @param {number} [days]
     */
    set(name, value, days) {
      let expires = '';
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = '; expires=' + date.toUTCString();
      }
      document.cookie = name + '=' + (value || '') + expires + '; path=/';
    },

    /**
     * Remove cookie by name.
     * @param {string} name
     */
    remove(name) {
      this.set(name, '', -1);
    }
  };

  nj.cookie = cookie;

  // -------------------------
  // Animation helpers (uses Web Animations API when available)
  // -------------------------

  function animatePromise(el, keyframes, options) {
    if (!el || !el.animate) {
      // fallback to CSS transition-like behavior
      return new Promise(resolve => {
        try {
          // quick naive fallback: set styles then timeout
          if (options && options.duration) {
            setTimeout(resolve, options.duration);
          } else {
            setTimeout(resolve, 300);
          }
        } catch (e) {
          resolve();
        }
      });
    }
    try {
      return el.animate(keyframes, options).finished;
    } catch (e) {
      return Promise.resolve();
    }
  }

  /**
   * Fade in elements.
   * @param {number} [duration=300]
   * @param {string} [display]
   * @returns {NJ}
   */
  NJ.prototype.fadeIn = function (duration = 300, display) {
    return this._each(function () {
      const el = this;
      el.style.opacity = 0;
      el.style.display = display || (getComputedStyle(el).display === 'none' ? 'block' : getComputedStyle(el).display || 'block');
      animatePromise(el, [{ opacity: 0 }, { opacity: 1 }], { duration }).catch(noop);
    });
  };

  /**
   * Fade out elements.
   * @param {number} [duration=300]
   * @returns {NJ}
   */
  NJ.prototype.fadeOut = function (duration = 300) {
    return this._each(function () {
      const el = this;
      animatePromise(el, [{ opacity: 1 }, { opacity: 0 }], { duration }).then(() => {
        el.style.display = 'none';
        el.style.opacity = '';
      }).catch(noop);
    });
  };

  /**
   * Slide up (hide).
   * @param {number} [duration=300]
   * @returns {NJ}
   */
  NJ.prototype.slideUp = function (duration = 300) {
    return this._each(function () {
      const el = this;
      const height = el.getBoundingClientRect().height;
      el.style.overflow = 'hidden';
      animatePromise(el, [{ height: height + 'px' }, { height: '0px' }], { duration }).then(() => {
        el.style.display = 'none';
        el.style.height = '';
        el.style.overflow = '';
      }).catch(noop);
    });
  };

  /**
   * Slide down (show).
   * @param {number} [duration=300]
   * @param {string} [display='block']
   * @returns {NJ}
   */
  NJ.prototype.slideDown = function (duration = 300, display) {
    return this._each(function () {
      const el = this;
      el.style.display = display || 'block';
      const height = el.getBoundingClientRect().height;
      el.style.overflow = 'hidden';
      el.style.height = '0px';
      // force reflow
      void el.offsetHeight;
      animatePromise(el, [{ height: '0px' }, { height: height + 'px' }], { duration }).then(() => {
        el.style.height = '';
        el.style.overflow = '';
      }).catch(noop);
    });
  };

  // -------------------------
  // Geometry / bounding
  // -------------------------

  /**
   * Get bounding client rect of first element.
   * @returns {DOMRect|undefined}
   */
  NJ.prototype.getRect = function () {
    return this.elements[0] ? this.elements[0].getBoundingClientRect() : undefined;
  };

  /**
   * Backwards-compatible alias for bounding rect
   * @returns {DOMRect|undefined}
   */
  NJ.prototype.getBounding = function () {
    return this.getRect();
  };

  // -------------------------
  // CSS variables (document-level)
  // -------------------------

  /**
   * Get/Set CSS variable on :root
   * @param {string} k
   * @param {string} [v]
   * @returns {string|NJ}
   */
  NJ.prototype.cssVar = function (k, v) {
    if (typeof v === 'undefined') return getComputedStyle(document.documentElement).getPropertyValue(k);
    document.documentElement.style.setProperty(k, v);
    return this;
  };

  // -------------------------
  // Browser detection
  // -------------------------

  nj.detectBrowser = function () {
    const ua = navigator.userAgent;
    if (ua.includes('Edg/')) return 'ChromiumEdge';
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    return 'Unknown';
  };

  // -------------------------
  // Dialog-reflection compatibility (legacy)
  // -------------------------

  /**
   * Climb up DOM until element with data-[ds] is found, return value.
   * @param {string} [ds='dvar']
   * @returns {string|false}
   */
  NJ.prototype.gDV = function (ds = 'dvar') {
    let el = this.elements[0];
    while (el) {
      if (el.dataset && el.dataset[ds]) return el.dataset[ds];
      el = el.parentElement;
    }
    return false;
  };

  /**
   * Retrieve referenced window variable by data-dvar style string (a.b.c)
   * @param {string} [ds='dvar']
   * @param {number} [deep]
   * @returns {*|false}
   */
  NJ.prototype.Dia = function (ds = 'dvar', deep) {
    let el = this.elements[0];
    let dia = false;
    while (el) {
      if (el.dataset && el.dataset[ds]) {
        dia = el.dataset[ds];
        break;
      }
      el = el.parentElement;
    }
    if (!dia) return false;
    const parts = dia.split('.');
    const depth = typeof deep === 'undefined' ? parts.length : deep;
    let tmp = window[parts[0]];
    for (let i = 1; i < depth; i++) {
      if (tmp === undefined || tmp === null) return undefined;
      tmp = tmp[parts[i]];
    }
    return tmp;
  };

  /**
   * Get root object referenced by dataset var (window[ firstPart ])
   * @param {string} [ds='dvar']
   * @returns {*|undefined}
   */
  NJ.prototype.gRO = function (ds = 'dvar') {
    let el = this.elements[0];
    while (el) {
      if (el.dataset && el.dataset[ds]) return window[el.dataset[ds].split('.')[0]];
      el = el.parentElement;
    }
    return undefined;
  };

  /**
   * Evaluate dvar string into value from window scope (static helper).
   * @param {string} dvar
   * @returns {*}
   */
  nj.bDV = function (dvar) {
    const tmp = dvar.split('.');
    let val = window[tmp[0]];
    for (let j = 1; j < tmp.length; j++) val = val ? val[tmp[j]] : undefined;
    return val;
  };

  // -------------------------
  // Safe exec (warning) - keep for compatibility (exC -> exec)
  // -------------------------

  /**
   * Execute code string (unsafe) — kept for compatibility but warns.
   * @param {string} code
   * @returns {*}
   */
  nj.exec = function (code) {
    console.warn('nj.exec is potentially unsafe. Prefer explicit functions.');
    return new Function(code)();
  };

  // -------------------------
  // Objects / Arrays helpers
  // -------------------------

  nj.extend = (a, b) => Object.assign(a, b);
  nj.isJSON = isJSON;
  nj.arrayRemove = (arr, val) => {
    const i = arr.indexOf(val);
    if (i >= 0) arr.splice(i, 1);
    return arr;
  };
  nj.filterObjectArray = (arr, field, value) => arr.filter(it => it[field] === value);
  nj.forEach = (arr, cb) => arr.forEach(cb);
  nj.cEq = deepEqual;
  nj.oEx = nj.extend;
  nj.isJ = nj.isJSON;

  // aliases for convenience
  nj.ddS = function (k, v) {
    document.documentElement.style.setProperty(k, v);
  };
  nj.ddG = function (k) {
    return getComputedStyle(document.documentElement).getPropertyValue(k);
  };
  nj.gBr = nj.detectBrowser;

  // -------------------------
  // Array helpers (legacy names kept)
  // -------------------------
  nj.rAE = function (arr, v) {
    const i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1);
    return arr;
  };
  nj.fEa = function (arr, cb) {
    arr.forEach((e, i) => cb(i, e));
  };
  nj.fOA = nj.filterObjectArray;

  // -------------------------
  // Backwards compatibility layer (map old names to new)
  // -------------------------
  // The old API used many short names. We preserve them 1:1.

  // DOM & selection
  NJ.prototype.els = function (p) {
    return nj(p);
  };
  NJ.prototype.lEl = function () {
    return this.first();
  };
  NJ.prototype.fEl = function () {
    return this.first();
  };
  NJ.prototype.nEl = function (n) {
    return typeof n === 'number' ? this.eq(n - 1) : this.next();
  };
  NJ.prototype.bEl = function () {
    return this.prev();
  };
  NJ.prototype.cEl = function (t) {
    return document.createElement(t);
  };

  // HTML & text
  NJ.prototype.htm = NJ.prototype.html;
  NJ.prototype.oHt = function (v) {
    return this._each(function () {
      this.outerHTML = v;
    });
  };
  NJ.prototype.oTx = function (v) {
    return this._each(function () {
      this.outerText = v;
    });
  };
  NJ.prototype.txt = NJ.prototype.text;
  NJ.prototype.v = NJ.prototype.val;

  // DOM insertion
  NJ.prototype.b = NJ.prototype.before;
  NJ.prototype.a = NJ.prototype.after;
  NJ.prototype.p = NJ.prototype.parent;
  NJ.prototype.m = function (target) {
    const t = nj(target).elements[0];
    if (t) this._each(function () {
      t.appendChild(this);
    });
    return this;
  };

  // attributes
  NJ.prototype.id = function () {
    return this.attr('id');
  };
  NJ.prototype.tag = function () {
    return this.elements[0] ? this.elements[0].tagName : undefined;
  };
  NJ.prototype.ds = function (k) {
    return this.data(k);
  };
  NJ.prototype.sDs = NJ.prototype.data;
  NJ.prototype.atr = NJ.prototype.attr;
  NJ.prototype.hAt = NJ.prototype.hasAttr;
  NJ.prototype.rAt = NJ.prototype.removeAttr;
  NJ.prototype.sPr = function (n, v) {
    return this._each(function () {
      this[n] = v;
    });
  };
  NJ.prototype.rPr = function (a) {
    return this._each(function () {
      this.removeAttribute(a);
    });
  };

  // classes (old names)
  NJ.prototype.aCN = NJ.prototype.addClass;
  NJ.prototype.rCN = NJ.prototype.removeClass;
  NJ.prototype.aCl = NJ.prototype.addClass;
  NJ.prototype.hCl = NJ.prototype.hasClass;
  NJ.prototype.rCl = NJ.prototype.removeClass;
  NJ.prototype.tCl = NJ.prototype.toggleClass;
  NJ.prototype.clL = NJ.prototype.classList;

  // styles (old names)
  NJ.prototype.sty = NJ.prototype.css;
  NJ.prototype.sRP = NJ.prototype.removeCss;
  NJ.prototype.gCS = NJ.prototype.computed;

  // geometry
  NJ.prototype.gRe = NJ.prototype.getRect;
  NJ.prototype.rEl = NJ.prototype.remove;
  NJ.prototype.prE = NJ.prototype.prev;
  NJ.prototype.aCh = NJ.prototype.append;
  NJ.prototype.pCh = NJ.prototype.prepend;
  NJ.prototype.app = NJ.prototype.append;

  // events (old)
  NJ.prototype.on = NJ.prototype.on;
  NJ.prototype.off = NJ.prototype.off;
  NJ.prototype.tri = NJ.prototype.trigger;

  // cookies (old)
  NJ.prototype.sCV = function (name, val, days) {
    nj.cookie.set(name, val, days);
    return this;
  };
  NJ.prototype.gCV = function (name) {
    return nj.cookie.get(name);
  };

  // ajax (legacy)
  nj.fetchPostNew = nj.fetchPost = nj.post;

  // misc (old -> new)
  NJ.prototype.isE = function () {
    return this.elements.length > 0;
  };
  nj.ddS = nj.ddS;
  nj.ddG = nj.ddG;
  nj.cEq = nj.cEq;
  nj.gBr = nj.detectBrowser;
  nj.exC = nj.exec;
  nj.oEx = nj.extend;
  nj.isJ = nj.isJSON;

  // dialog reflection aliases (ensure they exist)
  NJ.prototype.gDV = NJ.prototype.gDV;
  NJ.prototype.Dia = NJ.prototype.Dia;
  NJ.prototype.gRO = NJ.prototype.gRO;
  nj.bDV = nj.bDV;

  // -------------------------
  // Final expose
  // -------------------------
  global.nj = nj;

  // convenience: also set $ if not colliding (optional)
  if (!global.$) global.$ = nj;

  // End of file
})(window);
