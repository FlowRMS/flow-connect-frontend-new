import { isValidISODate as x } from "./revogrid-pro79.js";
const V = (p, I, n) => {
  const s = p.flat();
  if (!s.every(
    (t) => t instanceof Date || x(t)
  ))
    return null;
  const r = s.every((t) => typeof t == "string"), m = s.every((t) => t instanceof Date);
  if (!(r || m))
    return null;
  const e = s.map(
    (t) => t instanceof Date ? t : new Date(t)
  ), y = e.slice(1).map((t, o) => t.getTime() - e[o].getTime()), a = Array.from(new Set(y));
  if (a.length !== 1)
    return null;
  const h = a[0], f = e.length, w = n.y1 - n.y + 1, u = n.x1 - n.x + 1, D = [], S = e[e.length - 1];
  for (let t = 0; t < w; t++) {
    const o = [];
    for (let l = 0; l < u; l++) {
      const i = t * u + l;
      let c;
      if (i < f)
        c = e[i];
      else {
        const g = i - (f - 1), d = new Date(S.getTime() + h * g);
        c = r ? d.toISOString().split("T")[0] : d;
      }
      o.push(c);
    }
    D.push(o);
  }
  return D;
};
export {
  V as dateSequenceWithIntervalStrategy
};
