/* empty css                */
import { getThresholdClasses as d } from "./revogrid-pro127.js";
const u = (s, { value: a, column: e }) => {
  const n = Array.isArray(a) ? a : [];
  if (n.length === 0) return s("div", { class: "sparkline-container" }, "");
  const l = e.maxValue ?? Math.max(...n), i = e.minValue ?? Math.min(...n), c = l - i || 1, r = n.map(
    (t) => 20 - (t - i) / c * 20
    // Invert to fit SVG Y-axis (0 at top)
  ), o = [];
  for (let t = 0; t < r.length - 1; t++) {
    const g = t / (n.length - 1) * 100, m = r[t], p = (t + 1) / (n.length - 1) * 100, x = r[t + 1], h = d(n[t], e);
    o.push(
      s("line", {
        class: {
          "sparkline-segment": !0,
          ...h
        },
        x1: g.toString(),
        y1: m.toString(),
        x2: p.toString(),
        y2: x.toString()
      })
    );
  }
  return s("div", { class: "sparkline-container" }, [
    s("svg", { class: "sparkline", viewBox: "0 0 100 20", xmlns: "http://www.w3.org/2000/svg" }, o)
  ]);
};
export {
  u as sparklineRenderer
};
