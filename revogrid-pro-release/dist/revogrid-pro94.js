import { getComparer as h } from "@revolist/revogrid";
function $({
  rows: r = [],
  columns: e = [],
  values: u = [],
  dimensions: t = [],
  flatHeaders: i = !1
}, n = []) {
  let o = [];
  const s = t.reduce((c, a) => (c[a.prop] = a, c), {});
  return e.length > 0 ? o = [
    {
      name: "",
      children: r.map((c) => ({ name: c, ...s[c], prop: c, dimension: "rows" }))
    },
    ...C(s, e, u, n, i)
  ] : o = [
    ...r.map((c) => ({ name: c, ...s[c], prop: c, dimension: "rows" })),
    ...p(s, e, u, n)
  ], o;
}
function p(r, e, u, t = []) {
  const i = [], n = m(e, t);
  for (const o of n)
    for (const { prop: s } of u)
      i.push({
        name: `${o} ${s}`,
        ...r[s],
        prop: `${o}|${s}`,
        dimension: "values"
      });
  return i;
}
function C(r, e, u, t = [], i = !1) {
  let n = [];
  if (i) {
    const o = m(e, t);
    for (const s of o)
      n.push({
        name: s,
        children: d(u, s, r)
      });
  } else
    n = l(
      r,
      e,
      t,
      u,
      0
    );
  return n;
}
function m(r, e) {
  const u = /* @__PURE__ */ new Set();
  for (const t of e) {
    const i = r.map((n) => t[n]);
    u.add(i.join("|"));
  }
  return Array.from(u);
}
function l(r, e, u, t, i, n = "") {
  if (i >= e.length)
    return [];
  const o = e[i], s = r[o];
  return g(
    u,
    o,
    s
  ).map(({ key: a, filteredSource: y }) => {
    const f = n ? `${n}|${a}` : a;
    return {
      ...s,
      name: a,
      // Group name
      children: i === e.length - 1 ? d(t, f, r) : l(
        r,
        e,
        y,
        t,
        i + 1,
        f
      )
      // Continue recursion
    };
  });
}
function g(r, e, u) {
  const t = /* @__PURE__ */ new Map();
  if (u.sortable) {
    const n = h(u, u.order ?? "asc");
    n && (r = r.sort((o, s) => n(e, o, s) ?? 0));
  }
  return r.forEach((n) => {
    const o = String(n[e] || "");
    t.has(o) || t.set(o, []), t.get(o).push(n);
  }), Array.from(t.entries()).map(([n, o]) => ({
    key: n,
    filteredSource: o
  }));
}
function d(r, e, u) {
  return r.map(({ prop: t, aggregator: i }) => ({
    name: `${t} (${i})`,
    ...u[t],
    prop: `${e}|${t}`,
    aggregator: i,
    dimension: "values"
  }));
}
export {
  $ as pivotColumns
};
