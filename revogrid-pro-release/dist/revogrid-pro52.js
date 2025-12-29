/* empty css                */
import { FilterPlugin as u, filterCoreFunctionsIndexedByType as m, isGrouping as p } from "@revolist/revogrid";
import { notContains as g } from "./revogrid-pro154.js";
import { BEFORE_HEADER_RENDER_EVENT as c } from "./revogrid-pro78.js";
import { between as h } from "./revogrid-pro179.js";
import { DATE_FILTERS as E } from "./revogrid-pro88.js";
import { filterOperators as A, getExtraByOperator as v, getStartOfLastMonth as D, getStartOfThisMonth as b, getStartOfThisQuarter as B, getStartOfThisYear as H, getStartOfToday as M, getStartOfYesterday as N } from "./revogrid-pro88.js";
import { popUpContent as F } from "./revogrid-pro180.js";
import { FIlTER_QUICK_SEARCH as a, FIlTER_SLIDER as o, FIlTER_SELECTION as n } from "./revogrid-pro89.js";
class w extends u {
  constructor(t, e) {
    super(t, e), this.providers = e;
    const r = e.plugins.getByClass(u);
    this.filterConfig = r?.config, r && e.plugins.remove(r), this.initConfig({
      customFilters: {
        [n]: {
          columnFilterType: n,
          name: n,
          func: g
        },
        [o]: {
          columnFilterType: o,
          name: o,
          func: h
        },
        [a]: {
          columnFilterType: a,
          name: a,
          func: m.contains
        },
        ...E
      }
    }), this.addEventListener(c, (i) => {
      i.detail.data.filter && (i.detail.canFilter = !0);
    });
  }
  filterConfig;
  beforeshow(t) {
    Array.isArray(t.filter) && t.filter.length === 1 && (t.filter[0] === n || t.filter[0] === o) && (t.hideDefaultFilters = !0);
  }
  extraHyperContent = (t) => F(t, {
    multiFilterItems: this.multiFilterItems,
    dataStores: this.providers.data.stores,
    config: this.filterConfig,
    change: (...e) => this.onFilterChange(...e)
  });
  getExcludedValues(t) {
    const e = this.multiFilterItems[t];
    return e ? e.reduce((r, i) => i.type === n ? /* @__PURE__ */ new Set([...r, ...i.value]) : r, /* @__PURE__ */ new Set()) : /* @__PURE__ */ new Set();
  }
  getSelectionList(t, e = /* @__PURE__ */ new Set()) {
    return Object.entries(this.providers.data.stores).flatMap(([r, i]) => i.store.get("source").map((f) => {
      if (p(f))
        return null;
      let l = f[t]?.toString().trim(), s = l?.toLowerCase();
      return s || (s = "", l = "Empty"), {
        value: s,
        label: l
      };
    })).filter((r) => r && !e.has(r.value));
  }
}
export {
  w as AdvanceFilterPlugin,
  E as DATE_FILTERS,
  a as FIlTER_QUICK_SEARCH,
  n as FIlTER_SELECTION,
  o as FIlTER_SLIDER,
  A as filterOperators,
  v as getExtraByOperator,
  D as getStartOfLastMonth,
  b as getStartOfThisMonth,
  B as getStartOfThisQuarter,
  H as getStartOfThisYear,
  M as getStartOfToday,
  N as getStartOfYesterday
};
