/* empty css                */
import { getThresholdClasses as h } from "./revogrid-pro127.js";
const b = (r, {
  value: e,
  column: t
}) => {
  const a = Array.isArray(e) ? e : [];
  if (a.length === 0)
    return r("div", { class: "bar-chart-container" }, "");
  const i = t?.maxValue ?? Math.max(...a), n = t?.minValue ?? Math.min(...a), o = a.map(
    (s) => (s - n) / (i - n || 1) * 100
    // Scale to fit 100% width/height
  );
  return r("div", { class: "bar-chart-container" }, [
    r("div", { class: `bar-chart ${t?.barPosition || "bottom"}` }, [
      // Render a div for each data point (bar)
      ...o.map((s, l) => {
        const c = h(s, t);
        return r("div", {
          class: {
            "bar-chart-bar": !0,
            ...c
          },
          style: {
            width: `${100 / a.length}%`,
            // Set width of each bar based on total number of bars
            height: `${s}%`
            // Height of each bar relative to normalized data
          }
        });
      })
    ])
  ]);
};
export {
  b as barChartRenderer
};
