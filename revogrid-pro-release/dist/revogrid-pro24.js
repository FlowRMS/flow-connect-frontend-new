/* empty css                */
function s(e, t) {
  return `hsl(${e / t * 360}, 70%, 50%)`;
}
function g(e) {
  return Array.isArray(e) && typeof e[0] == "number" ? e.map((t, r) => ({
    value: t,
    color: s(r, e.length),
    name: `Slice ${r + 1}`
  })) : Array.isArray(e) && typeof e[0] == "object" ? e : [];
}
function m(e = [], t) {
  if (!t)
    return;
  const r = g(e), h = r.reduce((n, c) => n + c.value, 0);
  let o = 0;
  const f = Math.min(t.width, t.height) / 2, i = t.getContext("2d");
  r.forEach((n, c) => {
    const l = n.value / h * 2 * Math.PI;
    if (i.beginPath(), i.moveTo(t.width / 2, t.height / 2), i.arc(
      t.width / 2,
      t.height / 2,
      f,
      o,
      o + l
    ), i.fillStyle = n.color || s(c, r.length), i.fill(), n.name) {
      i.fillStyle = "#ffffff";
      const a = t.width / 2 + Math.cos(o + l / 2) * (f / 2), u = t.height / 2 + Math.sin(o + l / 2) * (f / 2);
      i.fillText(n.name, a, u);
    }
    o += l;
  });
}
const d = (e, {
  value: t = [],
  column: r
}) => e("canvas", { class: "pie-chart-canvas", ref: (h) => m(t, h) });
export {
  d as pieChartRenderer
};
