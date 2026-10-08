/* Small, feature-detected fallbacks for APIs actually used by the bundled UI. */
(function () {
  'use strict';
  if (typeof window.globalThis === 'undefined') window.globalThis = window;
  if (typeof window.queueMicrotask !== 'function') {
    window.queueMicrotask = function (callback) {
      Promise.resolve().then(callback).catch(function (error) {
        setTimeout(function () { throw error; }, 0);
      });
    };
  }
  if (!Object.hasOwn) Object.hasOwn = function (object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
  if (!Array.prototype.flatMap) {
    Object.defineProperty(Array.prototype, 'flatMap', { configurable: true, writable: true, value: function (callback, thisArg) {
      var output = [];
      this.forEach(function (value, index, array) {
        var mapped = callback.call(thisArg, value, index, array);
        if (Array.isArray(mapped)) mapped.forEach(function (item) { output.push(item); });
        else output.push(mapped);
      });
      return output;
    }});
  }
  /* Only local UI cancellation is required; this is not a network implementation. */
  if (typeof window.AbortController !== 'function') {
    window.AbortController = function () {
      var target = document.createDocumentFragment();
      var signal = { aborted: false, addEventListener: target.addEventListener.bind(target), removeEventListener: target.removeEventListener.bind(target) };
      this.signal = signal;
      this.abort = function () {
        if (signal.aborted) return;
        signal.aborted = true;
        target.dispatchEvent(new Event('abort'));
      };
    };
  }
  /* Base UI retains at most 20 focus-history references. Release detached nodes on access. */
  if (typeof window.WeakRef !== 'function') {
    window.WeakRef = function (node) {
      this.deref = function () { if (node && !node.isConnected) node = undefined; return node; };
    };
  }
  if (!Element.prototype.replaceChildren) {
    Element.prototype.replaceChildren = function () {
      while (this.firstChild) this.removeChild(this.firstChild);
      for (var i = 0; i < arguments.length; i++) this.appendChild(typeof arguments[i] === 'string' ? document.createTextNode(arguments[i]) : arguments[i]);
    };
  }
})();
