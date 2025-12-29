/* empty css                */
import { getThresholdClasses as t } from "./revogrid-pro127.js";
const g = (e, { value: a, column: s, model: c }) => {
  const n = Number(c[s.prop]) || 0, r = t(n, s);
  return e(
    "div",
    {
      class: {
        "change-cell": !0,
        ...r
      }
    },
    [l(e, n, a)]
  );
};
function l(e, a, s) {
  return a > 0 ? e("div", { class: "change-positive" }, [
    e("span", { class: "change-value" }, `${s}`),
    e("span", { class: "change-icon" }, "▲")
  ]) : a < 0 ? e("div", { class: "change-negative" }, [
    e("span", { class: "change-value" }, `(${s})`),
    e("span", { class: "change-icon" }, "▼")
  ]) : e("div", { class: "change-neutral" }, [
    e("span", { class: "change-value" }, s)
  ]);
}
export {
  g as changeRenderer
};
