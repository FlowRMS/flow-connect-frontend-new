/* empty css                */
import { getThresholdClasses as n } from "./revogrid-pro127.js";
const m = (s, { value: e, column: r, model: i, data: c }) => {
  if (typeof e > "u" || e === null)
    return;
  const t = r.minValue ?? 0, o = r.maxValue ?? 100, p = r.showValue ?? !1;
  let a;
  r.progress && typeof r.progress == "function" ? a = r.progress({ model: i, data: c, prop: String(r.prop) }) : a = ((Math.min(o, Math.max(t, Number(e))) || 0) - t) / (o - t) * 100;
  const l = a || 0, u = () => `${(l / (o || 1) * 100).toFixed(0)}%`, d = r.formatValue ? r.formatValue(l, r) : u(), g = n(l, r);
  return s("div", { class: "circular-progress-container" }, [
    s("div", { class: "circular-progress" }, [
      s("svg", { class: "circular-progress-svg", viewBox: "0 0 36 36" }, [
        // Background circle
        s("path", {
          class: "circular-progress-bg",
          d: "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        }),
        // Progress circle
        s("path", {
          class: {
            "circular-progress-path": !0,
            ...g
          },
          d: "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831",
          style: {
            "stroke-dasharray": `${a}, 100`
          }
        })
      ]),
      // Optional value display in center
      p && s("div", { class: "circular-progress-value" }, d)
    ])
  ]);
};
export {
  m as circularProgressRenderer
};
