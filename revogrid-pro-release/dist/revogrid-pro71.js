import { jsx as p } from "./revogrid-pro118.js";
import { render as i } from "./revogrid-pro119.js";
import { PivotConfigurator as n } from "./revogrid-pro95.js";
import { PIVOT_CONFIG_EN as a } from "./revogrid-pro99.js";
import "./revogrid-pro121.js";
/* empty css                */
import "@revolist/revogrid";
const C = (t, e = {}, o = {}) => {
  const r = (/* @__PURE__ */ new Date()).getTime();
  t.classList.add("pivot-config", "flex", "overflow-auto", "p-3"), i(
    /* @__PURE__ */ p(
      n,
      {
        ...e,
        i18n: { ...a, ...e.i18n },
        onUpdateColumns: o.onUpdateColumns,
        onUpdateRows: o.onUpdateRows,
        onUpdateValues: o.onUpdateValues
      },
      r
    ),
    t
  );
};
export {
  a as PIVOT_CONFIG_EN,
  n as PivotConfigurator,
  C as definePivotConfigurator
};
