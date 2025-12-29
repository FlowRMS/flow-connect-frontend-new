/* empty css                */
import { getThresholdClasses as f } from "./revogrid-pro127.js";
const c = (r, { value: s, column: e, model: n, data: p }) => {
  if (typeof s > "u" || s === null)
    return;
  const t = e.minValue ?? 0, a = e.maxValue ?? 100;
  let o;
  e.progress && typeof e.progress == "function" ? o = e.progress({ model: n, data: p, prop: String(e.prop) }) : o = (Math.min(a, Math.max(t, Number(s))) - t) / (a - t) * 100;
  const i = Number(s) || 0, l = () => `${(i / (a || 1) * 100).toFixed(1)}%`, d = e.formatValue ? e.formatValue(i, e) : l(), g = f(i, e);
  return r("div", { class: "progress-line-container" }, [
    r("div", { class: "progress-line-background" }, [
      r("div", {
        class: {
          "progress-line-bar": !0,
          ...g
        },
        value: s,
        style: {
          width: `${o}%`
          // Pass percentage as CSS variable
        }
      })
    ]),
    r("span", { class: "progress-line-label" }, d)
    // Show 1 decimal place
  ]);
};
export {
  c as progressLineRenderer
};
