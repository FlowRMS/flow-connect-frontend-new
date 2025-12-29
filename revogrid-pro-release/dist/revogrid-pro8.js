/* empty css                */
import { AFTER_SOURCE_EVENT as f, FLASH_CELL_EVENT as E, ON_EDIT_EVENT as m, BEFORE_CELL_RENDER_EVENT as p } from "./revogrid-pro78.js";
import { CorePlugin as h } from "./revogrid-pro106.js";
class C extends h {
  constructor(u, c) {
    super(u, c);
    let o = /* @__PURE__ */ new Map();
    this.addEventListener(f, () => {
      o = /* @__PURE__ */ new Map();
    }), this.addEventListener(
      E,
      (e) => {
        e.defaultPrevented || (o = /* @__PURE__ */ new Map(), Object.entries(e.detail.data).forEach(([t, r]) => {
          Object.entries(r).forEach(([l, a]) => {
            if (c.column.getColumnByProp(l)?.[0]?.flash?.(a)) {
              const n = c.data.getModel(
                parseInt(t, 10),
                e.detail.type
              ), i = `${e.detail.type}:${t}`, s = o.get(i) || /* @__PURE__ */ new Map();
              s.set(l, [a, n[l]]), o.set(`${e.detail.type}:${t}`, s);
            }
          });
        }));
      }
    ), this.addEventListener(
      m,
      (e) => {
        this.emit(E, e.detail);
      }
    ), this.addEventListener(
      p,
      (e) => {
        const t = e.detail.model, r = o.get(`${t.type}:${t.rowIndex}`), l = r?.get(t.prop);
        if (!l)
          return;
        const a = e.detail.model.column.cellProperties;
        e.detail.model = {
          ...t,
          previousValue: l[1],
          column: {
            ...t.column,
            cellProperties(...d) {
              const n = a?.(...d) || {}, i = {
                ref(s) {
                  n.ref && n.ref(s), s?.setAttribute("flash", ""), setTimeout(() => {
                    s?.removeAttribute("flash"), r?.delete(t.prop), i.flash = !1;
                  }, 1e3);
                }
              };
              return {
                ...i,
                ...n
              };
            }
          }
        };
      }
    );
  }
}
export {
  C as CellFlashPlugin
};
