/* empty css                */
import { getThresholdClasses as u } from "./revogrid-pro127.js";
const m = (r, n) => {
  const { value: s, column: e, model: i, data: t } = n;
  if (typeof s > "u" || s === null)
    return;
  const o = e.minValue ?? 0, a = e.maxValue ?? 100;
  let l;
  return e.progress && typeof e.progress == "function" ? l = e.progress({ model: i, data: t, prop: String(e.prop) }) : l = (Math.min(
    a,
    Math.max(o, Number(s))
  ) - o) / (a - o) * 100, r(
    "div",
    {
      class: {
        "progress-line-cell": !0,
        ...u(Number(s), e)
      }
    },
    [
      r("div", { class: "cell-value" }, String(s)),
      // Display the original cell value
      r("div", {
        class: "progress-line-bar",
        style: {
          width: `${l}%`
          // Pass percentage as CSS variable
        }
      }),
      r("div", {
        class: "progress-line-bar-shadow",
        style: {
          width: `${l}%`
          // Pass percentage as CSS variable
        }
      }),
      r("div", { class: "progress-line-background" })
    ]
  );
};
export {
  m as progressLineWithValueRenderer
};
