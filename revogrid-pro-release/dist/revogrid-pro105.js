function w(o) {
  const t = {};
  for (const [e, s] of Object.entries(o.data)) {
    t[e] = {};
    for (const [n] of Object.entries(s))
      t[e][n] = o.models[parseInt(e, 10)]?.[n];
  }
  return t;
}
function x(o, t, e) {
  const s = [], n = t.get("items"), p = t.get("source"), f = e.get("items"), m = e.get("source");
  for (let c = o.y; c <= o.y1; c++) {
    const u = [], a = p[n[c]] || {};
    for (let r = o.x; r <= o.x1; r++) {
      const i = m[f[r]], l = a[i.prop];
      u.push(l);
    }
    s.push(u);
  }
  return s;
}
export {
  x as getDataFromRange,
  w as getPreviousData
};
