diff --git a/no_jquery_3.0.1.js b/no_jquery_3.0.1.js
index 1234567..abcdef0 100644
--- a/no_jquery_3.0.1.js
+++ b/no_jquery_3.0.1.js
@@ -300,6 +300,16 @@ NJ.prototype.append = function(node){
-  return this._each(function(){
-    if (typeof node === 'string') this.insertAdjacentHTML('beforeend', node);
-    else this.appendChild(isNode(node) ? node : (node instanceof NJ ? node.elements[0] : document.createTextNode(String(node))));
-  });
+  const cloneNeeded = this.elements.length > 1 && isNode(node);
+  return this._each(function(i){
+    if (typeof node === 'string') {
+      this.insertAdjacentHTML('beforeend', node);
+    } else {
+      const n = (cloneNeeded && i > 0)
+        ? node.cloneNode(true)
+        : (node instanceof NJ ? node.elements[0] : node);
+      const realNode = isNode(n) ? n : document.createTextNode(String(n));
+      this.appendChild(realNode);
+    }
+  });
 };

@@ -330,6 +340,20 @@ NJ.prototype.prepend = function(node){
-  return this._each(function(){
-    if (typeof node === 'string') this.insertAdjacentHTML('afterbegin', node);
-    else this.insertBefore(isNode(node) ? node : (node instanceof NJ ? node.elements[0] : document.createTextNode(String(node))), this.firstChild);
-  });
+  const cloneNeeded = this.elements.length > 1 && isNode(node);
+
+  return this._each(function(i){
+    if (typeof node === 'string') {
+      this.insertAdjacentHTML('afterbegin', node);
+    } else {
+      const n = (cloneNeeded && i > 0)
+        ? node.cloneNode(true)
+        : (node instanceof NJ ? node.elements[0] : node);
+      const realNode = isNode(n) ? n : document.createTextNode(String(n));
+      this.insertBefore(realNode, this.firstChild);
+    }
+  });
 };

@@ -355,6 +379,24 @@ NJ.prototype.before = function(node){
-  return this._each(function(){
-    if (!this.parentNode) return;
-    if (typeof node === 'string') this.insertAdjacentHTML('beforebegin', node);
-    else this.parentNode.insertBefore(isNode(node) ? node : (node instanceof NJ ? node.elements[0] : document.createTextNode(String(node))), this);
-  });
+  const cloneNeeded = this.elements.length > 1 && isNode(node);
+
+  return this._each(function(i){
+    if (!this.parentNode) return;
+
+    if (typeof node === 'string') {
+      this.insertAdjacentHTML('beforebegin', node);
+      return;
+    }
+
+    const n = (cloneNeeded && i > 0)
+      ? node.cloneNode(true)
+      : (node instanceof NJ ? node.elements[0] : node);
+
+    const realNode = isNode(n) ? n : document.createTextNode(String(n));
+
+    this.parentNode.insertBefore(realNode, this);
+  });
 };

@@ -380,6 +422,24 @@ NJ.prototype.after = function(node){
-  return this._each(function(){
-    if (!this.parentNode) return;
-    if (typeof node === 'string') this.insertAdjacentHTML('afterend', node);
-    else this.parentNode.insertBefore(isNode(node) ? node : (node instanceof NJ ? node.elements[0] : document.createTextNode(String(node))), this.nextSibling);
-  });
+  const cloneNeeded = this.elements.length > 1 && isNode(node);
+
+  return this._each(function(i){
+    if (!this.parentNode) return;
+
+    if (typeof node === 'string') {
+      this.insertAdjacentHTML('afterend', node);
+      return;
+    }
+
+    const n = (cloneNeeded && i > 0)
+      ? node.cloneNode(true)
+      : (node instanceof NJ ? node.elements[0] : node);
+
+    const realNode = isNode(n) ? n : document.createTextNode(String(n));
+
+    this.parentNode.insertBefore(realNode, this.nextSibling);
+  });
 };

@@ -455,7 +515,11 @@ NJ.prototype.trigger = function(evName){
-  return this._each(function(){ this.dispatchEvent(new Event(evName)); });
+  return this._each(function(){
+    this.dispatchEvent(new Event(evName, {
+      bubbles: true,
+      cancelable: true
+    }));
+  });
 };

@@ -680,6 +750,26 @@
 nj.exec = function(code){
-  console.warn('nj.exec is potentially unsafe. Prefer explicit functions.');
-  return (new Function(code))();
+  if (!nj.config) nj.config = {};
+  if (nj.config.allowExec !== true) {
+    throw new Error("nj.exec() is disabled (security). Enable via nj.config.allowExec = true");
+  }
+  return (new Function(code))();
 };

+nj.exC = function(code){
+  if (!nj.config) nj.config = {};
+  if (nj.config.allowExec !== true) {
+    throw new Error("nj.exC() is disabled (security). Enable via nj.config.allowExec = true");
+  }
+  return (new Function(code))();
+};

@@ -520,15 +600,34 @@ NJ.prototype.css = function(prop, val){
-    return this.elements[0] ? getComputedStyle(this.elements[0])[prop] : undefined;
+    const key = prop.includes('-')
+      ? prop
+      : prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
+    return this.elements[0]
+      ? getComputedStyle(this.elements[0]).getPropertyValue(key)
+      : undefined;
@@
-  return this._each(function(){ this.style[prop] = val; });
+  return this._each(function(){
+    if (prop.includes('-')) {
+      this.style.setProperty(prop, val);
+    } else {
+      this.style[prop] = val;
+    }
+  });

@@ -610,10 +709,28 @@ nj.ajax.post = function(url, data={}, opts={})
-    return fetch(url, { method: 'POST', headers: Object.assign({'Content-Type':'application/json'}, headers), body: JSON.stringify(data) })
-      .then(r => { if (!r.ok) throw new Error('Network response was not ok'); return r.json(); });
+    return fetch(url, {
+      method: 'POST',
+      headers: Object.assign({'Content-Type':'application/json'}, headers),
+      body: JSON.stringify(data)
+    })
+    .then(async r => {
+      if (!r.ok) {
+        const text = await r.text().catch(()=> '');
+        const err = new Error(`HTTP ${r.status}: ${r.statusText}`);
+        err.status = r.status;
+        err.body = text;
+        throw err;
+      }
+      return r.json();
+    });

@@ -720,10 +840,20 @@ NJ.prototype.slideDown = function(duration=300, display){
-    el.style.display = display || 'block';
-    const height = el.getBoundingClientRect().height;
+    el.style.display = display || 'block';
+    el.style.height = 'auto';
+    const height = el.getBoundingClientRect().height;
+    el.style.height = '0px';

     el.style.overflow='hidden';
-    animate(el, [{height:'0px'},{height:height+'px'}], {duration}).then(()=>{ el.style.height=''; el.style.overflow=''; }).catch(noop);
+    animate(el,
+      [{ height:'0px' }, { height: height + 'px' }],
+      { duration }
+    ).then(()=>{
+      el.style.height='';
+      el.style.overflow='';
+    }).catch(noop);

