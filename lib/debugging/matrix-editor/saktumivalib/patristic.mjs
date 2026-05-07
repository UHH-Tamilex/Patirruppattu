var k = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function B(v) {
  return v && v.__esModule && Object.prototype.hasOwnProperty.call(v, "default") ? v.default : v;
}
var S = { exports: {} };
(function(v, A) {
  (function(m, D) {
    D(A);
  })(k, function(m) {
    const D = "0.5.7";
    function i(t, r) {
      t || (t = {}), r || (r = (e) => e.children), Object.assign(this, {
        _guid: R(),
        id: t.id || "",
        data: t,
        depth: t.depth || 0,
        height: t.height || 0,
        length: t.length || 0,
        parent: t.parent || null,
        children: r(t) || [],
        value: t.value || 1,
        respresenting: 1
      });
    }
    function R() {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (t) => (t ^ Math.random() * 16 >> t / 4).toString(16));
    }
    i.prototype.addChild = function(t) {
      let r;
      return t instanceof i ? (r = t, r.parent = this) : (t || (t = {}), r = new i(
        Object.assign(t, {
          parent: this
        })
      )), this.children.push(r), r;
    }, i.prototype.addParent = function(t, r) {
      r || (r = []);
      let e;
      return t instanceof i ? e = t : (t || (t = {}), e = new i(Object.assign(t))), r.forEach((n) => n.setParent(e)), e.children = [this].concat(r), this.parent = e, this;
    }, i.prototype.ancestors = function() {
      return this.getAncestors(!0);
    }, i.prototype.clone = function() {
      return N(this.toObject());
    }, i.prototype.consolidate = function() {
      return this.eachAfter((t) => {
        t.isRoot() || t.length >= 5e-4 || (t.parent.id == "" ? t.parent.id = t.id : t.parent.id += "+" + t.id, t.excise());
      }).fixDistances();
    }, i.prototype.copy = function() {
      let t = N(JSON.stringify(this));
      return t.parent = null, t.fixDistances();
    }, i.prototype.count = function() {
      return this.sum(() => 1);
    }, i.prototype.descendants = function() {
      return this.getDescendants(!0);
    }, i.prototype.depthOf = function(t) {
      let r = 0;
      if (typeof t == "string" && (t = this.getDescendant(t)), typeof t > "u")
        throw Error("Cannot compute depth of undefined descendant!");
      let e = t;
      for (; e != this; )
        r += e.length, e = e.parent;
      return r;
    }, i.prototype.distanceBetween = function(t, r) {
      let e = t.getMRCA(r);
      return e.depthOf(t) + e.depthOf(r);
    }, i.prototype.distanceTo = function(t) {
      let r = this.getMRCA(t);
      return r.depthOf(this) + r.depthOf(t);
    }, i.prototype.each = function(t) {
      let r = this, e = [r], n;
      for (; e.length; )
        for (n = e.reverse(), e = []; r = n.pop(); )
          t(r), r.eachChild((s) => e.push(s));
      return this;
    }, i.prototype.eachAfter = function(t) {
      return this.eachChild((r) => r.eachAfter(t)), t(this), this;
    }, i.prototype.eachBefore = function(t) {
      return t(this), this.eachChild((r) => r.eachBefore(t)), this;
    }, i.prototype.eachChild = function(t) {
      return this.children.forEach(t), this;
    }, i.prototype.excise = function() {
      if (this.isRoot() && this.children.length > 1)
        throw new Error("Cannot excise a root Branch with multiple children.");
      return this.eachChild((t) => {
        t.length += this.length, t.parent = this.parent, this.isRoot() || this.parent.children.push(t);
      }), this.parent.children.splice(this.parent.children.indexOf(this), 1), this.parent.representing++, this.parent;
    }, i.prototype.fixDistances = function() {
      let t = 0, r = this.getRoot();
      return r.depth = 0, this.eachBefore((e) => {
        e.isRoot() || (e.depth = e.parent.depth + 1, e.depth > t && (t = e.depth));
      }).eachAfter((e) => {
        e.height = t - e.depth, e.value = e.value + e.children.reduce((n, s) => n + s.value, 0);
      }), this;
    }, i.prototype.fixParenthood = function(t) {
      return this.children.forEach((r) => {
        r.parent || (r.parent = this), r.parent !== this && (r.parent = this), !t && r.children.length > 0 && r.fixParenthood();
      }), this;
    }, i.prototype.flip = function() {
      return this.each((t) => t.rotate());
    }, i.prototype.getAncestors = function(t) {
      let r = t ? [this] : [], e = this;
      for (; e = e.parent; )
        r.push(e);
      return r;
    }, i.prototype.getChild = function(t) {
      if (!1 == "string")
        throw Error("childID is not a String!");
      return this.children.find((r) => r.id === t);
    }, i.prototype.getDescendant = function(t) {
      if (this.id === t)
        return this;
      let r = this.children, e = r.length;
      if (r)
        for (let n = 0; n < e; n++) {
          let s = r[n].getDescendant(t);
          if (s)
            return s;
        }
    }, i.prototype.getDescendants = function(t) {
      let r = t ? [this] : [];
      return this.isLeaf() || this.children.forEach((e) => {
        e.getDescendants(!0).forEach((n) => r.push(n));
      }), r;
    }, i.prototype.getLeafs = function() {
      return this.getLeaves();
    }, i.prototype.getLeaves = function() {
      if (this.isLeaf())
        return [this];
      {
        let t = [];
        return this.children.forEach((r) => {
          r.getLeaves().forEach((e) => t.push(e));
        }), t;
      }
    }, i.prototype.getMRCA = function(t) {
      let r = this;
      for (; !r.hasDescendant(t); ) {
        if (r.isRoot())
          throw Error(
            "Branch and cousin do not appear to share a common ancestor!"
          );
        r = r.parent;
      }
      return r;
    }, i.prototype.getRoot = function() {
      let t = this;
      for (; !t.isRoot(); )
        t = t.parent;
      return t;
    }, i.prototype.hasChild = function(t) {
      if (t instanceof i)
        return this.children.includes(t);
      if (typeof t == "string")
        return this.children.some((r) => r.id === t);
      throw Error(
        `Unknown type of child (${typeof t}) passed to Branch.hasChild!`
      );
    }, i.prototype.hasDescendant = function(t) {
      let r = this.getDescendants();
      if (t instanceof i)
        return r.some((e) => e === t);
      if (typeof t == "string")
        return r.some((e) => e.id === t);
      throw Error("Unknown type of descendant passed to Branch.hasDescendant!");
    }, i.prototype.hasLeaf = function(t) {
      let r = this.getLeaves();
      if (t instanceof i)
        return r.includes(t);
      if (typeof t == "string")
        return r.some((e) => e.id === t);
      throw Error("Unknown type of leaf passed to Branch.hasLeaf.");
    }, i.prototype.invert = function() {
      let t = this.parent;
      if (t) {
        let r = this.parent.length;
        this.parent.length = this.length, this.length = r, this.parent = t.parent, this.children.push(t), t.parent = this, t.children.splice(t.children.indexOf(this), 1);
      } else
        throw Error("Cannot invert root node!");
      return this;
    }, i.prototype.isChildOf = function(t) {
      if (t instanceof i)
        return this.parent === t;
      if (typeof t == "string")
        return this.parent.id === t;
      throw Error("Unknown parent type passed to Branch.isChildOf");
    }, i.prototype.isConsistent = function() {
      return !this.isRoot() && !this.parent.children.includes(this) ? !1 : this.isLeaf() ? !0 : this.children.some((t) => t.parent !== this) ? !1 : this.children.every((t) => t.isConsistent());
    }, i.prototype.isDescendantOf = function(t) {
      return !t || !this.parent ? !1 : this.parent === t || this.parent.id === t ? !0 : this.parent.isDescendantOf(t);
    }, i.prototype.isLeaf = function() {
      return this.children.length === 0;
    }, i.prototype.isolate = function() {
      let t = this.parent.children.indexOf(this);
      return this.parent.children.splice(t, 1), this.setParent(null), this;
    }, i.prototype.isRoot = function() {
      return this.parent === null;
    }, i.prototype.leafs = function() {
      return this.getLeaves();
    }, i.prototype.leaves = function() {
      return this.getLeaves();
    }, i.prototype.links = function() {
      let t = [];
      return this.each((r) => {
        r.isRoot() || t.push({
          source: r.parent,
          target: r
        });
      }), t;
    }, i.prototype.normalize = function(t, r) {
      typeof r != "number" && (r = 1), typeof t != "number" && (t = 0);
      let e = 1 / 0, n = -1 / 0;
      this.each((o) => {
        o.value < e && (e = o.value), o.value > n && (n = o.value);
      });
      let s = (r - t) / (n - e);
      return this.each((o) => o.value = (o.value - e) * s + t);
    }, i.prototype.path = function(t) {
      let r = this, e = [this], n = this.getMRCA(t);
      for (; r !== n; )
        r = r.parent, e.push(r);
      let s = e.length;
      for (r = t; r !== n; )
        e.splice(s, 0, r), r = r.parent;
      return e;
    }, i.prototype.remove = function(t) {
      var e;
      let r = this.getRoot();
      return this.isolate(), t && ((e = this.parent) == null || e.removeIfNoChildren()), r;
    }, i.prototype.removeIfNoChildren = function(t) {
      let r = this.getRoot();
      return this.children.length === 0 && (this.remove(), t || this.parent.removeIfNoChildren()), r;
    }, i.prototype.replace = function(t) {
      let r = this.getRoot();
      this.parent;
      let e = this.parent.children.indexOf(this);
      return this.parent.children.splice(e, 1, t), r;
    }, i.prototype.reroot = function() {
      let t = this, r = [];
      for (; !t.isRoot(); )
        r.push(t), t = t.parent;
      return r.reverse().forEach((e) => e.invert()), this.fixDistances();
    }, i.prototype.rotate = function(t) {
      return this.children ? (this.children.reverse(), this) : this;
    }, i.prototype.setLength = function(t) {
      return this.length = t, this;
    }, i.prototype.setParent = function(t) {
      if (!t instanceof i && t !== null)
        throw Error("Cannot set parent to non-Branch object!");
      return this.parent = t, this;
    }, i.prototype.simplify = function() {
      return this.eachAfter((t) => {
        if (t.children.length == 1) {
          let r = t.children[0];
          r.id == "" ? r.id = t.id : r.id = t.id + "+" + r.id, t.excise();
        }
      }), this.fixDistances();
    }, i.prototype.sort = function(t) {
      return t || (t = (r, e) => r.value - e.value), this.eachBefore((r) => r.children.sort(t));
    }, i.prototype.sources = function(t) {
      let r = this.getMRCA(t);
      return r.depthOf(this) < r.depthOf(t);
    }, i.prototype.sum = function(t) {
      return t || (t = (r) => r.value), this.eachAfter(
        (r) => r.value = t(r) + r.children.reduce((e, n) => e + n.value, 0)
      );
    }, i.prototype.targets = function(t) {
      return t.sources(this);
    }, i.prototype.toJSON = function() {
      return this.toObject();
    }, i.prototype.toMatrix = function() {
      let t = this.getLeaves(), r = t.length, e = new Array(r);
      for (let n = 0; n < r; n++) {
        e[n] = new Array(r), e[n][n] = 0;
        for (let s = 0; s < n; s++) {
          let o = t[n].distanceTo(t[s]);
          e[n][s] = o, e[s][n] = o;
        }
      }
      return {
        matrix: e,
        ids: t.map((n) => n.id)
      };
    }, i.prototype.toNewick = function(t) {
      let r = "";
      return this.isLeaf() || (r += "(" + this.children.map((e) => e.toNewick(!0)).join(",") + ")"), r += this.id, this.length && (r += ":" + I(this.length)), t || (r += ";"), r;
    };
    function I(t) {
      let r = String(t);
      if (Math.abs(t) < 1) {
        let e = parseInt(t.toString().split("e-")[1]);
        if (e) {
          let n = t < 0;
          n && (t *= -1), t *= Math.pow(10, e - 1), r = "0." + new Array(e).join("0") + t.toString().substring(2), n && (r = "-" + r);
        }
      } else {
        let e = parseInt(t.toString().split("+")[1]);
        e > 20 && (e -= 20, t /= Math.pow(10, e), r = t.toString() + new Array(e + 1).join("0"));
      }
      return r;
    }
    i.prototype.toObject = function() {
      let t = {
        id: this.id,
        length: this.length
      };
      return this.children.length > 0 && (t.children = this.children.map((r) => r.toObject())), t;
    }, i.prototype.toString = function(t, r) {
      return t || (t = null), r || (r = 0), JSON.stringify(this, t, r);
    };
    function N(t, r, e, n) {
      r || (r = "id"), e || (e = "length"), n || (n = "children"), typeof t == "string" && (t = JSON.parse(t));
      let s = new i({
        id: t[r],
        length: t[e]
      });
      return t[n] instanceof Array && t[n].forEach((o) => {
        s.addChild(N(o));
      }), s.fixDistances();
    }
    function M(t, r) {
      let e = {}, n = e.N = t.length;
      r || (r = [...Array(n).keys()]), e.cN = e.N, e.D = t, e.labels = r, e.labelToTaxon = {}, e.currIndexToLabel = new Array(n), e.rowChange = new Array(n), e.newRow = new Array(n), e.labelToNode = new Array(2 * n), e.nextIndex = n, e.I = new Array(e.N), e.S = new Array(e.N);
      for (let l = 0; l < e.N; l++) {
        let x = O(e.D[l], l);
        e.S[l] = x, e.I[l] = x.sortIndices;
      }
      e.removedIndices = /* @__PURE__ */ new Set(), e.indicesLeft = /* @__PURE__ */ new Set();
      for (let l = 0; l < n; l++)
        e.currIndexToLabel[l] = l, e.indicesLeft.add(l);
      e.rowSumMax = 0, e.PNewick = "";
      let s, o, f, u, p, d, a, g, y;
      function h(l, x) {
        let C;
        return l < e.N ? (C = new i({ id: e.labels[l], length: x }), e.labelToNode[l] = C) : (C = e.labelToNode[l], C.setLength(x)), C;
      }
      e.rowSums = T(e.D);
      for (let l = 0; l < e.cN; l++)
        e.rowSums[l] > e.rowSumMax && (e.rowSumMax = e.rowSums[l]);
      for (; e.cN > 2; ) {
        ({ minI: s, minJ: o } = E(e)), f = 0.5 * e.D[s][o] + (e.rowSums[s] - e.rowSums[o]) / (2 * e.cN - 4), u = e.D[s][o] - f, p = e.currIndexToLabel[s], d = e.currIndexToLabel[o], a = h(p, f), g = h(d, u), y = new i({ children: [a, g] }), L(e, s, o);
        let l = O(e.D[o], o);
        e.S[o] = l, e.I[o] = l.sortIndices, e.S[s] = e.I[s] = [], e.cN--, e.labelToNode[e.nextIndex] = y, e.currIndexToLabel[s] = -1, e.currIndexToLabel[o] = e.nextIndex++;
      }
      let c = e.indicesLeft.values();
      s = c.next().value, o = c.next().value, p = e.currIndexToLabel[s], d = e.currIndexToLabel[o], f = u = e.D[s][o] / 2, a = h(p, f), g = h(d, u);
      let w = new i({ children: [a, g] });
      return w.fixParenthood(), w.fixDistances();
    }
    function E(t) {
      let r = 1 / 0, e = t.D, n = t.cN, s = n - 2, o = t.S, f = t.I, u = t.rowSums, p = t.removedIndices, d = t.rowSumMax, a, g = -1, y = -1, h;
      for (let c = 0; c < t.N; c++)
        p.has(c) || (h = f[c][0], !p.has(h) && (a = e[c][h] * s - u[c] - u[h], a < r && (r = a, g = c, y = h)));
      for (let c = 0; c < t.N; c++)
        if (!p.has(c)) {
          for (let w = 0; w < o[c].length; w++)
            if (h = f[c][w], !p.has(h)) {
              if (o[c][w] * s - u[c] - d > r)
                break;
              a = e[c][h] * s - u[c] - u[h], a < r && (r = a, g = c, y = h);
            }
        }
      return { minI: g, minJ: y };
    }
    function L(t, r, e) {
      let n = t.D, s = n.length, o = 0, f, u, p = t.removedIndices, d = t.rowSums, a = t.newRow, g = t.rowChange, y = 0;
      p.add(r);
      for (let h = 0; h < s; h++)
        p.has(h) || (f = n[r][h] + n[e][h], u = n[r][e], a[h] = 0.5 * (f - u), o += a[h], g[h] = -0.5 * (f + u));
      for (let h = 0; h < s; h++)
        n[r][h] = -1, n[h][r] = -1, !p.has(h) && (n[e][h] = a[h], n[h][e] = a[h], d[h] += g[h], d[h] > y && (y = d[h]));
      d[r] = 0, d[e] = o, o > y && (y = o), t.rowSumMax = y, t.indicesLeft.delete(r);
    }
    function T(t) {
      let r = t.length, e = new Array(r);
      for (let n = 0; n < r; n++) {
        let s = 0;
        for (let o = 0; o < r; o++)
          typeof parseFloat(t[n][o]) == "number" && (s += t[n][o]);
        e[n] = s;
      }
      return e;
    }
    function O(t, r) {
      typeof r > "u" && (r = -1);
      let e = t.length, n = new Array(e), s = new Array(e), o = 0;
      for (let f = 0; f < e; f++)
        t[f] === -1 || f === r || (n[o] = f, s[o++] = t[f]);
      n.length = o, s.length = o, n.sort((f, u) => t[f] - t[u]), s.sortIndices = n;
      for (let f = 0; f < o; f++)
        s[f] = t[n[f]];
      return s;
    }
    function b(t) {
      let r = [], e = new i(), n = t.split(/\s*(;|\(|\)|,|:)\s*/), s = n.length;
      for (let o = 0; o < s; o++) {
        let f = n[o], u;
        switch (f) {
          case "(":
            u = e.addChild(), r.push(e), e = u;
            break;
          case ",":
            u = r[r.length - 1].addChild(), e = u;
            break;
          case ")":
            e = r.pop();
            break;
          case ":":
            break;
          default:
            let p = n[o - 1];
            p == ")" || p == "(" || p == "," ? e.id = f : p == ":" && (e.length = parseFloat(f));
        }
      }
      return e.fixDistances();
    }
    m.Branch = i, m.parseJSON = N, m.parseMatrix = M, m.parseNewick = b, m.version = D;
  });
})(S, S.exports);
var P = S.exports;
const J = /* @__PURE__ */ B(P);
export {
  J as default
};
