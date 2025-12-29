/* empty css                */
import { h as m, isGrouping as d } from "@revolist/revogrid";
import { BEFORE_HEADER_RENDER_EVENT as c } from "./revogrid-pro78.js";
import { CorePlugin as i } from "./revogrid-pro106.js";
class f extends i {
  constructor(e, s) {
    super(e, s), this.providers = s, e.classList.add("summary-header"), this.addEventListener(c, (a) => {
      const t = a.detail.data, o = a.detail.data.columnTemplate, r = a.detail.data.prop || "";
      a.detail.data = {
        ...t,
        columnTemplate: (...u) => {
          const n = u[1], l = n.summaryVNode ? this.calculateSummary(r) : {};
          return m(
            "div",
            {
              class: { "summary-header-box grow": !0 },
              "data-value": r ?? void 0
            },
            [
              m(
                "div",
                { class: { "summary-header-content": !0 } },
                o?.(...u)
                // Render the original header
              ),
              m("div", { class: { "summary-container": !0 } }, [
                // Inject the summaryVNode template provided in column config
                n?.summaryVNode?.(m, l)
              ])
            ]
          );
        }
      };
    });
  }
  /**
   * Calculates summary data for the column.
   */
  calculateSummary(e) {
    return this.providers.data.stores.rgRow.store.get("source").filter((t) => !d(t)).map((t) => t[e]).reduce(
      (t, o) => {
        const r = o || "Other";
        return t[r] = (t[r] || 0) + 1, t;
      },
      {}
    );
  }
}
export {
  f as SummaryChartHeaderPlugin
};
