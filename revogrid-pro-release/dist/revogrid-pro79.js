import l from "./revogrid-pro134.js";
const a = /^\d{4}-\d{2}-\d{2}$/;
function d(e) {
  return a.test(e) && !isNaN(new Date(e).getTime());
}
function u(e) {
  const t = e.createElement("div"), o = t.style;
  o.visibility = "hidden", o.overflow = "scroll", o.msOverflowStyle = "scrollbar", e.body.appendChild(t);
  const r = e.createElement("div");
  t.appendChild(r);
  const s = t.offsetWidth - r.offsetWidth;
  return t.parentNode?.removeChild(t), s;
}
function m(e) {
  const t = e.providers.selection.get("range");
  return t && l(e.rowIndex, t.y, t.y1 + 1) ? t : null;
}
function g(e, t) {
  const o = t[e].store, r = o.get("items"), s = o.get("source");
  return {
    items: r,
    source: s
  };
}
function h(e) {
  return e === "rgRow";
}
function p(e, t) {
  const o = t.split(" > ").map((s) => s.trim());
  let r = e;
  for (const s of o) {
    const i = s.startsWith("."), n = i ? s.slice(1) : s;
    if (r = Array.from(r.children).find((c) => i ? c.classList.contains(n) : c.tagName.toLowerCase() === n.toLowerCase()), !r)
      return null;
  }
  return r;
}
function y(e, t, o) {
  const r = {};
  r[t] = o;
  const s = Object.keys(e).map(Number).sort((n, c) => n - c), i = 1;
  for (const n of s)
    n >= t ? r[n + i] = e[n] : r[n] = e[n];
  return r;
}
function v(e, t) {
  const o = {}, r = Object.keys(e || {}).map(Number).sort((n, c) => n - c), s = r[r.length - 1];
  let i = 0;
  for (let n = 0; n <= s; n++)
    t.has(n) && (i++, e[n] !== void 0) || e[n] !== void 0 && (o[n - i] = e[n]);
  return o;
}
export {
  y as addAndShift,
  p as directAncestor,
  u as getScrollbarWidth,
  g as getStore,
  h as isMainContent,
  d as isValidISODate,
  v as removeMultipleAndShift,
  m as rowInRange
};
