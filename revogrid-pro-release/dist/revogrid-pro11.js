/* empty css                */
import { AFTER_SOURCE_EVENT as f, ON_EDIT_EVENT as P, BEFORE_CELL_RENDER_EVENT as g } from "./revogrid-pro78.js";
import { EventManagerPlugin as T } from "./revogrid-pro49.js";
import { validationRenderer as h } from "./revogrid-pro84.js";
import { invalidCellProps as O } from "./revogrid-pro84.js";
import { CorePlugin as C } from "./revogrid-pro106.js";
class N extends C {
  constructor(p, s) {
    super(p, s), s.plugins.getByClass(T) || console.error(
      "CellValidatePlugin requires EventManagerPlugin to be registered"
    );
    let i = /* @__PURE__ */ new Map();
    this.addEventListener(f, () => {
      i = /* @__PURE__ */ new Map();
    }), this.addEventListener(P, (t) => {
      i = /* @__PURE__ */ new Map(), Object.entries(t.detail.data).forEach(([l, d]) => {
        Object.entries(d).forEach(([e, a]) => {
          const o = s.column.getColumnByProp(e)?.[0];
          if (!o || !o.validate || o.softValidation)
            return;
          const n = s.data.getModel(
            parseInt(l, 10),
            t.detail.type
          );
          if (!o.validate(a, n)) {
            const r = i.get(`${t.detail.type}:${l}`) || /* @__PURE__ */ new Map();
            r.set(e, a), i.set(`${t.detail.type}:${l}`, r);
          }
        });
      }), i.size && (t.preventDefault(), p.refresh());
    }), this.addEventListener(
      g,
      (t) => {
        const l = t.detail.model.column, d = l.cellProperties, e = t.detail.model, a = h({
          template: l.cellTemplate,
          invalidProperties: l.invalidProperties
        }), o = l.validationTooltip;
        t.detail.model = {
          ...e,
          column: {
            ...e.column,
            cellProperties(...n) {
              const c = {
                invalid: i.get(
                  `${e.type}:${e.rowIndex}`
                )?.has(e.prop)
              };
              return {
                ...a.cellProperties(...n),
                ...c,
                ...d?.(...n) || {}
              };
            },
            cellTemplate(...n) {
              const [r, { value: m, column: c }, ...u] = n, E = i.get(
                `${e.type}:${e.rowIndex}`
              );
              return a.cellTemplate(r, {
                ...n[1],
                column: {
                  ...c,
                  validationTooltip: (v) => o?.(E?.get(e.prop)) || o?.(v)
                },
                ...u
              });
            }
          }
        };
      }
    );
  }
}
export {
  N as CellValidatePlugin,
  O as invalidCellProps,
  h as validationRenderer
};
