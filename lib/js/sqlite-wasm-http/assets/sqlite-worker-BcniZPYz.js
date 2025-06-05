var P;
const b = {
  timeout: 2e4,
  maxPageSize: 4096,
  cacheSize: 1024,
  headers: {}
};
var N;
(function(l) {
  l[l.WORKMSG = 16777215] = "WORKMSG", l[l.HANDSHAKE = 16777214] = "HANDSHAKE";
})(N = N || (N = {}));
const Y = typeof SQLITE_DEBUG < "u" && SQLITE_DEBUG || typeof process < "u" && typeof ((P = process == null ? void 0 : process.env) === null || P === void 0 ? void 0 : P.SQLITE_DEBUG) < "u" && process.env.SQLITE_DEBUG || "", X = ["threads", "vfs", "cache", "http"], c = {};
for (const l of X)
  c[l] = Y.includes(l) ? console.debug.bind(console) : () => {
  };
const C = {};
function J(l, e, t) {
  if (typeof SharedArrayBuffer > "u")
    throw new Error('SharedArrayBuffer is not available. If your browser supports it, the webserver must send "Cross-Origin-Opener-Policy: same-origin "and "Cross-Origin-Embedder-Policy: require-corp" headers.');
  if (!e || !(e.port instanceof MessagePort) || !(e.shm instanceof SharedArrayBuffer))
    throw new Error("No backend message channel in options");
  const i = new Int32Array(e.shm, e.shm.byteLength - Int32Array.BYTES_PER_ELEMENT), s = new Uint8Array(e.shm, 0, e.shm.byteLength - Int32Array.BYTES_PER_ELEMENT), h = l.capi, u = l.wasm, m = h.sqlite3_vfs, A = h.sqlite3_file, T = h.sqlite3_io_methods, g = new m(), a = new T();
  g.$iVersion = 1, g.$szOsFile = h.sqlite3_file.structInfo.sizeof, g.$mxPathname = 1024, g.$zName = u.allocCString("http"), g.$xDlOpen = g.$xDlError = g.$xDlSym = g.$xDlClose = null;
  const r = (o) => {
    var n;
    Atomics.store(i, 0, N.WORKMSG), e.port.postMessage(o);
    let d, _;
    do
      d = Atomics.wait(i, 0, N.WORKMSG, (n = t == null ? void 0 : t.timeout) !== null && n !== void 0 ? n : b.timeout), _ = Atomics.load(i, 0);
    while (d === "ok" && _ === N.WORKMSG);
    return d === "timed-out" ? (console.error("Backend timeout", d, i, o), -1) : _;
  }, f = {
    xCheckReservedLock: function(o, n) {
      return c.vfs("xCheckReservedLock", o, n), u.poke(n, 0, "i32"), 0;
    },
    xClose: function(o) {
      return c.vfs("xClose", o), C[o] ? (delete C[o], 0) : h.SQLITE_NOTFOUND;
    },
    xDeviceCharacteristics: function(o) {
      return c.vfs("xDeviceCharacteristics", o), h.SQLITE_IOCAP_IMMUTABLE;
    },
    xFileControl: function(o, n, d) {
      return c.vfs("xFileControl", o, n, d), n === h.SQLITE_FCNTL_SYNC ? h.SQLITE_OK : h.SQLITE_NOTFOUND;
    },
    xFileSize: function(o, n) {
      if (c.vfs("xFileSize", o, n), !C[o])
        return h.SQLITE_NOTFOUND;
      if (r({ msg: "xFilesize", url: C[o].url }) !== 0)
        return h.SQLITE_IOERR;
      const _ = new BigUint64Array(e.shm, 0, 1)[0];
      return c.vfs("file size is ", _), u.poke(n, _, "i64"), 0;
    },
    xLock: function(o, n) {
      return c.vfs("xLock", o, n), 0;
    },
    xRead: function(o, n, d, _) {
      if (c.vfs("xRead", o, n, d, _), Number(_) > Number.MAX_SAFE_INTEGER)
        return h.SQLITE_TOOBIG;
      if (!C[o])
        return h.SQLITE_NOTFOUND;
      const p = r({ msg: "xRead", url: C[o].url, n: d, offset: _ });
      return p !== 0 ? (console.error("xRead", p), h.SQLITE_IOERR) : (u.heap8u().set(s.subarray(0, d), n), h.SQLITE_OK);
    },
    xSync: function(o, n) {
      return c.vfs("xSync", o, n), 0;
    },
    xTruncate: function(o, n) {
      return c.vfs("xTruncate", o, n), 0;
    },
    xUnlock: function(o, n) {
      return c.vfs("xUnlock", o, n), 0;
    },
    xWrite: function(o, n, d, _) {
      return c.vfs("xWrite", o, n, d, _), h.SQLITE_READONLY;
    }
  }, v = {
    xAccess: function(o, n, d, _) {
      if (c.vfs("xAccess", o, n, d, _), (d & h.SQLITE_OPEN_READONLY) === 0)
        return u.poke(_, 0, "i32"), h.SQLITE_OK;
      const p = u.cstrToJs(n), S = r({ msg: "xAccess", url: p });
      if (S !== 0)
        return console.error("xAccess", S), h.SQLITE_IOERR;
      const L = new Uint32Array(e.shm, 0, 1)[0];
      return u.poke(_, L, "i32"), h.SQLITE_OK;
    },
    xCurrentTime: function(o, n) {
      return c.vfs("xCurrentTime", o, n), u.poke(n, 24405875e-1 + (/* @__PURE__ */ new Date()).getTime() / 864e5, "double"), 0;
    },
    xCurrentTimeInt64: function(o, n) {
      return c.vfs("xCurrentTimeInt64", o, n), u.poke(n, BigInt(24405875e-1) * BigInt(864e5) + BigInt((/* @__PURE__ */ new Date()).getTime()), "i64"), 0;
    },
    xDelete: function(o, n, d) {
      return c.vfs("xDelete", o, n, d), h.SQLITE_READONLY;
    },
    xFullPathname: function(o, n, d, _) {
      return c.vfs("xFullPathname", o, n, d, _), u.cstrncpy(_, n, d) < d ? 0 : h.SQLITE_CANTOPEN;
    },
    xGetLastError: function(o, n, d) {
      return c.vfs("xGetLastError", o, n, d), 0;
    },
    xOpen: function(o, n, d, _, p) {
      if (c.vfs("xOpen", o, n, d, _, p), n === 0)
        return console.error("HTTP VFS does not support anonymous files"), h.SQLITE_CANTOPEN;
      if (typeof n != "number")
        return h.SQLITE_ERROR;
      u.poke(p, h.SQLITE_OPEN_READONLY, "i32");
      const S = u.cstrToJs(n), L = /* @__PURE__ */ Object.create(null);
      L.fid = d, L.url = S, L.sq3File = new A(d), L.sq3File.$pMethods = a.pointer, C[d] = L;
      const y = r({ msg: "xOpen", url: S });
      return y < 0 ? (console.error("xOpen", y), h.SQLITE_IOERR) : y !== 0 ? (c.vfs("xOpen", y), h.SQLITE_CANTOPEN) : h.SQLITE_OK;
    }
  };
  l.vfs.installVfs({
    io: { struct: a, methods: f },
    vfs: { struct: g, methods: v }
  }), l.oo1.DB.dbCtorHelper.setVfsPostOpenSql(g.pointer, function(o, n) {
    var d;
    n.capi.sqlite3_busy_timeout(o, (d = t == null ? void 0 : t.timeout) !== null && d !== void 0 ? d : b.timeout), n.capi.sqlite3_exec(o, [
      "PRAGMA journal_mode=DELETE;",
      "PRAGMA cache_size=0;"
    ], 0, 0, 0);
  });
}
const M = typeof performance == "object" && performance && typeof performance.now == "function" ? performance : Date, Z = typeof AbortController == "function", Q = Z ? AbortController : class {
  constructor() {
    this.signal = new j();
  }
  abort(e = new Error("This operation was aborted")) {
    this.signal.reason = this.signal.reason || e, this.signal.aborted = !0, this.signal.dispatchEvent({
      type: "abort",
      target: this.signal
    });
  }
}, ee = typeof AbortSignal == "function", te = typeof Q.AbortSignal == "function", j = ee ? AbortSignal : te ? Q.AbortController : class {
  constructor() {
    this.reason = void 0, this.aborted = !1, this._listeners = [];
  }
  dispatchEvent(e) {
    e.type === "abort" && (this.aborted = !0, this.onabort(e), this._listeners.forEach((t) => t(e), this));
  }
  onabort() {
  }
  addEventListener(e, t) {
    e === "abort" && this._listeners.push(t);
  }
  removeEventListener(e, t) {
    e === "abort" && (this._listeners = this._listeners.filter((i) => i !== t));
  }
}, H = /* @__PURE__ */ new Set(), U = (l, e) => {
  const t = `LRU_CACHE_OPTION_${l}`;
  $(t) && q(t, `${l} option`, `options.${e}`, R);
}, W = (l, e) => {
  const t = `LRU_CACHE_METHOD_${l}`;
  if ($(t)) {
    const { prototype: i } = R, { get: s } = Object.getOwnPropertyDescriptor(i, l);
    q(t, `${l} method`, `cache.${e}()`, s);
  }
}, ie = (l, e) => {
  const t = `LRU_CACHE_PROPERTY_${l}`;
  if ($(t)) {
    const { prototype: i } = R, { get: s } = Object.getOwnPropertyDescriptor(i, l);
    q(t, `${l} property`, `cache.${e}`, s);
  }
}, V = (...l) => {
  typeof process == "object" && process && typeof process.emitWarning == "function" ? process.emitWarning(...l) : console.error(...l);
}, $ = (l) => !H.has(l), q = (l, e, t, i) => {
  H.add(l);
  const s = `The ${e} is deprecated. Please use ${t} instead.`;
  V(s, "DeprecationWarning", l, i);
}, k = (l) => l && l === Math.floor(l) && l > 0 && isFinite(l), K = (l) => k(l) ? l <= Math.pow(2, 8) ? Uint8Array : l <= Math.pow(2, 16) ? Uint16Array : l <= Math.pow(2, 32) ? Uint32Array : l <= Number.MAX_SAFE_INTEGER ? B : null : null;
class B extends Array {
  constructor(e) {
    super(e), this.fill(0);
  }
}
class se {
  constructor(e) {
    if (e === 0)
      return [];
    const t = K(e);
    this.heap = new t(e), this.length = 0;
  }
  push(e) {
    this.heap[this.length++] = e;
  }
  pop() {
    return this.heap[--this.length];
  }
}
class R {
  constructor(e = {}) {
    const {
      max: t = 0,
      ttl: i,
      ttlResolution: s = 1,
      ttlAutopurge: h,
      updateAgeOnGet: u,
      updateAgeOnHas: m,
      allowStale: A,
      dispose: T,
      disposeAfter: g,
      noDisposeOnSet: a,
      noUpdateTTL: r,
      maxSize: f = 0,
      maxEntrySize: v = 0,
      sizeCalculation: o,
      fetchMethod: n,
      fetchContext: d,
      noDeleteOnFetchRejection: _,
      noDeleteOnStaleGet: p,
      allowStaleOnFetchRejection: S,
      allowStaleOnFetchAbort: L,
      ignoreFetchAbort: y
    } = e, { length: x, maxAge: E, stale: w } = e instanceof R ? {} : e;
    if (t !== 0 && !k(t))
      throw new TypeError("max option must be a nonnegative integer");
    const z = t ? K(t) : Array;
    if (!z)
      throw new Error("invalid max value: " + t);
    if (this.max = t, this.maxSize = f, this.maxEntrySize = v || this.maxSize, this.sizeCalculation = o || x, this.sizeCalculation) {
      if (!this.maxSize && !this.maxEntrySize)
        throw new TypeError(
          "cannot set sizeCalculation without setting maxSize or maxEntrySize"
        );
      if (typeof this.sizeCalculation != "function")
        throw new TypeError("sizeCalculation set to non-function");
    }
    if (this.fetchMethod = n || null, this.fetchMethod && typeof this.fetchMethod != "function")
      throw new TypeError(
        "fetchMethod must be a function if specified"
      );
    if (this.fetchContext = d, !this.fetchMethod && d !== void 0)
      throw new TypeError(
        "cannot set fetchContext without fetchMethod"
      );
    if (this.keyMap = /* @__PURE__ */ new Map(), this.keyList = new Array(t).fill(null), this.valList = new Array(t).fill(null), this.next = new z(t), this.prev = new z(t), this.head = 0, this.tail = 0, this.free = new se(t), this.initialFill = 1, this.size = 0, typeof T == "function" && (this.dispose = T), typeof g == "function" ? (this.disposeAfter = g, this.disposed = []) : (this.disposeAfter = null, this.disposed = null), this.noDisposeOnSet = !!a, this.noUpdateTTL = !!r, this.noDeleteOnFetchRejection = !!_, this.allowStaleOnFetchRejection = !!S, this.allowStaleOnFetchAbort = !!L, this.ignoreFetchAbort = !!y, this.maxEntrySize !== 0) {
      if (this.maxSize !== 0 && !k(this.maxSize))
        throw new TypeError(
          "maxSize must be a positive integer if specified"
        );
      if (!k(this.maxEntrySize))
        throw new TypeError(
          "maxEntrySize must be a positive integer if specified"
        );
      this.initializeSizeTracking();
    }
    if (this.allowStale = !!A || !!w, this.noDeleteOnStaleGet = !!p, this.updateAgeOnGet = !!u, this.updateAgeOnHas = !!m, this.ttlResolution = k(s) || s === 0 ? s : 1, this.ttlAutopurge = !!h, this.ttl = i || E || 0, this.ttl) {
      if (!k(this.ttl))
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
      const O = "LRU_CACHE_UNBOUNDED";
      $(O) && (H.add(O), V("TTL caching without ttlAutopurge, max, or maxSize can result in unbounded memory consumption.", "UnboundedCacheWarning", O, R));
    }
    w && U("stale", "allowStale"), E && U("maxAge", "ttl"), x && U("length", "sizeCalculation");
  }
  getRemainingTTL(e) {
    return this.has(e, { updateAgeOnHas: !1 }) ? 1 / 0 : 0;
  }
  initializeTTLTracking() {
    this.ttls = new B(this.max), this.starts = new B(this.max), this.setItemTTL = (i, s, h = M.now()) => {
      if (this.starts[i] = s !== 0 ? h : 0, this.ttls[i] = s, s !== 0 && this.ttlAutopurge) {
        const u = setTimeout(() => {
          this.isStale(i) && this.delete(this.keyList[i]);
        }, s + 1);
        u.unref && u.unref();
      }
    }, this.updateItemAge = (i) => {
      this.starts[i] = this.ttls[i] !== 0 ? M.now() : 0;
    }, this.statusTTL = (i, s) => {
      i && (i.ttl = this.ttls[s], i.start = this.starts[s], i.now = e || t(), i.remainingTTL = i.now + i.ttl - i.start);
    };
    let e = 0;
    const t = () => {
      const i = M.now();
      if (this.ttlResolution > 0) {
        e = i;
        const s = setTimeout(
          () => e = 0,
          this.ttlResolution
        );
        s.unref && s.unref();
      }
      return i;
    };
    this.getRemainingTTL = (i) => {
      const s = this.keyMap.get(i);
      return s === void 0 ? 0 : this.ttls[s] === 0 || this.starts[s] === 0 ? 1 / 0 : this.starts[s] + this.ttls[s] - (e || t());
    }, this.isStale = (i) => this.ttls[i] !== 0 && this.starts[i] !== 0 && (e || t()) - this.starts[i] > this.ttls[i];
  }
  updateItemAge(e) {
  }
  statusTTL(e, t) {
  }
  setItemTTL(e, t, i) {
  }
  isStale(e) {
    return !1;
  }
  initializeSizeTracking() {
    this.calculatedSize = 0, this.sizes = new B(this.max), this.removeItemSize = (e) => {
      this.calculatedSize -= this.sizes[e], this.sizes[e] = 0;
    }, this.requireSize = (e, t, i, s) => {
      if (this.isBackgroundFetch(t))
        return 0;
      if (!k(i))
        if (s) {
          if (typeof s != "function")
            throw new TypeError("sizeCalculation must be a function");
          if (i = s(t, e), !k(i))
            throw new TypeError(
              "sizeCalculation return invalid (expect positive integer)"
            );
        } else
          throw new TypeError(
            "invalid size value (must be positive integer). When maxSize or maxEntrySize is used, sizeCalculation or size must be set."
          );
      return i;
    }, this.addItemSize = (e, t, i) => {
      if (this.sizes[e] = t, this.maxSize) {
        const s = this.maxSize - this.sizes[e];
        for (; this.calculatedSize > s; )
          this.evict(!0);
      }
      this.calculatedSize += this.sizes[e], i && (i.entrySize = t, i.totalCalculatedSize = this.calculatedSize);
    };
  }
  removeItemSize(e) {
  }
  addItemSize(e, t) {
  }
  requireSize(e, t, i, s) {
    if (i || s)
      throw new TypeError(
        "cannot set size without setting maxSize or maxEntrySize on cache"
      );
  }
  *indexes({ allowStale: e = this.allowStale } = {}) {
    if (this.size)
      for (let t = this.tail; !(!this.isValidIndex(t) || ((e || !this.isStale(t)) && (yield t), t === this.head)); )
        t = this.prev[t];
  }
  *rindexes({ allowStale: e = this.allowStale } = {}) {
    if (this.size)
      for (let t = this.head; !(!this.isValidIndex(t) || ((e || !this.isStale(t)) && (yield t), t === this.tail)); )
        t = this.next[t];
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
  find(e, t) {
    for (const i of this.indexes()) {
      const s = this.valList[i], h = this.isBackgroundFetch(s) ? s.__staleWhileFetching : s;
      if (h !== void 0 && e(h, this.keyList[i], this))
        return this.get(this.keyList[i], t);
    }
  }
  forEach(e, t = this) {
    for (const i of this.indexes()) {
      const s = this.valList[i], h = this.isBackgroundFetch(s) ? s.__staleWhileFetching : s;
      h !== void 0 && e.call(t, h, this.keyList[i], this);
    }
  }
  rforEach(e, t = this) {
    for (const i of this.rindexes()) {
      const s = this.valList[i], h = this.isBackgroundFetch(s) ? s.__staleWhileFetching : s;
      h !== void 0 && e.call(t, h, this.keyList[i], this);
    }
  }
  get prune() {
    return W("prune", "purgeStale"), this.purgeStale;
  }
  purgeStale() {
    let e = !1;
    for (const t of this.rindexes({ allowStale: !0 }))
      this.isStale(t) && (this.delete(this.keyList[t]), e = !0);
    return e;
  }
  dump() {
    const e = [];
    for (const t of this.indexes({ allowStale: !0 })) {
      const i = this.keyList[t], s = this.valList[t], h = this.isBackgroundFetch(s) ? s.__staleWhileFetching : s;
      if (h === void 0) continue;
      const u = { value: h };
      if (this.ttls) {
        u.ttl = this.ttls[t];
        const m = M.now() - this.starts[t];
        u.start = Math.floor(Date.now() - m);
      }
      this.sizes && (u.size = this.sizes[t]), e.unshift([i, u]);
    }
    return e;
  }
  load(e) {
    this.clear();
    for (const [t, i] of e) {
      if (i.start) {
        const s = Date.now() - i.start;
        i.start = M.now() - s;
      }
      this.set(t, i.value, i);
    }
  }
  dispose(e, t, i) {
  }
  set(e, t, {
    ttl: i = this.ttl,
    start: s,
    noDisposeOnSet: h = this.noDisposeOnSet,
    size: u = 0,
    sizeCalculation: m = this.sizeCalculation,
    noUpdateTTL: A = this.noUpdateTTL,
    status: T
  } = {}) {
    if (u = this.requireSize(e, t, u, m), this.maxEntrySize && u > this.maxEntrySize)
      return T && (T.set = "miss", T.maxEntrySizeExceeded = !0), this.delete(e), this;
    let g = this.size === 0 ? void 0 : this.keyMap.get(e);
    if (g === void 0)
      g = this.newIndex(), this.keyList[g] = e, this.valList[g] = t, this.keyMap.set(e, g), this.next[this.tail] = g, this.prev[g] = this.tail, this.tail = g, this.size++, this.addItemSize(g, u, T), T && (T.set = "add"), A = !1;
    else {
      this.moveToTail(g);
      const a = this.valList[g];
      if (t !== a) {
        if (this.isBackgroundFetch(a) ? a.__abortController.abort(new Error("replaced")) : h || (this.dispose(a, e, "set"), this.disposeAfter && this.disposed.push([a, e, "set"])), this.removeItemSize(g), this.valList[g] = t, this.addItemSize(g, u, T), T) {
          T.set = "replace";
          const r = a && this.isBackgroundFetch(a) ? a.__staleWhileFetching : a;
          r !== void 0 && (T.oldValue = r);
        }
      } else T && (T.set = "update");
    }
    if (i !== 0 && this.ttl === 0 && !this.ttls && this.initializeTTLTracking(), A || this.setItemTTL(g, i, s), this.statusTTL(T, g), this.disposeAfter)
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
    const t = this.head, i = this.keyList[t], s = this.valList[t];
    return this.isBackgroundFetch(s) ? s.__abortController.abort(new Error("evicted")) : (this.dispose(s, i, "evict"), this.disposeAfter && this.disposed.push([s, i, "evict"])), this.removeItemSize(t), e && (this.keyList[t] = null, this.valList[t] = null, this.free.push(t)), this.head = this.next[t], this.keyMap.delete(i), this.size--, t;
  }
  has(e, { updateAgeOnHas: t = this.updateAgeOnHas, status: i } = {}) {
    const s = this.keyMap.get(e);
    if (s !== void 0)
      if (this.isStale(s))
        i && (i.has = "stale", this.statusTTL(i, s));
      else return t && this.updateItemAge(s), i && (i.has = "hit"), this.statusTTL(i, s), !0;
    else i && (i.has = "miss");
    return !1;
  }
  // like get(), but without any LRU updating or TTL expiration
  peek(e, { allowStale: t = this.allowStale } = {}) {
    const i = this.keyMap.get(e);
    if (i !== void 0 && (t || !this.isStale(i))) {
      const s = this.valList[i];
      return this.isBackgroundFetch(s) ? s.__staleWhileFetching : s;
    }
  }
  backgroundFetch(e, t, i, s) {
    const h = t === void 0 ? void 0 : this.valList[t];
    if (this.isBackgroundFetch(h))
      return h;
    const u = new Q();
    i.signal && i.signal.addEventListener(
      "abort",
      () => u.abort(i.signal.reason)
    );
    const m = {
      signal: u.signal,
      options: i,
      context: s
    }, A = (f, v = !1) => {
      const { aborted: o } = u.signal, n = i.ignoreFetchAbort && f !== void 0;
      return i.status && (o && !v ? (i.status.fetchAborted = !0, i.status.fetchError = u.signal.reason, n && (i.status.fetchAbortIgnored = !0)) : i.status.fetchResolved = !0), o && !n && !v ? g(u.signal.reason) : (this.valList[t] === r && (f === void 0 ? r.__staleWhileFetching ? this.valList[t] = r.__staleWhileFetching : this.delete(e) : (i.status && (i.status.fetchUpdated = !0), this.set(e, f, m.options))), f);
    }, T = (f) => (i.status && (i.status.fetchRejected = !0, i.status.fetchError = f), g(f)), g = (f) => {
      const { aborted: v } = u.signal, o = v && i.allowStaleOnFetchAbort, n = o || i.allowStaleOnFetchRejection, d = n || i.noDeleteOnFetchRejection;
      if (this.valList[t] === r && (!d || r.__staleWhileFetching === void 0 ? this.delete(e) : o || (this.valList[t] = r.__staleWhileFetching)), n)
        return i.status && r.__staleWhileFetching !== void 0 && (i.status.returnedStale = !0), r.__staleWhileFetching;
      if (r.__returned === r)
        throw f;
    }, a = (f, v) => {
      this.fetchMethod(e, h, m).then((o) => f(o), v), u.signal.addEventListener("abort", () => {
        (!i.ignoreFetchAbort || i.allowStaleOnFetchAbort) && (f(), i.allowStaleOnFetchAbort && (f = (o) => A(o, !0)));
      });
    };
    i.status && (i.status.fetchDispatched = !0);
    const r = new Promise(a).then(A, T);
    return r.__abortController = u, r.__staleWhileFetching = h, r.__returned = null, t === void 0 ? (this.set(e, r, { ...m.options, status: void 0 }), t = this.keyMap.get(e)) : this.valList[t] = r, r;
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
    allowStale: t = this.allowStale,
    updateAgeOnGet: i = this.updateAgeOnGet,
    noDeleteOnStaleGet: s = this.noDeleteOnStaleGet,
    // set options
    ttl: h = this.ttl,
    noDisposeOnSet: u = this.noDisposeOnSet,
    size: m = 0,
    sizeCalculation: A = this.sizeCalculation,
    noUpdateTTL: T = this.noUpdateTTL,
    // fetch exclusive options
    noDeleteOnFetchRejection: g = this.noDeleteOnFetchRejection,
    allowStaleOnFetchRejection: a = this.allowStaleOnFetchRejection,
    ignoreFetchAbort: r = this.ignoreFetchAbort,
    allowStaleOnFetchAbort: f = this.allowStaleOnFetchAbort,
    fetchContext: v = this.fetchContext,
    forceRefresh: o = !1,
    status: n,
    signal: d
  } = {}) {
    if (!this.fetchMethod)
      return n && (n.fetch = "get"), this.get(e, {
        allowStale: t,
        updateAgeOnGet: i,
        noDeleteOnStaleGet: s,
        status: n
      });
    const _ = {
      allowStale: t,
      updateAgeOnGet: i,
      noDeleteOnStaleGet: s,
      ttl: h,
      noDisposeOnSet: u,
      size: m,
      sizeCalculation: A,
      noUpdateTTL: T,
      noDeleteOnFetchRejection: g,
      allowStaleOnFetchRejection: a,
      allowStaleOnFetchAbort: f,
      ignoreFetchAbort: r,
      status: n,
      signal: d
    };
    let p = this.keyMap.get(e);
    if (p === void 0) {
      n && (n.fetch = "miss");
      const S = this.backgroundFetch(e, p, _, v);
      return S.__returned = S;
    } else {
      const S = this.valList[p];
      if (this.isBackgroundFetch(S)) {
        const w = t && S.__staleWhileFetching !== void 0;
        return n && (n.fetch = "inflight", w && (n.returnedStale = !0)), w ? S.__staleWhileFetching : S.__returned = S;
      }
      const L = this.isStale(p);
      if (!o && !L)
        return n && (n.fetch = "hit"), this.moveToTail(p), i && this.updateItemAge(p), this.statusTTL(n, p), S;
      const y = this.backgroundFetch(e, p, _, v), x = y.__staleWhileFetching !== void 0, E = x && t;
      return n && (n.fetch = x && L ? "stale" : "refresh", E && L && (n.returnedStale = !0)), E ? y.__staleWhileFetching : y.__returned = y;
    }
  }
  get(e, {
    allowStale: t = this.allowStale,
    updateAgeOnGet: i = this.updateAgeOnGet,
    noDeleteOnStaleGet: s = this.noDeleteOnStaleGet,
    status: h
  } = {}) {
    const u = this.keyMap.get(e);
    if (u !== void 0) {
      const m = this.valList[u], A = this.isBackgroundFetch(m);
      return this.statusTTL(h, u), this.isStale(u) ? (h && (h.get = "stale"), A ? (h && (h.returnedStale = t && m.__staleWhileFetching !== void 0), t ? m.__staleWhileFetching : void 0) : (s || this.delete(e), h && (h.returnedStale = t), t ? m : void 0)) : (h && (h.get = "hit"), A ? m.__staleWhileFetching : (this.moveToTail(u), i && this.updateItemAge(u), m));
    } else h && (h.get = "miss");
  }
  connect(e, t) {
    this.prev[t] = e, this.next[e] = t;
  }
  moveToTail(e) {
    e !== this.tail && (e === this.head ? this.head = this.next[e] : this.connect(this.prev[e], this.next[e]), this.connect(this.tail, e), this.tail = e);
  }
  get del() {
    return W("del", "delete"), this.delete;
  }
  delete(e) {
    let t = !1;
    if (this.size !== 0) {
      const i = this.keyMap.get(e);
      if (i !== void 0)
        if (t = !0, this.size === 1)
          this.clear();
        else {
          this.removeItemSize(i);
          const s = this.valList[i];
          this.isBackgroundFetch(s) ? s.__abortController.abort(new Error("deleted")) : (this.dispose(s, e, "delete"), this.disposeAfter && this.disposed.push([s, e, "delete"])), this.keyMap.delete(e), this.keyList[i] = null, this.valList[i] = null, i === this.tail ? this.tail = this.prev[i] : i === this.head ? this.head = this.next[i] : (this.next[this.prev[i]] = this.next[i], this.prev[this.next[i]] = this.prev[i]), this.size--, this.free.push(i);
        }
    }
    if (this.disposed)
      for (; this.disposed.length; )
        this.disposeAfter(...this.disposed.shift());
    return t;
  }
  clear() {
    for (const e of this.rindexes({ allowStale: !0 })) {
      const t = this.valList[e];
      if (this.isBackgroundFetch(t))
        t.__abortController.abort(new Error("deleted"));
      else {
        const i = this.keyList[e];
        this.dispose(t, i, "delete"), this.disposeAfter && this.disposed.push([t, i, "delete"]);
      }
    }
    if (this.keyMap.clear(), this.valList.fill(null), this.keyList.fill(null), this.ttls && (this.ttls.fill(0), this.starts.fill(0)), this.sizes && this.sizes.fill(0), this.head = 0, this.tail = 0, this.initialFill = 1, this.free.length = 0, this.calculatedSize = 0, this.size = 0, this.disposed)
      for (; this.disposed.length; )
        this.disposeAfter(...this.disposed.shift());
  }
  get reset() {
    return W("reset", "clear"), this.clear;
  }
  get length() {
    return ie("length", "size"), this.size;
  }
  static get AbortController() {
    return Q;
  }
  static get AbortSignal() {
    return j;
  }
}
const ne = function() {
  const l = new ArrayBuffer(2), e = new Uint8Array(l), t = new Uint16Array(l);
  if (e[0] = 240, e[1] = 13, t[0] == 61453)
    return c.threads("System is Big-Endian"), !1;
  if (t[0] == 3568)
    return c.threads("System is Little-Endian"), !0;
  throw new Error(`Failed determining endianness: ${t}`);
}();
function re(l) {
  if (ne)
    for (let e = 0; e < l.length; e++)
      l[e] = (l[e] & 65280) >> 8 | (l[e] & 255) << 8;
}
const F = {};
function oe(l, e) {
  const t = l.capi, i = l.wasm, s = t.sqlite3_vfs, h = t.sqlite3_file, u = t.sqlite3_io_methods, m = new s(), A = new u();
  m.$iVersion = 1, m.$szOsFile = t.sqlite3_file.structInfo.sizeof, m.$mxPathname = 1024, m.$zName = i.allocCString("http"), m.$xDlOpen = m.$xDlError = m.$xDlSym = m.$xDlClose = null;
  const T = {
    xCheckReservedLock: function(a, r) {
      return c.vfs("xCheckReservedLock", a, r), i.poke(r, 0, "i32"), 0;
    },
    xClose: function(a) {
      return c.vfs("xClose", a), F[a] ? (delete F[a], 0) : t.SQLITE_NOTFOUND;
    },
    xDeviceCharacteristics: function(a) {
      return c.vfs("xDeviceCharacteristics", a), t.SQLITE_IOCAP_IMMUTABLE;
    },
    xFileControl: function(a, r, f) {
      return c.vfs("xFileControl", a, r, f), r === t.SQLITE_FCNTL_SYNC ? t.SQLITE_OK : t.SQLITE_NOTFOUND;
    },
    xFileSize: function(a, r) {
      return c.vfs("xFileSize", a, r), F[a] ? (c.vfs("file size is ", F[a].size), i.poke(r, F[a].size, "i64"), 0) : t.SQLITE_NOTFOUND;
    },
    xLock: function(a, r) {
      return c.vfs("xLock", a, r), 0;
    },
    xRead: function(a, r, f, v) {
      var o, n, d, _;
      if (c.vfs("xRead (sync)", a, r, f, v), Number(v) > Number.MAX_SAFE_INTEGER)
        return t.SQLITE_TOOBIG;
      if (!F[a])
        return t.SQLITE_NOTFOUND;
      const p = F[a];
      if (!p.pageSize) {
        p.pageSize = 1024;
        const S = new Uint8Array(2), L = T.xRead(a, S, 2, BigInt(16)), y = new Uint16Array(S.buffer);
        if (L !== 0)
          return t.SQLITE_IOERR;
        if (re(y), p.pageSize = y[0], c.vfs(`page size is ${p.pageSize}`), p.pageSize != 1024 && (console.warn(`Page size for ${p.url} is ${p.pageSize}, recommended size is 1024`), p.pageCache.delete(0)), p.pageSize > ((o = e == null ? void 0 : e.maxPageSize) !== null && o !== void 0 ? o : b.maxPageSize))
          throw new Error(`${p.pageSize} is over the maximum configured ${(n = e == null ? void 0 : e.maxPageSize) !== null && n !== void 0 ? n : b.maxPageSize}`);
      }
      try {
        const S = BigInt(p.pageSize), L = BigInt(f), y = v / S;
        y * S !== v && c.vfs(`Read chunk ${v} is not page-aligned`);
        let x = y * S;
        if (x + S < v + L)
          throw new Error(`Read chunk ${v}:${f} spans across a page-boundary`);
        let E = p.pageCache.get(Number(y));
        if (typeof E == "number") {
          c.cache(`[sync] cache hit (multi-page segment) for ${p.url}:${y}`);
          const z = BigInt(E) * S;
          E = p.pageCache.get(E), E instanceof Uint8Array ? x = z : E = void 0;
        }
        if (typeof E > "u") {
          c.cache(`[sync] cache miss for ${p.url}:${y}`);
          let z = p.pageSize, O = y > 0 && p.pageCache.get(Number(y) - 1);
          O && (typeof O == "number" && (O = p.pageCache.get(O)), O instanceof Uint8Array && (z = O.byteLength * 2, c.cache(`[sync] downloading super page of size ${z}`)));
          const G = z / p.pageSize;
          c.http(`downloading page ${y} of size ${z} starting at ${x}`);
          const I = new XMLHttpRequest();
          I.open("GET", p.url, !1);
          for (const D of Object.keys((d = e == null ? void 0 : e.headers) !== null && d !== void 0 ? d : b.headers))
            I.setRequestHeader(D, ((_ = e == null ? void 0 : e.headers) !== null && _ !== void 0 ? _ : b.headers)[D]);
          if (I.setRequestHeader("Range", `bytes=${x}-${x + BigInt(z - 1)}`), I.responseType = "arraybuffer", I.onload = () => {
            I.response instanceof ArrayBuffer && (E = new Uint8Array(I.response));
          }, I.send(), !E)
            return t.SQLITE_IOERR;
          if (E = E, !(E instanceof Uint8Array) || E.length === 0)
            throw new Error(`Invalid HTTP response received: ${JSON.stringify(I.response)}`);
          p.pageCache.set(Number(y), E);
          for (let D = Number(y) + 1; D < Number(y) + G; D++)
            p.pageCache.set(D, Number(y));
        } else
          c.cache(`[sync] cache hit for ${p.url}:${y}`);
        const w = Number(v - x);
        return r instanceof Uint8Array ? r.set(E.subarray(w, w + f)) : i.heap8u().set(E.subarray(w, w + f), r), t.SQLITE_OK;
      } catch (S) {
        return console.error(S), t.SQLITE_ERROR;
      }
    },
    xSync: function(a, r) {
      return c.vfs("xSync", a, r), 0;
    },
    xTruncate: function(a, r) {
      return c.vfs("xTruncate", a, r), 0;
    },
    xUnlock: function(a, r) {
      return c.vfs("xUnlock", a, r), 0;
    },
    xWrite: function(a, r, f, v) {
      return c.vfs("xWrite", a, r, f, v), t.SQLITE_READONLY;
    }
  }, g = {
    xAccess: function(a, r, f, v) {
      if (c.vfs("xAccess", a, r, f, v), (f & t.SQLITE_OPEN_READONLY) === 0)
        return i.poke(v, 0, "i32"), t.SQLITE_OK;
      const o = Symbol();
      return g.xOpen(a, r, o, f, v) === t.SQLITE_OK ? (T.xClose(o), i.poke(v, 1, "i32")) : i.poke(v, 0, "i32"), t.SQLITE_OK;
    },
    xCurrentTime: function(a, r) {
      return c.vfs("xCurrentTime", a, r), i.poke(r, 24405875e-1 + (/* @__PURE__ */ new Date()).getTime() / 864e5, "double"), 0;
    },
    xCurrentTimeInt64: function(a, r) {
      return c.vfs("xCurrentTimeInt64", a, r), i.poke(r, BigInt(24405875e-1) * BigInt(864e5) + BigInt((/* @__PURE__ */ new Date()).getTime()), "i64"), 0;
    },
    xDelete: function(a, r, f) {
      return c.vfs("xDelete", a, r, f), t.SQLITE_READONLY;
    },
    xFullPathname: function(a, r, f, v) {
      return c.vfs("xFullPathname", a, r, f, v), i.cstrncpy(v, r, f) < f ? 0 : t.SQLITE_CANTOPEN;
    },
    xGetLastError: function(a, r, f) {
      return c.vfs("xGetLastError", a, r, f), 0;
    },
    xOpen: function(a, r, f, v, o) {
      var n, d;
      if (c.vfs("xOpen (sync)", a, r, f, v, o), r === 0)
        return console.error("HTTP VFS does not support anonymous files"), t.SQLITE_CANTOPEN;
      if (typeof r != "number")
        return t.SQLITE_ERROR;
      const _ = i.cstrToJs(r);
      let p = !1;
      try {
        const S = new XMLHttpRequest();
        S.open("HEAD", _, !1);
        for (const L of Object.keys((n = e == null ? void 0 : e.headers) !== null && n !== void 0 ? n : b.headers))
          S.setRequestHeader(L, ((d = e == null ? void 0 : e.headers) !== null && d !== void 0 ? d : b.headers)[L]);
        S.onload = () => {
          var L, y;
          const x = /* @__PURE__ */ Object.create(null);
          x.fid = f, x.url = _, x.sq3File = new h(f), x.sq3File.$pMethods = A.pointer, x.size = BigInt((L = S.getResponseHeader("Content-Length")) !== null && L !== void 0 ? L : 0), x.pageCache = new R({
            maxSize: ((y = e == null ? void 0 : e.cacheSize) !== null && y !== void 0 ? y : b.cacheSize) * 1024,
            sizeCalculation: (E) => {
              var w;
              return (w = E.byteLength) !== null && w !== void 0 ? w : 4;
            }
          }), S.getResponseHeader("Accept-Ranges") !== "bytes" && console.warn(`Server for ${_} does not advertise 'Accept-Ranges'. If the server supports it, in order to remove this message, add "Accept-Ranges: bytes". Additionally, if using CORS, add "Access-Control-Expose-Headers: *".`), F[f] = x, p = !0;
        }, S.send();
      } catch (S) {
        console.error("xOpen", S);
      }
      return p ? (i.poke(o, t.SQLITE_OPEN_READONLY, "i32"), t.SQLITE_OK) : (console.error("xOpen"), t.SQLITE_CANTOPEN);
    }
  };
  l.vfs.installVfs({
    io: { struct: A, methods: T },
    vfs: { struct: m, methods: g }
  }), l.oo1.DB.dbCtorHelper.setVfsPostOpenSql(m.pointer, function(a, r) {
    var f;
    r.capi.sqlite3_busy_timeout(a, (f = e == null ? void 0 : e.timeout) !== null && f !== void 0 ? f : b.timeout), r.capi.sqlite3_exec(a, [
      "PRAGMA journal_mode=DELETE;",
      "PRAGMA cache_size=0;"
    ], 0, 0, 0);
  });
}
const he = null;
c.threads("SQLite worker started");
globalThis.onmessage = ({ data: l }) => {
  c.threads("SQLite received green light", l);
  const e = l;
  import("./sqlite3-bundler-friendly-BL-p8KQN.js").then((t) => t.default()).then((t) => {
    c.threads("SQLite init"), t.initWorker1API(), typeof e.httpChannel == "object" ? J(t, e.httpChannel, e.httpOptions) : e.httpChannel === !0 && (typeof globalThis.XMLHttpRequest > "u" && (globalThis.XMLHttpRequest = class extends he {
      get response() {
        return Uint8Array.from(this.responseText.split("").map((h) => h.charCodeAt(0))).buffer;
      }
    }), oe(t, e.httpOptions));
  });
};
