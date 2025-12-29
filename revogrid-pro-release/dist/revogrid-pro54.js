import { isColGrouping as R } from "@revolist/revogrid";
import { BEFORE_CELL_RENDER_EVENT as g } from "./revogrid-pro78.js";
import { isFormula as p, evaluate as h, FORMULA_ERROR as i } from "./revogrid-pro133.js";
import { CorePlugin as F } from "./revogrid-pro106.js";
class C extends F {
  constructor(E, a) {
    super(E, a);
    const m = (n, e, r = /* @__PURE__ */ new Map()) => {
      const u = n.slice(1);
      try {
        return h(u, (o, l) => {
          const s = r.get(l) || /* @__PURE__ */ new Set();
          if (s.has(o))
            throw console.error("Recursion detected"), new Error("Recursion detected");
          s.add(o), r.set(l, s);
          const d = a.column.getColumns("all")[o];
          if (!R(d)) {
            const c = e[l]?.[d.prop];
            if (p(c)) {
              const f = m(c, e, r);
              if (f !== i)
                return f;
              throw new Error(i);
            }
            return c;
          }
          return 0;
        });
      } catch {
        return i;
      }
    };
    this.addEventListener(
      g,
      (n) => {
        const e = n.detail.model;
        if (p(e.value)) {
          const r = Object.entries(a.data.stores).reduce(
            (o, [l, s]) => [...o, ...s.store.get("source")],
            []
          ), u = m(e.value, r), t = n.detail.model;
          t.value = u, t.model = {
            ...t.model,
            [t.prop]: u
          };
        }
      }
    );
  }
}
export {
  C as FormulaPlugin
};
