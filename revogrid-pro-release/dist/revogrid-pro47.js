import { dispatchByEvent as C } from "@revolist/revogrid";
import { CELL_EDIT_ORIGINAL_EVENT as E } from "./revogrid-pro78.js";
import { getThresholdClasses as P } from "./revogrid-pro127.js";
import { DateService as d } from "./revogrid-pro129.js";
/* empty css                */
import { COLLAPSE_ICON as D, EXPAND_ICON as h } from "./revogrid-pro39.js";
const M = (t, o, I) => {
  const i = o.column, r = o.value || { from: "", to: "", progress: 0 }, l = i?.milestoneMode ?? !1;
  let s;
  i.progress && typeof i.progress == "function" ? s = i.progress({ model: o.model, data: o.data, prop: String(o.prop) }) : s = r.progress ?? d.calculateProgress(r);
  const u = P(s, i), c = (e, a) => {
    const n = a.target.value, k = { ...r, [e]: n }, x = {
      rgCol: o.colIndex,
      rgRow: o.rowIndex,
      type: o.type,
      prop: o.prop,
      val: k,
      preventFocus: !0
    };
    C(a, E, x);
  }, m = t("div", {
    class: "text-xs px-2 py-1 z-10 whitespace-nowrap timeline-editor__date-range"
  }, d.formatDateRange(r)), f = t("div", {
    class: `absolute h-full flex items-center timeline-editor__progress-bar ${Object.keys(u).join(" ")}`,
    style: { width: `${s}%` }
  }, [
    m
  ]), g = t("div", { class: "absolute w-full h-2 timeline-editor__timeline-bar" }), y = t("div", { class: "opacity-0" }, [
    t("input", {
      type: "date",
      value: r.from,
      onChange: (e) => c("from", e),
      onMouseDown: (e) => e.stopPropagation()
    }),
    l ? null : t("input", {
      type: "date",
      value: r.to,
      onChange: (e) => c("to", e),
      onMouseDown: (e) => e.stopPropagation()
    })
  ]), v = t("div", {
    class: "cursor-pointer flex items-center justify-center timeline-editor__date-picker-icon",
    onClick: (e) => {
      const n = e.currentTarget.parentElement?.parentElement?.querySelector('input[type="date"]:first-child');
      n && (p(n), e.stopPropagation());
    }
  }, D), _ = l ? null : t("div", {
    class: "cursor-pointer flex items-center justify-center timeline-editor__date-picker-icon",
    onClick: (e) => {
      const n = e.currentTarget.parentElement?.parentElement?.querySelector('input[type="date"]:last-child');
      n && (p(n), e.stopPropagation());
    }
  }, h), w = t("div", { class: "absolute w-full flex justify-between px-1" }, [
    v,
    _
  ]), b = t("div", { class: "relative w-full h-full flex items-center" }, [
    f,
    g,
    y,
    w
  ]);
  return t("div", {
    key: "timeline-editor",
    class: "flex items-center w-full h-full box-border timeline-editor__container"
  }, b);
};
function p(t) {
  const o = new KeyboardEvent("keydown", {
    bubbles: !0,
    cancelable: !0,
    key: "F4",
    code: "F4",
    keyCode: 115
    // F4 key code
  });
  t.dispatchEvent(o), t.showPicker();
}
export {
  M as editorTimeline
};
