const n = (r, t) => {
  if (!t)
    return !0;
  if (r || (r = 0), t) {
    if (typeof r != "number")
      try {
        r = parseFloat(r);
      } catch {
        r = 0;
      }
    return r >= t.fromValue && r <= t.toValue;
  }
  return !0;
};
export {
  n as between
};
