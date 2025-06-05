var j = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function M(p) {
  return p && p.__esModule && Object.prototype.hasOwnProperty.call(p, "default") ? p.default : p;
}
var O = { exports: {} }, S = { exports: {} };
(function(p, m) {
  Object.defineProperty(m, "__esModule", { value: !0 }), m.ParsingError = void 0;
  class x extends Error {
    constructor(o, r) {
      super(o), this.cause = r;
    }
  }
  m.ParsingError = x;
  let i;
  function h() {
    return C(!1) || P() || y() || T();
  }
  function E() {
    return e(/\s*/), C(!0) || y() || b() || w(!1);
  }
  function u() {
    const t = w(!0), o = [];
    let r, s = E();
    for (; s; ) {
      if (s.node.type === "Element") {
        if (r)
          throw new Error("Found multiple root nodes");
        r = s.node;
      }
      s.excluded || o.push(s.node), s = E();
    }
    if (!r)
      throw new x("Failed to parse XML", "Root Element not found");
    if (i.xml.length !== 0)
      throw new x("Failed to parse XML", "Not Well-Formed XML");
    return {
      declaration: t ? t.node : null,
      root: r,
      children: o
    };
  }
  function w(t) {
    const o = e(t ? /^<\?(xml(-stylesheet)?)\s*/ : /^<\?([\w-:.]+)\s*/);
    if (!o)
      return;
    const r = {
      name: o[1],
      type: "ProcessingInstruction",
      attributes: {}
    };
    for (; !(l() || c("?>")); ) {
      const s = g();
      if (s)
        r.attributes[s.name] = s.value;
      else
        return;
    }
    return e(/\?>/), {
      excluded: t ? !1 : i.options.filter(r) === !1,
      node: r
    };
  }
  function C(t) {
    const o = e(/^<([^?!</>\s]+)\s*/);
    if (!o)
      return;
    const r = {
      type: "Element",
      name: o[1],
      attributes: {},
      children: []
    }, s = t ? !1 : i.options.filter(r) === !1;
    for (; !(l() || c(">") || c("?>") || c("/>")); ) {
      const d = g();
      if (d)
        r.attributes[d.name] = d.value;
      else
        return;
    }
    if (e(/^\s*\/>/))
      return r.children = null, {
        excluded: s,
        node: r
      };
    e(/\??>/);
    let f = h();
    for (; f; )
      f.excluded || r.children.push(f.node), f = h();
    if (i.options.strictMode) {
      const d = `</${r.name}>`;
      if (i.xml.startsWith(d))
        i.xml = i.xml.slice(d.length);
      else
        throw new x("Failed to parse XML", `Closing tag not matching "${d}"`);
    } else
      e(/^<\/[\w-:.\u00C0-\u00FF]+\s*>/);
    return {
      excluded: s,
      node: r
    };
  }
  function b() {
    const t = e(/^<!DOCTYPE\s+\S+\s+SYSTEM[^>]*>/) || e(/^<!DOCTYPE\s+\S+\s+PUBLIC[^>]*>/) || e(/^<!DOCTYPE\s+\S+\s*\[[^\]]*]>/) || e(/^<!DOCTYPE\s+\S+\s*>/);
    if (t) {
      const o = {
        type: "DocumentType",
        content: t[0]
      };
      return {
        excluded: i.options.filter(o) === !1,
        node: o
      };
    }
  }
  function T() {
    if (i.xml.startsWith("<![CDATA[")) {
      const t = i.xml.indexOf("]]>");
      if (t > -1) {
        const o = t + 3, r = {
          type: "CDATA",
          content: i.xml.substring(0, o)
        };
        return i.xml = i.xml.slice(o), {
          excluded: i.options.filter(r) === !1,
          node: r
        };
      }
    }
  }
  function y() {
    const t = e(/^<!--[\s\S]*?-->/);
    if (t) {
      const o = {
        type: "Comment",
        content: t[0]
      };
      return {
        excluded: i.options.filter(o) === !1,
        node: o
      };
    }
  }
  function P() {
    const t = e(/^([^<]+)/);
    if (t) {
      const o = {
        type: "Text",
        content: t[1]
      };
      return {
        excluded: i.options.filter(o) === !1,
        node: o
      };
    }
  }
  function g() {
    const t = e(/([^=]+)\s*=\s*("[^"]*"|'[^']*'|[^>\s]+)\s*/);
    if (t)
      return {
        name: t[1].trim(),
        value: n(t[2].trim())
      };
  }
  function n(t) {
    return t.replace(/^['"]|['"]$/g, "");
  }
  function e(t) {
    const o = i.xml.match(t);
    if (o)
      return i.xml = i.xml.slice(o[0].length), o;
  }
  function l() {
    return i.xml.length === 0;
  }
  function c(t) {
    return i.xml.indexOf(t) === 0;
  }
  function a(t, o = {}) {
    t = t.trim();
    const r = o.filter || (() => !0);
    return i = {
      xml: t,
      options: Object.assign(Object.assign({}, o), { filter: r, strictMode: o.strictMode === !0 })
    }, u();
  }
  p.exports = a, m.default = a;
})(S, S.exports);
var _ = S.exports;
(function(p, m) {
  var x = j && j.__importDefault || function(n) {
    return n && n.__esModule ? n : { default: n };
  };
  Object.defineProperty(m, "__esModule", { value: !0 });
  const i = x(_);
  function h(n) {
    if (!n.options.indentation && !n.options.lineSeparator)
      return;
    n.content += n.options.lineSeparator;
    let e;
    for (e = 0; e < n.level; e++)
      n.content += n.options.indentation;
  }
  function E(n) {
    n.content = n.content.replace(/ +$/, "");
    let e;
    for (e = 0; e < n.level; e++)
      n.content += n.options.indentation;
  }
  function u(n, e) {
    n.content += e;
  }
  function w(n, e, l) {
    if (typeof n.content == "string")
      C(n.content, e, l);
    else if (n.type === "Element")
      T(n, e, l);
    else if (n.type === "ProcessingInstruction")
      P(n, e);
    else
      throw new Error("Unknown node type: " + n.type);
  }
  function C(n, e, l) {
    if (!l) {
      const c = n.trim();
      (e.options.lineSeparator || c.length === 0) && (n = c);
    }
    n.length > 0 && (!l && e.content.length > 0 && h(e), u(e, n));
  }
  function b(n, e) {
    const l = "/" + n.join("/"), c = n[n.length - 1];
    return e.includes(c) || e.includes(l);
  }
  function T(n, e, l) {
    if (e.path.push(n.name), !l && e.content.length > 0 && h(e), u(e, "<" + n.name), y(e, n.attributes), n.children === null || e.options.forceSelfClosingEmptyTag && n.children.length === 0) {
      const c = e.options.whiteSpaceAtEndOfSelfclosingTag ? " />" : "/>";
      u(e, c);
    } else if (n.children.length === 0)
      u(e, "></" + n.name + ">");
    else {
      const c = n.children;
      u(e, ">"), e.level++;
      let a = n.attributes["xml:space"] === "preserve", t = !1;
      if (!a && e.options.ignoredPaths && (t = b(e.path, e.options.ignoredPaths), a = t), !a && e.options.collapseContent) {
        let o = !1, r = !1, s = !1;
        c.forEach(function(f, d) {
          f.type === "Text" ? (f.content.includes(`
`) ? (r = !0, f.content = f.content.trim()) : (d === 0 || d === c.length - 1) && !l && f.content.trim().length === 0 && (f.content = ""), f.content.trim().length > 0 && (o = !0)) : f.type === "CDATA" ? o = !0 : s = !0;
        }), o && (!s || !r) && (a = !0);
      }
      c.forEach(function(o) {
        w(o, e, l || a);
      }), e.level--, !l && !a && h(e), t && E(e), u(e, "</" + n.name + ">");
    }
    e.path.pop();
  }
  function y(n, e) {
    Object.keys(e).forEach(function(l) {
      const c = e[l].replace(/"/g, "&quot;");
      u(n, " " + l + '="' + c + '"');
    });
  }
  function P(n, e) {
    e.content.length > 0 && h(e), u(e, "<?" + n.name), y(e, n.attributes), u(e, "?>");
  }
  function g(n, e = {}) {
    e.indentation = "indentation" in e ? e.indentation : "    ", e.collapseContent = e.collapseContent === !0, e.lineSeparator = "lineSeparator" in e ? e.lineSeparator : `\r
`, e.whiteSpaceAtEndOfSelfclosingTag = e.whiteSpaceAtEndOfSelfclosingTag === !0, e.throwOnFailure = e.throwOnFailure !== !1;
    try {
      const l = (0, i.default)(n, { filter: e.filter, strictMode: e.strictMode }), c = { content: "", level: 0, options: e, path: [] };
      return l.declaration && P(l.declaration, c), l.children.forEach(function(a) {
        w(a, c, !1);
      }), e.lineSeparator ? c.content.replace(/\r\n/g, `
`).replace(/\n/g, e.lineSeparator) : c.content;
    } catch (l) {
      if (e.throwOnFailure)
        throw l;
      return n;
    }
  }
  g.minify = (n, e = {}) => g(n, Object.assign(Object.assign({}, e), { indentation: "", lineSeparator: "" })), p.exports = g, m.default = g;
})(O, O.exports);
var v = O.exports;
const F = /* @__PURE__ */ M(v);
export {
  F as default
};
