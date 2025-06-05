var y = {}, g;
function I() {
  return g || (g = 1, globalThis.sqlite3Worker1Promiser = function r(n = r.defaultConfig) {
    if (arguments.length === 1 && typeof arguments[0] == "function") {
      const e = n;
      n = Object.assign(/* @__PURE__ */ Object.create(null), r.defaultConfig), n.onready = e;
    } else
      n = Object.assign(/* @__PURE__ */ Object.create(null), r.defaultConfig, n);
    const o = /* @__PURE__ */ Object.create(null), a = function() {
    }, s = n.onerror || a, l = n.debug || a, t = n.generateMessageId ? void 0 : /* @__PURE__ */ Object.create(null), d = n.generateMessageId || function(e) {
      return e.type + "#" + (t[e.type] = (t[e.type] || 0) + 1);
    }, c = (...e) => {
      throw new Error(e.join(" "));
    };
    n.worker || (n.worker = r.defaultConfig.worker), typeof n.worker == "function" && (n.worker = n.worker());
    let f;
    return n.worker.onmessage = function(e) {
      e = e.data, l("worker1.onmessage", e);
      let i = o[e.messageId];
      if (!i) {
        if (e && e.type === "sqlite3-api" && e.result === "worker1-ready") {
          n.onready && n.onready();
          return;
        }
        if (i = o[e.type], i && i.onrow) {
          i.onrow(e);
          return;
        }
        n.onunhandled ? n.onunhandled(arguments[0]) : s("sqlite3Worker1Promiser() unhandled worker message:", e);
        return;
      }
      switch (delete o[e.messageId], e.type) {
        case "error":
          i.reject(e);
          return;
        case "open":
          f || (f = e.dbId);
          break;
        case "close":
          e.dbId === f && (f = void 0);
          break;
      }
      try {
        i.resolve(e);
      } catch (m) {
        i.reject(m);
      }
    }, function() {
      let e;
      arguments.length === 1 ? e = arguments[0] : arguments.length === 2 ? (e = /* @__PURE__ */ Object.create(null), e.type = arguments[0], e.args = arguments[1]) : c("Invalid arugments for sqlite3Worker1Promiser()-created factory."), e.dbId || (e.dbId = f), e.messageId = d(e), e.departureTime = performance.now();
      const i = /* @__PURE__ */ Object.create(null);
      i.message = e;
      let m;
      e.type === "exec" && e.args && (typeof e.args.callback == "function" ? (m = e.messageId + ":row", i.onrow = e.args.callback, e.args.callback = m, o[m] = i) : typeof e.args.callback == "string" && c("exec callback may not be a string when using the Promise interface."));
      let h = new Promise(function(v, T) {
        i.resolve = v, i.reject = T, o[e.messageId] = i, l("Posting", e.type, "message to Worker dbId=" + (f || "default") + ":", e), n.worker.postMessage(e);
      });
      return m && (h = h.finally(() => delete o[m])), h;
    };
  }, globalThis.sqlite3Worker1Promiser.defaultConfig = {
    worker: function() {
      return new Worker(new URL(
        /* @vite-ignore */
        "./assets/sqlite3-worker1-bundler-friendly-CQntYOm1.js",
        import.meta.url
      ), {
        type: "module"
      });
    },
    onerror: (...r) => console.error("worker1 promiser error", ...r)
  }), y;
}
I();
var p;
const k = {
  timeout: 2e4
};
var w;
(function(r) {
  r[r.WORKMSG = 16777215] = "WORKMSG", r[r.HANDSHAKE = 16777214] = "HANDSHAKE";
})(w = w || (w = {}));
const P = typeof SQLITE_DEBUG < "u" && SQLITE_DEBUG || typeof process < "u" && typeof ((p = process == null ? void 0 : process.env) === null || p === void 0 ? void 0 : p.SQLITE_DEBUG) < "u" && process.env.SQLITE_DEBUG || "", S = ["threads", "vfs", "cache", "http"], u = {};
for (const r of S)
  u[r] = P.includes(r) ? console.debug.bind(console) : () => {
  };
(function() {
  const r = new ArrayBuffer(2), n = new Uint8Array(r), o = new Uint16Array(r);
  if (n[0] = 240, n[1] = 13, o[0] == 61453)
    return u.threads("System is Big-Endian"), !1;
  if (o[0] == 3568)
    return u.threads("System is Little-Endian"), !0;
  throw new Error(`Failed determining endianness: ${o}`);
})();
function O(r) {
  u.threads("Creating new SQLite thread", r);
  let n;
  return new Promise((a, s) => {
    const l = sqlite3Worker1Promiser({
      onready: () => {
        a(l);
      },
      worker: () => {
        try {
          n = new Worker(new URL(
            /* @vite-ignore */
            "./assets/sqlite-worker-BcniZPYz.js",
            import.meta.url
          )), n.onerror = (d) => console.error("Worker bootstrap failed", d);
          const t = r == null ? void 0 : r.http;
          return (t == null ? void 0 : t.type) === "shared" ? t.createNewChannel().then((d) => {
            n.postMessage({ httpChannel: d, httpOptions: t.options }, [d.port]);
          }) : (t == null ? void 0 : t.type) === "sync" ? n.postMessage({ httpChannel: !0, httpOptions: t.options }) : n.postMessage({}), n;
        } catch (t) {
          console.error("Failed to create SQLite worker", t), s(t);
        }
      }
    });
  }).then((a) => (a.close = () => {
    n.terminate();
  }, a));
}
const b = 'SharedArrayBuffer is not available. If your browser supports it, the webserver must send "Cross-Origin-Opener-Policy: same-origin "and "Cross-Origin-Embedder-Policy: require-corp" headers. Alternatively, if you do not intend to use concurrent connections, pass `sync` to `createHttpBackend` to explicitly create a synchronous HTTP backend and suppress this warning message.';
function C(r) {
  if (u.threads("Creating new HTTP VFS backend thread"), typeof SharedArrayBuffer > "u" || (r == null ? void 0 : r.backendType) === "sync") {
    if ((r == null ? void 0 : r.backendType) === "shared")
      throw new Error(b);
    return (r == null ? void 0 : r.backendType) !== "sync" && console.warn(b + " Falling back to the legacy HTTP backend."), {
      type: "sync",
      worker: null,
      options: r,
      createNewChannel: () => {
        throw new Error("Sync backend does not support channels");
      },
      close: () => Promise.resolve(),
      terminate: () => {
      }
    };
  }
  let n = 1;
  const o = new Worker(new URL(
    /* @vite-ignore */
    "./assets/vfs-http-worker-B4_pD2r0.js",
    import.meta.url
  ));
  o.postMessage({ msg: "init", options: r });
  const a = {};
  return o.onmessage = ({ data: s }) => {
    switch (u.threads("Received control message reply", s), s.msg) {
      case "ack":
        if (!a[s.id]) {
          console.error("Invalid response received from backend", s);
          return;
        }
        u.threads("New HTTP VFS channel created", a), a[s.id].resolve({
          port: a[s.id].channel.port2,
          shm: s.shm
        }), clearTimeout(a[s.id].timeout), delete a[s.id].resolve, delete a[s.id].timeout;
        return;
    }
  }, {
    type: "shared",
    worker: o,
    options: r,
    createNewChannel: function() {
      u.threads("Creating a new HTTP VFS channel");
      const s = new MessageChannel(), l = n++;
      return o.postMessage({ msg: "handshake", port: s.port1, id: l }, [s.port1]), new Promise((t, d) => {
        var c;
        const f = setTimeout(() => {
          delete a[l], d("Timeout while waiting on backend");
        }, (c = r == null ? void 0 : r.timeout) !== null && c !== void 0 ? c : k.timeout);
        a[l] = { id: l, channel: s, resolve: t, timeout: f };
      });
    },
    terminate: function() {
      o.terminate();
    },
    close: function() {
      return u.threads("Closing the HTTP VFS channel"), o.postMessage({ msg: "close" }), new Promise((s, l) => {
        var t;
        const d = setTimeout(() => {
          l("Timeout while waiting on backend");
        }, (t = r == null ? void 0 : r.timeout) !== null && t !== void 0 ? t : k.timeout);
        o.onmessage = ({ data: c }) => {
          u.threads("Received close response", c), c.msg === "ack" && c.id === void 0 && (s(), clearTimeout(d));
        };
      });
    }
  };
}
export {
  C as createHttpBackend,
  O as createSQLiteThread
};
