/* empty css                */
import o from "./revogrid-pro115.js";
import { h as n, FilterPlugin as p } from "@revolist/revogrid";
import { BEFORE_HEADER_RENDER_EVENT as h } from "./revogrid-pro78.js";
import { AdvanceFilterPlugin as d } from "./revogrid-pro52.js";
import { CorePlugin as c } from "./revogrid-pro106.js";
import { FIlTER_SELECTION as u, FIlTER_SLIDER as F } from "./revogrid-pro89.js";
class A extends c {
  constructor(e, i) {
    super(e, i), e.classList.add("filter-header"), this.addEventListener(h, (t) => {
      if (t.detail.data.hideFilterHeader || t.detail.data.filter === !1) {
        const a = t.detail.data.columnProperties;
        t.detail.data = {
          ...t.detail.data,
          columnProperties: (...s) => ({
            ...a?.(...s),
            "data-hide-filter-header": !0
          })
        };
        return;
      }
      const r = t.detail.data.columnTemplate;
      t.detail.data = {
        ...t.detail.data,
        columnTemplate: (...a) => this.createFilterUI(a[1], r?.(...a))
      };
    });
  }
  /**
   * Creates filter input and button UI using the h function.
   */
  createFilterUI(e, i) {
    const t = e?.name ?? "", r = e?.prop ?? "", a = this.isSelectionFilter(e), s = this.isInputEnabled(e);
    return n(
      "div",
      {
        class: { "filter-header-box flex flex-col grow h-full": !0 }
      },
      [
        n(
          "div",
          { class: { "filter-header-content header-rgRow group": !0 } },
          t ?? i
        ),
        n(
          "div",
          { class: { "filter-input flex grow flex-col": !0 } },
          n("input", {
            type: "text",
            placeholder: e?.filterPlaceholder ?? `Filter ${t}`,
            disabled: !s,
            hidden: e?.hideFilterHeader || e?.filter === !1,
            value: a ? this.getSelectedFilterValues(
              r,
              e?.hideFilterHeaderCount !== !0
            ).join(", ") : "",
            class: {
              "border border-gray-300 rounded px-2 py-1 text-sm w-full": !0
            },
            onClick(l) {
              l.stopPropagation();
            },
            onKeyDown(l) {
              l.stopPropagation();
            },
            onInput: this.debounceInput(
              (l) => this.handleFilterInput(l, r)
            )
          })
        )
      ]
    );
  }
  /**
   * Handles input event for the filter with debounce.
   */
  handleFilterInput(e, i) {
    const t = e.target, r = this.providers.plugins.getByClass(d) ?? this.providers.plugins.getByClass(p);
    r && r.multiFilterItems && (r.multiFilterItems[i] || (r.multiFilterItems[i] = []), r.multiFilterItems[i][0] ? r.multiFilterItems[i][0].value = t.value : r.multiFilterItems[i].push({
      id: 0,
      type: "contains",
      // Default to 'contains' or adapt based on logic
      value: t.value,
      relation: "and"
    }), r.onFilterChange(
      r.multiFilterItems
    ));
  }
  /**
   * Checks if a column has a selection filter applied.
   */
  isSelectionFilter(e) {
    return !e || !e.filter ? !1 : Array.isArray(e.filter) && e.filter.length > 0 ? e.filter.includes(u) : !1;
  }
  /**
   * Retrieves selected filter values for a column.
   */
  getSelectedFilterValues(e, i = !1) {
    const t = this.providers.plugins.getByClass(d), r = t?.multiFilterItems[e];
    if (t && r) {
      const a = t.getSelectionList(
        e,
        t.getExcludedValues(e)
      ), s = /* @__PURE__ */ new Map();
      return a.forEach((l) => {
        s.set(l.label, (s.get(l.label) ?? 0) + 1);
      }), Array.from(s.entries()).map(([l, f]) => `${l}${i ? ` (${f})` : ""}`);
    }
    return ["All"];
  }
  /**
   * Checks if input is enabled for a column based on LogicFunction's 'extra' field.
   */
  isInputEnabled(e) {
    return !e || e?.providers?.type === "rowHeaders" || e.filter === !1 ? !1 : Array.isArray(e.filter) && e.filter.length > 0 ? !e.filter.includes(u) && !e.filter.includes(F) : !0;
  }
  /**
   * Debounces user input to avoid frequent redraws.
   */
  debounceInput(e) {
    return o(e, 300);
  }
}
export {
  A as FilterHeaderPlugin
};
