const q = (a, x, s) => {
  const e = a.flat().map(Number);
  if (e.some((t) => isNaN(t)))
    return null;
  const p = e.slice(1).map((t, o) => t - e[o]), u = Array.from(new Set(p));
  if (u.length !== 1)
    return null;
  const m = u[0], n = e.length, d = s.y1 - s.y + 1, i = s.x1 - s.x + 1, f = [];
  for (let t = 0; t < d; t++) {
    const o = [];
    for (let r = 0; r < i; r++) {
      const c = t * i + r;
      let l;
      if (c < n)
        l = e[c];
      else {
        const h = c - (n - 1);
        l = e[n - 1] + m * h;
      }
      o.push(l);
    }
    f.push(o);
  }
  return f;
};
export {
  q as linearNumericSequenceStrategy
};
