/* empty css                */
import { rowTypes as p } from "@revolist/revogrid";
import { ROW_TRANSPOSE_EVENT as f } from "./revogrid-pro78.js";
import { CorePlugin as w } from "./revogrid-pro106.js";
const h = {
  prop: "name",
  name: "",
  cellProperties: () => ({
    class: {
      "rowheader-column": !0
    }
  }),
  readonly: !0
};
class b extends w {
  config;
  // State variable for toggling
  isTransposed = !1;
  originalColumns = [];
  originalSource = /* @__PURE__ */ new Map();
  constructor(e, r) {
    super(e, r), this.config = e.additionalData?.transpose || {}, this.addEventListener(
      f,
      () => {
        this.transpose();
      }
    );
  }
  transpose() {
    let e = [], r = /* @__PURE__ */ new Map();
    if (this.isTransposed)
      e = this.originalColumns, r = this.originalSource, this.isTransposed = !1, this.revogrid.removeAttribute("transposed");
    else {
      this.originalColumns = this.revogrid.columns, this.originalSource = p.reduce((o, t) => (o.set(t, this.providers.data.stores[t].store.get("source")), o), /* @__PURE__ */ new Map()), p.forEach((o) => {
        const t = this.originalSource.get(o), n = this.providers.column.getColumns(
          m(o) ?? "rgCol"
        );
        r.set(
          o,
          P(n, this.originalSource)
        ), e.push(
          ...S({
            originalSource: t,
            rowPin: o,
            columnHeader: this.config.transposedColumnHeader,
            originalColumns: n
          })
        );
      });
      const i = this.config.transposedRowHeader !== !1 ? {
        ...h,
        ...this.config.transposedRowHeader,
        prop: h.prop
      } : void 0;
      i && e.unshift({
        ...i,
        pin: e[0]?.pin
      }), this.isTransposed = !0, this.revogrid.setAttribute("transposed", "true");
    }
    this.config.hideRowHeader && (this.revogrid.rowHeaders = !this.isTransposed), this.config.hideColumnHeader && this.revogrid.setAttribute("no-header", this.isTransposed ? "true" : "false"), this.revogrid.columns = e, r.forEach((i, o) => {
      switch (o) {
        case "rowPinStart":
          this.revogrid.pinnedTopSource = i;
          break;
        case "rowPinEnd":
          this.revogrid.pinnedBottomSource = i;
          break;
        default:
          this.revogrid.source = i;
          break;
      }
    });
  }
}
function P(s, e) {
  return s.map(
    (r) => new C(r.prop, e, r.name)
  );
}
function S({
  originalSource: s,
  rowPin: e,
  columnHeader: r,
  originalColumns: i
}) {
  const o = [], t = /* @__PURE__ */ new Map();
  return i.forEach((n) => {
    t.set(n.prop, n);
  }), s.forEach((n, d) => {
    o.push({
      name: T(d),
      ...r,
      pin: m(e),
      prop: g(d, e),
      cellTemplate: (a, l) => {
        const c = l.model, u = t.get(c.field);
        return u?.cellTemplate ? u.cellTemplate(a, {
          ...l,
          column: u
        }) : l.value;
      },
      cellProperties: (a) => {
        const l = a.model, c = t.get(l.field);
        return c?.cellProperties ? c.cellProperties({
          ...a,
          column: c
        }) : a.value;
      }
    });
  }), o;
}
function m(s) {
  return s === "rowPinStart" ? "colPinStart" : s === "rowPinEnd" ? "colPinEnd" : void 0;
}
function T(s) {
  return `Item ${s + 1}`;
}
function g(s, e) {
  return `${e ? `${e}` : "rgCol"}:${s}`;
}
class C {
  /**
   * Creates a new `TransposedRow` instance.
   *
   * @param field The field in the original source to use for the transposed
   * values.
   * @param originalSource The original source data.
   */
  constructor(e, r, i) {
    this.field = e, this.originalSource = r, this.name = i, this.defineProperties();
  }
  getOriginalModels(e) {
    return e.map((r) => {
      const [i, o] = r.toString().split(":"), t = this.originalSource.get(i);
      if (t)
        return t[+o];
    });
  }
  /**
   * Defines the properties on the `TransposedRow` instance.
   */
  defineProperties() {
    this.originalSource.forEach((e, r) => {
      e.forEach((i, o) => {
        Object.defineProperty(this, g(o, r), {
          // The getter for the property returns the value of the field in the
          // original source at the index of the row.
          get: () => i[this.field],
          // The setter for the property sets the value of the field in the
          // original source at the index of the row.
          set: (t) => {
            i[this.field] = t;
          },
          // The property is enumerable, which means it will be included in the
          // results of a `for...in` loop.
          enumerable: !0
        });
      });
    });
  }
}
export {
  b as RowTransposePlugin,
  C as TransposedRow
};
