import { isValidISODate as w } from "./revogrid-pro79.js";
const g = (u, x, e) => {
  const n = u.flat();
  if (!n.every(
    (t) => t instanceof Date || w(t)
  ))
    return null;
  const l = n.every((t) => typeof t == "string"), D = n.every((t) => t instanceof Date);
  if (!(l || D))
    return null;
  const s = n.map(
    (t) => t instanceof Date ? t : new Date(t)
  ), p = s.slice(1).map((t, o) => t.getTime() - s[o].getTime()), c = Array.from(new Set(p));
  if (c.length !== 1)
    return null;
  const d = c[0];
  s.length;
  const m = e.y1 - e.y + 1, r = e.x1 - e.x + 1, a = [], y = s[0];
  for (let t = 0; t < m; t++) {
    const o = [];
    for (let i = 0; i < r; i++) {
      const S = t * r + i, f = new Date(y.getTime() + d * S);
      o.push(
        l ? f.toISOString().split("T")[0] : f
        // Return as Date object
      );
    }
    a.push(o);
  }
  return a;
};
export {
  g as dateSequenceStrategy
};
