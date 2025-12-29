import { commonAggregators as _ } from "./revogrid-pro5.js";
function l(u, { rows: w = [], columns: y = [], values: g = [], dimensions: K = [] }) {
  const p = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new Map();
  K.forEach(({ prop: e, aggregators: s = _ }) => {
    Object.entries(s).forEach(([a, r]) => {
      f.set(`${e}|${a}`, r);
    });
  });
  for (const e of u) {
    const s = [], a = {};
    w?.forEach((o) => {
      s.push(e[o]), a[o] = e[o];
    });
    const r = s.join("|"), t = y.map((o) => e[o]).join("|");
    p.has(r) || p.set(r, { __rowKey: r, __rowValues: a });
    const n = p.get(r);
    n[t] || (n[t] = {});
    for (const { prop: o, aggregator: c } of g)
      n[t][o] = n[t][o] || [], n[t][o].push(e[o]);
  }
  const i = [];
  for (const [e, s] of p.entries()) {
    const a = { __rowKey: e, ...s.__rowValues };
    for (const r in s)
      for (const { prop: t, aggregator: n } of g) {
        const o = `${r}|${t}`;
        let c = s[r][t] || [];
        Array.isArray(c) || (c = [c]), a[o] = f.get(`${t}|${n}`)?.(c) || "";
      }
    i.push(a);
  }
  return i;
}
export {
  l as createPivotData
};
