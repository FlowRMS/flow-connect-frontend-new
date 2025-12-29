/* empty css                */
import { getItemByIndex as u, columnTypes as m } from "@revolist/revogrid";
import { COLUMN_UPDATED_EVENT as C, BEFORE_GROUP_HEADER_RENDER_EVENT as h, COLUMN_EXPAND_EVENT as g, COLUMN_COLLAPSE_EVENT as E } from "./revogrid-pro78.js";
import { defaultColumnTemplate as f } from "./revogrid-pro80.js";
import { CorePlugin as v } from "./revogrid-pro106.js";
const c = "column-collapsed", p = "column-collapse";
class O extends v {
  collapsedColumns = {};
  constructor(s, i) {
    super(s, i), s.classList.add(p), setTimeout(() => {
      this.initializeCollapsedStates();
    }, 100), this.addEventListener(C, (e) => {
      this.initializeCollapsedStates();
    }), this.addEventListener(h, (e) => {
      const r = e.detail.group, d = e.detail.providers.type;
      if (d !== "rowHeaders") {
        if (e.detail.group) {
          const t = this.providers.column.dataSources[d].store.get("items").reduce((o, a, l) => (o.set(a, l), o), /* @__PURE__ */ new Map());
          e.detail.group = {
            ...e.detail.group,
            indexes: e.detail.group.indexes.reduce(
              (o, a) => {
                const l = t.get(a);
                return l !== void 0 && o.push(l), o;
              },
              []
            )
          }, e.detail.start = u(
            e.detail.providers.dimension.state,
            e.detail.group.indexes[0]
          ).start, e.detail.end = u(
            e.detail.providers.dimension.state,
            e.detail.group.indexes[e.detail.group.indexes.length - 1]
          ).end;
        }
        if (r.collapsible) {
          const n = e.detail.group.columnProperties;
          e.detail.group = {
            ...e.detail.group,
            columnProperties: (t) => ({
              ...n?.(t),
              collapsible: !0
            }),
            columnTemplate: (t, o) => {
              const a = this.isCollapsed(r);
              return t(
                "div",
                {
                  class: "header-content flex"
                },
                [
                  t(
                    "div",
                    {
                      class: "overflow-hidden grow"
                    },
                    [f(r.columnTemplate)(t, o)]
                  ),
                  t(
                    "button",
                    {
                      class: {
                        "collapse-btn": !0,
                        collapsed: a
                      },
                      onClick: (l) => {
                        l.preventDefault(), this.toggleColumnCollapse(r, d);
                      }
                    },
                    t("span", void 0, "▼")
                  )
                ]
              );
            }
          };
        }
      }
    });
  }
  initializeCollapsedStates() {
    m.forEach((s) => {
      const i = this.providers.column.dataSources[s];
      if (!i) return;
      const e = i.store.get("groups"), r = i.store.get("trimmed")?.[c] ?? {}, d = i.store.get("source");
      Object.values(e)?.forEach(
        (n) => n.forEach((t) => {
          if (t.collapsible && t.collapsed) {
            const o = this.getColumnIds(t);
            this.collapsedColumns[o] = !0, t.indexes.forEach((a) => {
              const l = d[a];
              l && !l.sealed && (r[a] = !0);
            });
          }
        })
      ), Object.keys(r).length > 0 && this.setCollapsed(r, s);
    });
  }
  setCollapsed(s, i) {
    this.setColumnTrimmed({
      [c]: s
    }, i);
  }
  isCollapsed(s) {
    return this.collapsedColumns[this.getColumnIds(s)];
  }
  getColumnIds(s) {
    return s.indexes.join("__");
  }
  toggleColumnCollapse(s, i) {
    const e = this.providers.column.dataSources[i], r = e.store.get("proxyItems"), d = e.store.get("source"), n = e.store.get("trimmed")?.[c] ?? {}, t = this.getColumnIds(s);
    this.collapsedColumns[t] ? (this.collapsedColumns[t] = !1, s.indexes.forEach((o) => {
      n[o] = void 0;
    }), this.emit(g, { group: s })) : (this.collapsedColumns[t] = !0, s.indexes.forEach((o) => {
      const a = r[o], l = d[a];
      l && !l.sealed && (n[o] = !0);
    }), this.emit(E, { group: s })), this.setCollapsed(n, i);
  }
  destroy() {
    this.revogrid.classList.remove(p), super.destroy();
  }
}
export {
  O as ColumnCollapsePlugin
};
