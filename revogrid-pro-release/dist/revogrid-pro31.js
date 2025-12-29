import { getColumnType as m, getSourceItem as p, columnTypes as z } from "@revolist/revogrid";
import a from "./revogrid-pro111.js";
import h from "./revogrid-pro112.js";
import { CorePlugin as f } from "./revogrid-pro106.js";
const S = 7;
var v = /* @__PURE__ */ ((l) => (l.headerClickAutosize = "headerClickAutoSize", l.autoSizeOnTextOverlap = "autoSizeOnTextOverlap", l.autoSizeAll = "autoSizeAll", l))(v || {});
class L extends f {
  constructor(i, s) {
    super(i, s), this.providers = s, this.config = i.additionalData?.autoSizeColumnConfig, this.letterBlockSize = this.config?.letterBlockSize || S, this.config?.preciseSize && (this.precsizeCalculationArea = this.initiatePresizeElement(), i.appendChild(this.precsizeCalculationArea));
    const t = ({
      detail: { source: e }
    }) => {
      this.setSource(e);
    }, o = ({
      detail: { columns: e }
    }) => {
      this.columnSet(e);
    };
    switch (this.addEventListener("beforecolumnsset", o), this.config?.mode) {
      case "autoSizeOnTextOverlap":
        this.addEventListener("aftersourceset", t), this.addEventListener(
          "afteredit",
          ({ detail: e }) => {
            this.afteredit(e);
          }
        );
        break;
      case "autoSizeAll":
        this.addEventListener("aftersourceset", t), this.addEventListener("afteredit", ({ detail: e }) => {
          this.afterEditAll(e);
        });
        break;
      default:
        this.addEventListener(
          "headerdblclick",
          ({ detail: e }) => {
            const n = m(e.column), r = this.getColumnSize(e.index, n);
            r && this.providers.dimension.setCustomSizes(
              n,
              {
                [e.index]: r
              },
              !0
            );
          }
        );
        break;
    }
  }
  autoSizeColumns = null;
  letterBlockSize;
  /** for config option when preciseSize enabled */
  precsizeCalculationArea = null;
  config;
  /** for edge case when no columns defined before data */
  dataResolve = null;
  dataReject = null;
  async setSource(i) {
    let s = this.autoSizeColumns;
    if (this.dataReject && (this.dataReject(), this.clearPromise()), !s) {
      const t = new Promise((o, e) => {
        this.dataResolve = o, this.dataReject = e;
      });
      try {
        s = await t;
      } catch {
        return;
      }
    }
    a(s, (t, o) => {
      const e = {};
      a(s[o], (n) => {
        n.size = e[n.index] = i.reduce(
          (r, u) => Math.max(r, this.getLength(u[n.prop])),
          this.getLength(n.name || "")
        );
      }), this.providers.dimension.setCustomSizes(
        o,
        e,
        !0
      );
    });
  }
  getLength(i) {
    if (!i)
      return 0;
    try {
      const t = i.toString();
      return this.config?.preciseSize && this.precsizeCalculationArea ? (this.precsizeCalculationArea.innerText = t, this.precsizeCalculationArea.scrollWidth + 30) : t.length * this.letterBlockSize + 30;
    } catch {
      return 0;
    }
  }
  afteredit(i) {
    let s;
    this.isRangeEdit(i) ? s = i.data : s = { 0: { [i.prop]: i.val } }, a(this.autoSizeColumns, (t, o) => {
      const e = {};
      a(t, (n) => {
        const r = h(
          s,
          (u, c) => typeof c[n.prop] > "u" ? u : Math.max(u || 0, this.getLength(c[n.prop])),
          void 0
        );
        r && (n.size ?? 0) < r && (n.size = e[n.index] = r);
      }), this.providers.dimension.setCustomSizes(
        o,
        e,
        !0
      );
    });
  }
  afterEditAll(i) {
    const s = {};
    this.isRangeEdit(i) ? a(i.data, (t) => a(t, (o, e) => s[e] = !0)) : s[i.prop] = !0, a(this.autoSizeColumns, (t, o) => {
      const e = {};
      a(t, (n) => {
        if (s[n.prop]) {
          const r = this.getColumnSize(n.index, o);
          r && (e[n.index] = r);
        }
      }), this.providers.dimension.setCustomSizes(
        o,
        e,
        !0
      );
    });
  }
  getColumnSize(i, s) {
    const t = this.autoSizeColumns?.[s]?.[i];
    return t ? h(
      this.providers.data.stores,
      (o, e) => {
        const n = h(
          e.store.get("items"),
          (r, u, c) => {
            const d = p(e.store, c);
            return Math.max(r || 0, this.getLength(d?.[t.prop]));
          },
          0
        );
        return Math.max(o, n);
      },
      t.size || 0
    ) : 0;
  }
  columnSet(i) {
    for (let s of z) {
      const t = s, o = i[t];
      for (let e in o)
        (o[e].autoSize || this.config?.allColumns) && (this.autoSizeColumns || (this.autoSizeColumns = {}), this.autoSizeColumns[t] || (this.autoSizeColumns[t] = {}), this.autoSizeColumns[t][e] = {
          ...o[e],
          index: parseInt(e, 10)
        });
    }
    this.dataResolve && (this.dataResolve(this.autoSizeColumns || {}), this.clearPromise());
  }
  clearPromise() {
    this.dataResolve = null, this.dataReject = null;
  }
  isRangeEdit(i) {
    return !!i.data;
  }
  initiatePresizeElement() {
    const i = {
      position: "absolute",
      fontSize: "14px",
      height: "0",
      width: "0",
      whiteSpace: "nowrap",
      top: "0",
      overflowX: "scroll",
      display: "block"
    }, s = document.createElement("div");
    for (let t in i)
      s.style[t] = i[t] ?? "";
    return s.classList.add("revo-test-container"), s;
  }
  destroy() {
    super.destroy(), this.precsizeCalculationArea?.remove();
  }
}
export {
  L as AutoSizeColumnPlugin,
  v as ColumnAutoSizeMode
};
