const I = typeof performance == "object" && performance && typeof performance.now == "function" ? performance : Date, X = typeof AbortController == "function", R = X ? AbortController : class {
  constructor() {
    this.signal = new K();
  }
  abort(e = new Error("This operation was aborted")) {
    this.signal.reason = this.signal.reason || e, this.signal.aborted = !0, this.signal.dispatchEvent({
      type: "abort",
      target: this.signal
    });
  }
}, Z = typeof AbortSignal == "function", Y = typeof R.AbortSignal == "function", K = Z ? AbortSignal : Y ? R.AbortController : class {
  constructor() {
    this.reason = void 0, this.aborted = !1, this._listeners = [];
  }
  dispatchEvent(e) {
    e.type === "abort" && (this.aborted = !0, this.onabort(e), this._listeners.forEach((i) => i(e), this));
  }
  onabort() {
  }
  addEventListener(e, i) {
    e === "abort" && this._listeners.push(i);
  }
  removeEventListener(e, i) {
    e === "abort" && (this._listeners = this._listeners.filter((t) => t !== i));
  }
}, G = /* @__PURE__ */ new Set(), W = (s, e) => {
  const i = `LRU_CACHE_OPTION_${s}`;
  D(i) && V(i, `${s} option`, `options.${e}`, A);
}, j = (s, e) => {
  const i = `LRU_CACHE_METHOD_${s}`;
  if (D(i)) {
    const { prototype: t } = A, { get: n } = Object.getOwnPropertyDescriptor(t, s);
    V(i, `${s} method`, `cache.${e}()`, n);
  }
}, ee = (s, e) => {
  const i = `LRU_CACHE_PROPERTY_${s}`;
  if (D(i)) {
    const { prototype: t } = A, { get: n } = Object.getOwnPropertyDescriptor(t, s);
    V(i, `${s} property`, `cache.${e}`, n);
  }
}, Q = (...s) => {
  typeof process == "object" && process && typeof process.emitWarning == "function" ? process.emitWarning(...s) : console.error(...s);
}, D = (s) => !G.has(s), V = (s, e, i, t) => {
  G.add(s);
  const n = `The ${e} is deprecated. Please use ${i} instead.`;
  Q(n, "DeprecationWarning", s, t);
}, _ = (s) => s && s === Math.floor(s) && s > 0 && isFinite(s), J = (s) => _(s) ? s <= Math.pow(2, 8) ? Uint8Array : s <= Math.pow(2, 16) ? Uint16Array : s <= Math.pow(2, 32) ? Uint32Array : s <= Number.MAX_SAFE_INTEGER ? C : null : null;
class C extends Array {
  constructor(e) {
    super(e), this.fill(0);
  }
}
class te {
  constructor(e) {
    if (e === 0)
      return [];
    const i = J(e);
    this.heap = new i(e), this.length = 0;
  }
  push(e) {
    this.heap[this.length++] = e;
  }
  pop() {
    return this.heap[--this.length];
  }
}
class A {
  constructor(e = {}) {
    const {
      max: i = 0,
      ttl: t,
      ttlResolution: n = 1,
      ttlAutopurge: r,
      updateAgeOnGet: o,
      updateAgeOnHas: y,
      allowStale: c,
      dispose: l,
      disposeAfter: a,
      noDisposeOnSet: h,
      noUpdateTTL: g,
      maxSize: f = 0,
      maxEntrySize: u = 0,
      sizeCalculation: v,
      fetchMethod: d,
      fetchContext: S,
      noDeleteOnFetchRejection: E,
      noDeleteOnStaleGet: z,
      allowStaleOnFetchRejection: m,
      allowStaleOnFetchAbort: T,
      ignoreFetchAbort: x
    } = e, { length: F, maxAge: k, stale: O } = e instanceof A ? {} : e;
    if (i !== 0 && !_(i))
      throw new TypeError("max option must be a nonnegative integer");
    const P = i ? J(i) : Array;
    if (!P)
      throw new Error("invalid max value: " + i);
    if (this.max = i, this.maxSize = f, this.maxEntrySize = u || this.maxSize, this.sizeCalculation = v || F, this.sizeCalculation) {
      if (!this.maxSize && !this.maxEntrySize)
        throw new TypeError(
          "cannot set sizeCalculation without setting maxSize or maxEntrySize"
        );
      if (typeof this.sizeCalculation != "function")
        throw new TypeError("sizeCalculation set to non-function");
    }
    if (this.fetchMethod = d || null, this.fetchMethod && typeof this.fetchMethod != "function")
      throw new TypeError(
        "fetchMethod must be a function if specified"
      );
    if (this.fetchContext = S, !this.fetchMethod && S !== void 0)
      throw new TypeError(
        "cannot set fetchContext without fetchMethod"
      );
    if (this.keyMap = /* @__PURE__ */ new Map(), this.keyList = new Array(i).fill(null), this.valList = new Array(i).fill(null), this.next = new P(i), this.prev = new P(i), this.head = 0, this.tail = 0, this.free = new te(i), this.initialFill = 1, this.size = 0, typeof l == "function" && (this.dispose = l), typeof a == "function" ? (this.disposeAfter = a, this.disposed = []) : (this.disposeAfter = null, this.disposed = null), this.noDisposeOnSet = !!h, this.noUpdateTTL = !!g, this.noDeleteOnFetchRejection = !!E, this.allowStaleOnFetchRejection = !!m, this.allowStaleOnFetchAbort = !!T, this.ignoreFetchAbort = !!x, this.maxEntrySize !== 0) {
      if (this.maxSize !== 0 && !_(this.maxSize))
        throw new TypeError(
          "maxSize must be a positive integer if specified"
        );
      if (!_(this.maxEntrySize))
        throw new TypeError(
          "maxEntrySize must be a positive integer if specified"
        );
      this.initializeSizeTracking();
    }
    if (this.allowStale = !!c || !!O, this.noDeleteOnStaleGet = !!z, this.updateAgeOnGet = !!o, this.updateAgeOnHas = !!y, this.ttlResolution = _(n) || n === 0 ? n : 1, this.ttlAutopurge = !!r, this.ttl = t || k || 0, this.ttl) {
      if (!_(this.ttl))
        throw new TypeError(
          "ttl must be a positive integer if specified"
        );
      this.initializeTTLTracking();
    }
    if (this.max === 0 && this.ttl === 0 && this.maxSize === 0)
      throw new TypeError(
        "At least one of max, maxSize, or ttl is required"
      );
    if (!this.ttlAutopurge && !this.max && !this.maxSize) {
      const U = "LRU_CACHE_UNBOUNDED";
      D(U) && (G.add(U), Q("TTL caching without ttlAutopurge, max, or maxSize can result in unbounded memory consumption.", "UnboundedCacheWarning", U, A));
    }
    O && W("stale", "allowStale"), k && W("maxAge", "ttl"), F && W("length", "sizeCalculation");
  }
  getRemainingTTL(e) {
    return this.has(e, { updateAgeOnHas: !1 }) ? 1 / 0 : 0;
  }
  initializeTTLTracking() {
    this.ttls = new C(this.max), this.starts = new C(this.max), this.setItemTTL = (t, n, r = I.now()) => {
      if (this.starts[t] = n !== 0 ? r : 0, this.ttls[t] = n, n !== 0 && this.ttlAutopurge) {
        const o = setTimeout(() => {
          this.isStale(t) && this.delete(this.keyList[t]);
        }, n + 1);
        o.unref && o.unref();
      }
    }, this.updateItemAge = (t) => {
      this.starts[t] = this.ttls[t] !== 0 ? I.now() : 0;
    }, this.statusTTL = (t, n) => {
      t && (t.ttl = this.ttls[n], t.start = this.starts[n], t.now = e || i(), t.remainingTTL = t.now + t.ttl - t.start);
    };
    let e = 0;
    const i = () => {
      const t = I.now();
      if (this.ttlResolution > 0) {
        e = t;
        const n = setTimeout(
          () => e = 0,
          this.ttlResolution
        );
        n.unref && n.unref();
      }
      return t;
    };
    this.getRemainingTTL = (t) => {
      const n = this.keyMap.get(t);
      return n === void 0 ? 0 : this.ttls[n] === 0 || this.starts[n] === 0 ? 1 / 0 : this.starts[n] + this.ttls[n] - (e || i());
    }, this.isStale = (t) => this.ttls[t] !== 0 && this.starts[t] !== 0 && (e || i()) - this.starts[t] > this.ttls[t];
  }
  updateItemAge(e) {
  }
  statusTTL(e, i) {
  }
  setItemTTL(e, i, t) {
  }
  isStale(e) {
    return !1;
  }
  initializeSizeTracking() {
    this.calculatedSize = 0, this.sizes = new C(this.max), this.removeItemSize = (e) => {
      this.calculatedSize -= this.sizes[e], this.sizes[e] = 0;
    }, this.requireSize = (e, i, t, n) => {
      if (this.isBackgroundFetch(i))
        return 0;
      if (!_(t))
        if (n) {
          if (typeof n != "function")
            throw new TypeError("sizeCalculation must be a function");
          if (t = n(i, e), !_(t))
            throw new TypeError(
              "sizeCalculation return invalid (expect positive integer)"
            );
        } else
          throw new TypeError(
            "invalid size value (must be positive integer). When maxSize or maxEntrySize is used, sizeCalculation or size must be set."
          );
      return t;
    }, this.addItemSize = (e, i, t) => {
      if (this.sizes[e] = i, this.maxSize) {
        const n = this.maxSize - this.sizes[e];
        for (; this.calculatedSize > n; )
          this.evict(!0);
      }
      this.calculatedSize += this.sizes[e], t && (t.entrySize = i, t.totalCalculatedSize = this.calculatedSize);
    };
  }
  removeItemSize(e) {
  }
  addItemSize(e, i) {
  }
  requireSize(e, i, t, n) {
    if (t || n)
      throw new TypeError(
        "cannot set size without setting maxSize or maxEntrySize on cache"
      );
  }
  *indexes({ allowStale: e = this.allowStale } = {}) {
    if (this.size)
      for (let i = this.tail; !(!this.isValidIndex(i) || ((e || !this.isStale(i)) && (yield i), i === this.head)); )
        i = this.prev[i];
  }
  *rindexes({ allowStale: e = this.allowStale } = {}) {
    if (this.size)
      for (let i = this.head; !(!this.isValidIndex(i) || ((e || !this.isStale(i)) && (yield i), i === this.tail)); )
        i = this.next[i];
  }
  isValidIndex(e) {
    return e !== void 0 && this.keyMap.get(this.keyList[e]) === e;
  }
  *entries() {
    for (const e of this.indexes())
      this.valList[e] !== void 0 && this.keyList[e] !== void 0 && !this.isBackgroundFetch(this.valList[e]) && (yield [this.keyList[e], this.valList[e]]);
  }
  *rentries() {
    for (const e of this.rindexes())
      this.valList[e] !== void 0 && this.keyList[e] !== void 0 && !this.isBackgroundFetch(this.valList[e]) && (yield [this.keyList[e], this.valList[e]]);
  }
  *keys() {
    for (const e of this.indexes())
      this.keyList[e] !== void 0 && !this.isBackgroundFetch(this.valList[e]) && (yield this.keyList[e]);
  }
  *rkeys() {
    for (const e of this.rindexes())
      this.keyList[e] !== void 0 && !this.isBackgroundFetch(this.valList[e]) && (yield this.keyList[e]);
  }
  *values() {
    for (const e of this.indexes())
      this.valList[e] !== void 0 && !this.isBackgroundFetch(this.valList[e]) && (yield this.valList[e]);
  }
  *rvalues() {
    for (const e of this.rindexes())
      this.valList[e] !== void 0 && !this.isBackgroundFetch(this.valList[e]) && (yield this.valList[e]);
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  find(e, i) {
    for (const t of this.indexes()) {
      const n = this.valList[t], r = this.isBackgroundFetch(n) ? n.__staleWhileFetching : n;
      if (r !== void 0 && e(r, this.keyList[t], this))
        return this.get(this.keyList[t], i);
    }
  }
  forEach(e, i = this) {
    for (const t of this.indexes()) {
      const n = this.valList[t], r = this.isBackgroundFetch(n) ? n.__staleWhileFetching : n;
      r !== void 0 && e.call(i, r, this.keyList[t], this);
    }
  }
  rforEach(e, i = this) {
    for (const t of this.rindexes()) {
      const n = this.valList[t], r = this.isBackgroundFetch(n) ? n.__staleWhileFetching : n;
      r !== void 0 && e.call(i, r, this.keyList[t], this);
    }
  }
  get prune() {
    return j("prune", "purgeStale"), this.purgeStale;
  }
  purgeStale() {
    let e = !1;
    for (const i of this.rindexes({ allowStale: !0 }))
      this.isStale(i) && (this.delete(this.keyList[i]), e = !0);
    return e;
  }
  dump() {
    const e = [];
    for (const i of this.indexes({ allowStale: !0 })) {
      const t = this.keyList[i], n = this.valList[i], r = this.isBackgroundFetch(n) ? n.__staleWhileFetching : n;
      if (r === void 0) continue;
      const o = { value: r };
      if (this.ttls) {
        o.ttl = this.ttls[i];
        const y = I.now() - this.starts[i];
        o.start = Math.floor(Date.now() - y);
      }
      this.sizes && (o.size = this.sizes[i]), e.unshift([t, o]);
    }
    return e;
  }
  load(e) {
    this.clear();
    for (const [i, t] of e) {
      if (t.start) {
        const n = Date.now() - t.start;
        t.start = I.now() - n;
      }
      this.set(i, t.value, t);
    }
  }
  dispose(e, i, t) {
  }
  set(e, i, {
    ttl: t = this.ttl,
    start: n,
    noDisposeOnSet: r = this.noDisposeOnSet,
    size: o = 0,
    sizeCalculation: y = this.sizeCalculation,
    noUpdateTTL: c = this.noUpdateTTL,
    status: l
  } = {}) {
    if (o = this.requireSize(e, i, o, y), this.maxEntrySize && o > this.maxEntrySize)
      return l && (l.set = "miss", l.maxEntrySizeExceeded = !0), this.delete(e), this;
    let a = this.size === 0 ? void 0 : this.keyMap.get(e);
    if (a === void 0)
      a = this.newIndex(), this.keyList[a] = e, this.valList[a] = i, this.keyMap.set(e, a), this.next[this.tail] = a, this.prev[a] = this.tail, this.tail = a, this.size++, this.addItemSize(a, o, l), l && (l.set = "add"), c = !1;
    else {
      this.moveToTail(a);
      const h = this.valList[a];
      if (i !== h) {
        if (this.isBackgroundFetch(h) ? h.__abortController.abort(new Error("replaced")) : r || (this.dispose(h, e, "set"), this.disposeAfter && this.disposed.push([h, e, "set"])), this.removeItemSize(a), this.valList[a] = i, this.addItemSize(a, o, l), l) {
          l.set = "replace";
          const g = h && this.isBackgroundFetch(h) ? h.__staleWhileFetching : h;
          g !== void 0 && (l.oldValue = g);
        }
      } else l && (l.set = "update");
    }
    if (t !== 0 && this.ttl === 0 && !this.ttls && this.initializeTTLTracking(), c || this.setItemTTL(a, t, n), this.statusTTL(l, a), this.disposeAfter)
      for (; this.disposed.length; )
        this.disposeAfter(...this.disposed.shift());
    return this;
  }
  newIndex() {
    return this.size === 0 ? this.tail : this.size === this.max && this.max !== 0 ? this.evict(!1) : this.free.length !== 0 ? this.free.pop() : this.initialFill++;
  }
  pop() {
    if (this.size) {
      const e = this.valList[this.head];
      return this.evict(!0), e;
    }
  }
  evict(e) {
    const i = this.head, t = this.keyList[i], n = this.valList[i];
    return this.isBackgroundFetch(n) ? n.__abortController.abort(new Error("evicted")) : (this.dispose(n, t, "evict"), this.disposeAfter && this.disposed.push([n, t, "evict"])), this.removeItemSize(i), e && (this.keyList[i] = null, this.valList[i] = null, this.free.push(i)), this.head = this.next[i], this.keyMap.delete(t), this.size--, i;
  }
  has(e, { updateAgeOnHas: i = this.updateAgeOnHas, status: t } = {}) {
    const n = this.keyMap.get(e);
    if (n !== void 0)
      if (this.isStale(n))
        t && (t.has = "stale", this.statusTTL(t, n));
      else return i && this.updateItemAge(n), t && (t.has = "hit"), this.statusTTL(t, n), !0;
    else t && (t.has = "miss");
    return !1;
  }
  // like get(), but without any LRU updating or TTL expiration
  peek(e, { allowStale: i = this.allowStale } = {}) {
    const t = this.keyMap.get(e);
    if (t !== void 0 && (i || !this.isStale(t))) {
      const n = this.valList[t];
      return this.isBackgroundFetch(n) ? n.__staleWhileFetching : n;
    }
  }
  backgroundFetch(e, i, t, n) {
    const r = i === void 0 ? void 0 : this.valList[i];
    if (this.isBackgroundFetch(r))
      return r;
    const o = new R();
    t.signal && t.signal.addEventListener(
      "abort",
      () => o.abort(t.signal.reason)
    );
    const y = {
      signal: o.signal,
      options: t,
      context: n
    }, c = (f, u = !1) => {
      const { aborted: v } = o.signal, d = t.ignoreFetchAbort && f !== void 0;
      return t.status && (v && !u ? (t.status.fetchAborted = !0, t.status.fetchError = o.signal.reason, d && (t.status.fetchAbortIgnored = !0)) : t.status.fetchResolved = !0), v && !d && !u ? a(o.signal.reason) : (this.valList[i] === g && (f === void 0 ? g.__staleWhileFetching ? this.valList[i] = g.__staleWhileFetching : this.delete(e) : (t.status && (t.status.fetchUpdated = !0), this.set(e, f, y.options))), f);
    }, l = (f) => (t.status && (t.status.fetchRejected = !0, t.status.fetchError = f), a(f)), a = (f) => {
      const { aborted: u } = o.signal, v = u && t.allowStaleOnFetchAbort, d = v || t.allowStaleOnFetchRejection, S = d || t.noDeleteOnFetchRejection;
      if (this.valList[i] === g && (!S || g.__staleWhileFetching === void 0 ? this.delete(e) : v || (this.valList[i] = g.__staleWhileFetching)), d)
        return t.status && g.__staleWhileFetching !== void 0 && (t.status.returnedStale = !0), g.__staleWhileFetching;
      if (g.__returned === g)
        throw f;
    }, h = (f, u) => {
      this.fetchMethod(e, r, y).then((v) => f(v), u), o.signal.addEventListener("abort", () => {
        (!t.ignoreFetchAbort || t.allowStaleOnFetchAbort) && (f(), t.allowStaleOnFetchAbort && (f = (v) => c(v, !0)));
      });
    };
    t.status && (t.status.fetchDispatched = !0);
    const g = new Promise(h).then(c, l);
    return g.__abortController = o, g.__staleWhileFetching = r, g.__returned = null, i === void 0 ? (this.set(e, g, { ...y.options, status: void 0 }), i = this.keyMap.get(e)) : this.valList[i] = g, g;
  }
  isBackgroundFetch(e) {
    return e && typeof e == "object" && typeof e.then == "function" && Object.prototype.hasOwnProperty.call(
      e,
      "__staleWhileFetching"
    ) && Object.prototype.hasOwnProperty.call(e, "__returned") && (e.__returned === e || e.__returned === null);
  }
  // this takes the union of get() and set() opts, because it does both
  async fetch(e, {
    // get options
    allowStale: i = this.allowStale,
    updateAgeOnGet: t = this.updateAgeOnGet,
    noDeleteOnStaleGet: n = this.noDeleteOnStaleGet,
    // set options
    ttl: r = this.ttl,
    noDisposeOnSet: o = this.noDisposeOnSet,
    size: y = 0,
    sizeCalculation: c = this.sizeCalculation,
    noUpdateTTL: l = this.noUpdateTTL,
    // fetch exclusive options
    noDeleteOnFetchRejection: a = this.noDeleteOnFetchRejection,
    allowStaleOnFetchRejection: h = this.allowStaleOnFetchRejection,
    ignoreFetchAbort: g = this.ignoreFetchAbort,
    allowStaleOnFetchAbort: f = this.allowStaleOnFetchAbort,
    fetchContext: u = this.fetchContext,
    forceRefresh: v = !1,
    status: d,
    signal: S
  } = {}) {
    if (!this.fetchMethod)
      return d && (d.fetch = "get"), this.get(e, {
        allowStale: i,
        updateAgeOnGet: t,
        noDeleteOnStaleGet: n,
        status: d
      });
    const E = {
      allowStale: i,
      updateAgeOnGet: t,
      noDeleteOnStaleGet: n,
      ttl: r,
      noDisposeOnSet: o,
      size: y,
      sizeCalculation: c,
      noUpdateTTL: l,
      noDeleteOnFetchRejection: a,
      allowStaleOnFetchRejection: h,
      allowStaleOnFetchAbort: f,
      ignoreFetchAbort: g,
      status: d,
      signal: S
    };
    let z = this.keyMap.get(e);
    if (z === void 0) {
      d && (d.fetch = "miss");
      const m = this.backgroundFetch(e, z, E, u);
      return m.__returned = m;
    } else {
      const m = this.valList[z];
      if (this.isBackgroundFetch(m)) {
        const O = i && m.__staleWhileFetching !== void 0;
        return d && (d.fetch = "inflight", O && (d.returnedStale = !0)), O ? m.__staleWhileFetching : m.__returned = m;
      }
      const T = this.isStale(z);
      if (!v && !T)
        return d && (d.fetch = "hit"), this.moveToTail(z), t && this.updateItemAge(z), this.statusTTL(d, z), m;
      const x = this.backgroundFetch(e, z, E, u), F = x.__staleWhileFetching !== void 0, k = F && i;
      return d && (d.fetch = F && T ? "stale" : "refresh", k && T && (d.returnedStale = !0)), k ? x.__staleWhileFetching : x.__returned = x;
    }
  }
  get(e, {
    allowStale: i = this.allowStale,
    updateAgeOnGet: t = this.updateAgeOnGet,
    noDeleteOnStaleGet: n = this.noDeleteOnStaleGet,
    status: r
  } = {}) {
    const o = this.keyMap.get(e);
    if (o !== void 0) {
      const y = this.valList[o], c = this.isBackgroundFetch(y);
      return this.statusTTL(r, o), this.isStale(o) ? (r && (r.get = "stale"), c ? (r && (r.returnedStale = i && y.__staleWhileFetching !== void 0), i ? y.__staleWhileFetching : void 0) : (n || this.delete(e), r && (r.returnedStale = i), i ? y : void 0)) : (r && (r.get = "hit"), c ? y.__staleWhileFetching : (this.moveToTail(o), t && this.updateItemAge(o), y));
    } else r && (r.get = "miss");
  }
  connect(e, i) {
    this.prev[i] = e, this.next[e] = i;
  }
  moveToTail(e) {
    e !== this.tail && (e === this.head ? this.head = this.next[e] : this.connect(this.prev[e], this.next[e]), this.connect(this.tail, e), this.tail = e);
  }
  get del() {
    return j("del", "delete"), this.delete;
  }
  delete(e) {
    let i = !1;
    if (this.size !== 0) {
      const t = this.keyMap.get(e);
      if (t !== void 0)
        if (i = !0, this.size === 1)
          this.clear();
        else {
          this.removeItemSize(t);
          const n = this.valList[t];
          this.isBackgroundFetch(n) ? n.__abortController.abort(new Error("deleted")) : (this.dispose(n, e, "delete"), this.disposeAfter && this.disposed.push([n, e, "delete"])), this.keyMap.delete(e), this.keyList[t] = null, this.valList[t] = null, t === this.tail ? this.tail = this.prev[t] : t === this.head ? this.head = this.next[t] : (this.next[this.prev[t]] = this.next[t], this.prev[this.next[t]] = this.prev[t]), this.size--, this.free.push(t);
        }
    }
    if (this.disposed)
      for (; this.disposed.length; )
        this.disposeAfter(...this.disposed.shift());
    return i;
  }
  clear() {
    for (const e of this.rindexes({ allowStale: !0 })) {
      const i = this.valList[e];
      if (this.isBackgroundFetch(i))
        i.__abortController.abort(new Error("deleted"));
      else {
        const t = this.keyList[e];
        this.dispose(i, t, "delete"), this.disposeAfter && this.disposed.push([i, t, "delete"]);
      }
    }
    if (this.keyMap.clear(), this.valList.fill(null), this.keyList.fill(null), this.ttls && (this.ttls.fill(0), this.starts.fill(0)), this.sizes && this.sizes.fill(0), this.head = 0, this.tail = 0, this.initialFill = 1, this.free.length = 0, this.calculatedSize = 0, this.size = 0, this.disposed)
      for (; this.disposed.length; )
        this.disposeAfter(...this.disposed.shift());
  }
  get reset() {
    return j("reset", "clear"), this.clear;
  }
  get length() {
    return ee("length", "size"), this.size;
  }
  static get AbortController() {
    return R;
  }
  static get AbortSignal() {
    return K;
  }
}
var N;
const L = {
  maxPageSize: 4096,
  cacheSize: 1024,
  headers: {}
};
var $;
(function(s) {
  s[s.WORKMSG = 16777215] = "WORKMSG", s[s.HANDSHAKE = 16777214] = "HANDSHAKE";
})($ = $ || ($ = {}));
const ie = typeof SQLITE_DEBUG < "u" && SQLITE_DEBUG || typeof process < "u" && typeof ((N = process == null ? void 0 : process.env) === null || N === void 0 ? void 0 : N.SQLITE_DEBUG) < "u" && process.env.SQLITE_DEBUG || "", se = ["threads", "vfs", "cache", "http"], w = {};
for (const s of se)
  w[s] = ie.includes(s) ? console.debug.bind(console) : () => {
  };
const ne = function() {
  const s = new ArrayBuffer(2), e = new Uint8Array(s), i = new Uint16Array(s);
  if (e[0] = 240, e[1] = 13, i[0] == 61453)
    return w.threads("System is Big-Endian"), !1;
  if (i[0] == 3568)
    return w.threads("System is Little-Endian"), !0;
  throw new Error(`Failed determining endianness: ${i}`);
}();
function re(s) {
  if (ne)
    for (let e = 0; e < s.length; e++)
      s[e] = (s[e] & 65280) >> 8 | (s[e] & 255) << 8;
}
var M = function(s, e, i, t) {
  function n(r) {
    return r instanceof i ? r : new i(function(o) {
      o(r);
    });
  }
  return new (i || (i = Promise))(function(r, o) {
    function y(a) {
      try {
        l(t.next(a));
      } catch (h) {
        o(h);
      }
    }
    function c(a) {
      try {
        l(t.throw(a));
      } catch (h) {
        o(h);
      }
    }
    function l(a) {
      a.done ? r(a.value) : n(a.value).then(y, c);
    }
    l((t = t.apply(s, e || [])).next());
  });
};
let p;
const q = {}, B = new A({
  max: 32
});
let b, oe = 1;
const H = {
  // HTTP is a stateless protocol, so xOpen means verify if the URL is valid
  xOpen: function(s) {
    return M(this, void 0, void 0, function* () {
      let e = B.get(s.url);
      return e instanceof Promise && (e = yield e), e !== void 0 || (e = fetch(s.url, { method: "HEAD", headers: Object.assign({}, p == null ? void 0 : p.headers) }).then((i) => {
        var t;
        return i.headers.get("Accept-Ranges") !== "bytes" && console.warn(`Server for ${s.url} does not advertise 'Accept-Ranges'. If the server supports it, in order to remove this message, add "Accept-Ranges: bytes". Additionally, if using CORS, add "Access-Control-Expose-Headers: *".`), {
          url: s.url,
          id: oe++,
          size: BigInt((t = i.headers.get("Content-Length")) !== null && t !== void 0 ? t : 0),
          // This will be determined on the first read
          pageSize: null
        };
      }), B.set(s.url, e), B.set(s.url, yield e)), 0;
    });
  },
  // There is no real difference between xOpen and xAccess, only the semantics differ
  xAccess: function(s, e) {
    return M(this, void 0, void 0, function* () {
      const i = new Uint32Array(e.shm, 0, 1);
      try {
        (yield H.xOpen(s, e)) === 0 ? i[0] = 1 : i[0] = 0;
      } catch {
        i[0] = 0;
      }
      return 0;
    });
  },
  xRead: function(s, e) {
    var i, t, n;
    return M(this, void 0, void 0, function* () {
      let r = B.get(s.url);
      if (!r)
        throw new Error(`File ${s.url} not open`);
      if (r instanceof Promise && (r = yield r), s.n === void 0 || s.offset === void 0)
        throw new Error("Mandatory arguments missing");
      if (!r.pageSize) {
        r.pageSize = 1024;
        const f = new ArrayBuffer(2), u = yield H.xRead({ msg: "xRead", url: s.url, offset: BigInt(16), n: 2 }, { buffer: new Uint8Array(f) }), v = new Uint16Array(f);
        if (u !== 0)
          return u;
        if (re(v), r.pageSize = v[0], w.vfs(`page size is ${r.pageSize}`), r.pageSize != 1024 && (console.warn(`Page size for ${s.url} is ${r.pageSize}, recommended size is 1024`), b.delete(r.id + "|0")), r.pageSize > ((i = p == null ? void 0 : p.maxPageSize) !== null && i !== void 0 ? i : L.maxPageSize))
          throw new Error(`${r.pageSize} is over the maximum configured ${(t = p == null ? void 0 : p.maxPageSize) !== null && t !== void 0 ? t : L.maxPageSize}`);
      }
      const o = BigInt(r.pageSize), y = BigInt(s.n), c = s.offset / o;
      c * o !== s.offset && w.vfs(`Read chunk ${s.offset}:${s.n} is not page-aligned`);
      let l = c * o;
      if (l + o < s.offset + y)
        throw new Error(`Read chunk ${s.offset}:${s.n} spans across a page-boundary`);
      const a = r.id + "|" + c;
      let h = b.get(a);
      if (h instanceof Promise && (h = yield h), typeof h == "number") {
        w.cache(`cache hit (multi-page segment) for ${s.url}:${c}`);
        const f = BigInt(h) * o;
        h = b.get(r.id + "|" + h), h instanceof Promise && (h = yield h), h instanceof Uint8Array ? l = f : h = void 0;
      }
      if (typeof h > "u") {
        w.cache(`cache miss for ${s.url}:${c}`);
        let f = r.pageSize, u = c > 0 && b.get(r.id + "|" + (Number(c) - 1));
        u && (u instanceof Promise && (u = yield u), typeof u == "number" && (u = b.get(r.id + "|" + u)), u instanceof Promise && (u = yield u), u instanceof Uint8Array && (f = u.byteLength * 2, w.cache(`downloading super page of size ${f}`)));
        const v = f / r.pageSize;
        w.http(`downloading page ${c} of size ${f} starting at ${l}`);
        const d = fetch(s.url, {
          method: "GET",
          headers: Object.assign(Object.assign({}, (n = p == null ? void 0 : p.headers) !== null && n !== void 0 ? n : L.headers), { Range: `bytes=${l}-${l + BigInt(f - 1)}` })
        }).then((S) => S.arrayBuffer()).then((S) => new Uint8Array(S));
        b.set(a, d);
        for (let S = Number(c) + 1; S < Number(c) + v; S++)
          b.set(r.id + "|" + S, d.then(() => Number(c)));
        if (h = yield d, !(h instanceof Uint8Array) || h.length === 0)
          throw new Error(`Invalid HTTP response received: ${JSON.stringify(d)}`);
        b.set(a, h);
        for (let S = Number(c) + 1; S < Number(c) + v; S++)
          b.set(r.id + "|" + S, Number(c));
      } else
        w.cache(`cache hit for ${s.url}:${c}`);
      const g = Number(s.offset - l);
      return e.buffer.set(h.subarray(g, g + s.n)), 0;
    });
  },
  // This is cached
  xFilesize: function(s, e) {
    return M(this, void 0, void 0, function* () {
      let i = B.get(s.url);
      if (!i)
        throw new Error(`File ${s.fid} not open`);
      i instanceof Promise && (i = yield i);
      const t = new BigInt64Array(e.shm, 0, 1);
      return t[0] = i.size, 0;
    });
  }
};
function he({ data: s }) {
  return M(this, void 0, void 0, function* () {
    w.threads("Received new work message", this, s);
    let e;
    try {
      e = yield H[s.msg](s, this), w.threads("operation successful", this, e), Atomics.store(this.lock, 0, e);
    } catch (i) {
      console.error(i), Atomics.store(this.lock, 0, 1);
    }
    Atomics.notify(this.lock, 0);
  });
}
globalThis.onmessage = ({ data: s }) => {
  var e, i, t, n;
  switch (w.threads("Received new control message", s), s.msg) {
    case "handshake":
      {
        const r = new SharedArrayBuffer(((e = p == null ? void 0 : p.maxPageSize) !== null && e !== void 0 ? e : L.maxPageSize) + Int32Array.BYTES_PER_ELEMENT), o = new Int32Array(r, (i = p == null ? void 0 : p.maxPageSize) !== null && i !== void 0 ? i : L.maxPageSize), y = new Uint8Array(r, 0, (t = p == null ? void 0 : p.maxPageSize) !== null && t !== void 0 ? t : L.maxPageSize);
        Atomics.store(o, 0, $.HANDSHAKE), q[s.id] = { id: s.id, port: s.port, shm: r, lock: o, buffer: y }, s.port.onmessage = he.bind(q[s.id]), postMessage({ msg: "ack", id: s.id, shm: r, lock: o });
      }
      break;
    case "init":
      p = s.options, b = new A({
        maxSize: ((n = p == null ? void 0 : p.cacheSize) !== null && n !== void 0 ? n : L.cacheSize) * 1024,
        sizeCalculation: (r) => {
          var o;
          return (o = r.byteLength) !== null && o !== void 0 ? o : 4;
        }
      });
      break;
    case "close":
      postMessage({ msg: "ack" }), close();
      break;
    default:
      throw new Error(`Invalid message received by backend: ${s}`);
  }
};
if (typeof SharedArrayBuffer > "u")
  throw new Error('SharedArrayBuffer is not available. If your browser supports it, the webserver must send "Cross-Origin-Opener-Policy: same-origin "and "Cross-Origin-Embedder-Policy: require-corp" headers.');
