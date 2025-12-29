import { BEFORE_KEYDOWN_EVENT as d } from "./revogrid-pro78.js";
import { CorePlugin as h } from "./revogrid-pro106.js";
class C extends h {
  constructor(c, s) {
    super(c, s), this.revogrid = c, this.providers = s, this.addEventListener(d, async (l) => {
      const { detail: t } = l;
      if (t?.focus) {
        const a = s.selection.stores, f = Object.keys(a).toSorted(
          (r, i) => parseInt(r, 10) - parseInt(i, 10)
        ), o = a[parseInt(f[f.length - 1], 10)], n = Object.keys(o).toSorted(
          (r, i) => parseInt(r, 10) - parseInt(i, 10)
        ), S = o[parseInt(n[n.length - 1], 10)], p = o[parseInt(n[0], 10)], u = s.selection.focusedStore, y = u?.entity;
        if (t.edit || !u)
          return;
        let e;
        const g = t.focus.y < (t.lastCell?.y ?? 0) - 1, x = (t.lastCell?.x ?? 0) - 1 <= t.focus.x;
        y === S && x && g && t.original.key === "Tab" && !t.original.shiftKey && (e = { x: 0, y: t.focus.y + 1 });
        const F = t.focus.y > 0, L = t.focus.x === 0;
        if (y === p && L && F && t.original.key === "Tab" && t.original.shiftKey && (e = { x: 0, y: t.focus.y - 1 }), e) {
          l.preventDefault(), t.original.preventDefault(), s.selection.stores[0]?.["0"]?.setNextFocus(e);
          return;
        }
      }
    });
  }
}
export {
  C as RowKeyboardNextLineFocusPlugin
};
