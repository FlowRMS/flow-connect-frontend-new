const q = (x, b, r) => {
  const t = x.flat();
  if (!t.every((e) => typeof e == "string"))
    return null;
  const h = /^(.*?)(\d+)$/, s = t.map((e) => {
    const n = e.match(h);
    return n ? {
      prefix: n[1],
      number: parseInt(n[2], 10)
    } : null;
  });
  if (s.some((e) => e === null))
    return null;
  const f = s[0].prefix;
  if (!s.every((e) => e.prefix === f))
    return null;
  const o = s.map((e) => e.number), a = o.slice(1).map((e, n) => e - o[n]), i = Array.from(new Set(a));
  if (i.length !== 1 || i[0] !== 1)
    return null;
  const y = r.y1 - r.y + 1, p = r.x1 - r.x + 1, m = [];
  for (let e = 0; e < y; e++) {
    const n = [];
    for (let l = 0; l < p; l++) {
      const u = e * p + l;
      let c;
      if (u < t.length)
        c = t[u];
      else {
        const d = u - (t.length - 1), w = o[o.length - 1] + d;
        c = `${f}${w}`;
      }
      n.push(c);
    }
    m.push(n);
  }
  return m;
};
export {
  q as textSequenceStrategy
};
