function w(u, p = {}) {
  const {
    separator: i = ", ",
    wrapper: o = "div",
    wrapperClass: y = "array-renderer",
    wrapperStyle: f = {}
  } = p;
  return (a, e, l) => {
    const s = e.value;
    if (s == null)
      return a("span", { class: "empty-value" }, "");
    if (!Array.isArray(s))
      return u ? u(a, e, l) : a("span", {}, String(s));
    if (s.length === 0)
      return a("span", { class: "empty-array" }, "");
    const m = s.map((c, r) => {
      const n = {
        ...e,
        value: c,
        // Add index to props for the renderer to use if needed
        arrayIndex: r
      };
      return u ? u(a, n, l) : a("span", {}, String(c));
    }).reduce(
      (c, r, n) => n === 0 ? [r] : [
        ...c,
        a("span", { class: "array-separator" }, i),
        r
      ],
      []
    );
    return a(
      o,
      {
        class: y,
        style: f
      },
      m
    );
  };
}
function S(u) {
  const {
    default: p,
    renderers: i,
    separator: o = ", ",
    wrapper: y = "div",
    wrapperClass: f = "multi-renderer",
    wrapperStyle: a = {}
  } = u;
  return (e, l, s) => {
    const t = l.value;
    if (t == null)
      return e("span", { class: "empty-value" }, "");
    if (!Array.isArray(t)) {
      const r = i.find(
        ({ condition: d }) => d(t)
      ), n = r ? r.renderer : p;
      return n ? n(e, l, s) : e("span", {}, String(t));
    }
    if (t.length === 0)
      return e("span", { class: "empty-array" }, "");
    const c = t.map((r, n) => {
      const d = {
        ...l,
        value: r,
        // Add index to props for the renderer to use if needed
        arrayIndex: n
      }, v = i.find(
        ({ condition: I }) => I(r)
      ), g = v ? v.renderer : p;
      return g ? g(e, d, s) : e("span", {}, String(r));
    }).reduce(
      (r, n, d) => d === 0 ? [n] : [
        ...r,
        e("span", { class: "array-separator" }, o),
        n
      ],
      []
    );
    return e(
      y,
      {
        class: f,
        style: a
      },
      c
    );
  };
}
export {
  w as arrayRenderer,
  S as multiRenderer
};
