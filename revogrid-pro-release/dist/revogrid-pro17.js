/* empty css                */
function m(n) {
  if (n <= 0.5)
    return `rgb(255, ${Math.round(255 * (n / 0.5))}, 0)`;
  {
    const t = Math.round(255 * ((1 - n) / 0.5)), e = Math.round(150 + 105 * ((1 - n) / 0.5));
    return `rgb(${t}, ${e}, 0)`;
  }
}
function d(n) {
  const e = Math.round(150 * n), o = Math.round(255 * n);
  return `rgb(0, ${e}, ${o})`;
}
function g(n) {
  const t = n.match(/\d+/g)?.map(Number);
  if (!t || t.length !== 3) return "#000";
  const [e, o, r] = t;
  return (0.2126 * e + 0.7152 * o + 0.0722 * r) / 255 > 0.5 ? "#000" : "#fff";
}
const b = (n, { value: t, column: e }) => {
  const o = e.minValue ?? 0, a = (e.maxValue ?? 100) - o || 1, u = e.colorMap ?? "heatmap", c = Math.min(1, Math.max(0, (Number(t) - o) / a)), s = u === "coldmap" ? d(c) : m(c), l = g(s);
  return n(
    "div",
    {
      class: "heatmap-cell",
      style: {
        backgroundColor: s,
        // Dynamically generated background
        color: l
        // Dynamically computed font color
      }
    },
    String(t)
    // Display the cell value
  );
};
export {
  b as heatmapRenderer
};
