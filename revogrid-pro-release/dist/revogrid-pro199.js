import { jsx as c } from "./revogrid-pro118.js";
import { render as v } from "./revogrid-pro119.js";
import { useState as C, useEffect as y, useMemo as S } from "./revogrid-pro121.js";
import { isGrouping as A } from "@revolist/revogrid";
const P = ({ search: i, selectAll: d, searchValue: l, allSelected: p }) => {
  const [h, m] = C(l || "");
  return y(() => {
    m(l || "");
  }, [l]), /* @__PURE__ */ c("div", { className: "search-input flex items-center", children: [
    /* @__PURE__ */ c(
      "input",
      {
        type: "checkbox",
        checked: p,
        onChange: (n) => d(n.currentTarget.checked)
      }
    ),
    /* @__PURE__ */ c(
      "input",
      {
        type: "text",
        value: h,
        onKeyDown: (n) => n.stopPropagation(),
        onInput: (n) => {
          const u = n.currentTarget.value;
          m(u), i(u?.trim().toLowerCase());
        },
        onPaste: (n) => n.stopPropagation(),
        onCopy: (n) => n.stopPropagation(),
        onContextMenu: (n) => n.stopPropagation()
      }
    )
  ] });
}, V = ({
  columnProp: i,
  dataProvider: d,
  exclude: l = /* @__PURE__ */ new Set(),
  search: p,
  filter: h,
  quickFilter: m,
  sortDirection: n
}) => {
  const [u, E] = C(l), [w, x] = C(/* @__PURE__ */ new Map()), [L, N] = C(p || ""), k = (a, o) => {
    const s = /* @__PURE__ */ new Map();
    return a.forEach((t, e) => {
      e?.toLowerCase()?.includes(o.toLowerCase()) && s.set(e, t);
    }), s;
  };
  y(() => {
    const a = /* @__PURE__ */ new Map();
    Object.entries(d).forEach(([o, s]) => {
      s.store.get("source").forEach((t) => {
        if (A(t)) return;
        let e = t[i]?.toString().trim(), r = e?.toLowerCase();
        r || (r = "", e = "Empty"), a.set(r, {
          text: e,
          checked: !u.has(r)
        });
      });
    }), x(a);
  }, [i, d, u]), y(() => {
    N(p || "");
  }, [p]);
  const B = (a) => {
    N(a), m(a);
  }, f = S(() => k(w, L), [w, L]), b = S(() => {
    if (f.size === 0) return !1;
    for (const [a, o] of f.entries())
      if (!o.checked) return !1;
    return !0;
  }, [f]), M = (a) => {
    const o = new Set(u), s = new Map(w);
    f.forEach((t, e) => {
      a ? (o.delete(e), s.set(e, { ...t, checked: !0 })) : (o.add(e), s.set(e, { ...t, checked: !1 }));
    }), x(s), E(o), h(o);
  }, T = (a, o) => {
    const s = new Set(u), t = a.toLowerCase();
    o ? s.delete(t) : s.add(t);
    const e = new Map(w);
    e.has(t) && e.set(t, {
      ...e.get(t),
      checked: o
    }), x(e), E(s), h(s);
  }, D = S(() => {
    let a = [...f.entries()];
    return (n === "asc" || n === "desc") && a.sort((o, s) => {
      const t = o[1].text?.toLowerCase() || "", e = s[1].text?.toLowerCase() || "", r = Number(t), g = Number(e);
      return !isNaN(r) && !isNaN(g) ? n === "asc" ? r - g : g - r : n === "asc" ? t.localeCompare(e) : e.localeCompare(t);
    }), a;
  }, [f, n]);
  return /* @__PURE__ */ c("div", { children: [
    /* @__PURE__ */ c(
      P,
      {
        search: B,
        selectAll: M,
        searchValue: p,
        allSelected: b
      }
    ),
    /* @__PURE__ */ c("ul", { className: "filter-list", children: D.map(([a, { text: o, checked: s }]) => /* @__PURE__ */ c("li", { children: /* @__PURE__ */ c("label", { className: "flex items-center", children: [
      /* @__PURE__ */ c(
        "input",
        {
          type: "checkbox",
          checked: s,
          onChange: (t) => T(o, t.currentTarget.checked)
        }
      ),
      o
    ] }) }, a)) })
  ] });
}, F = (i, d) => {
  const l = (/* @__PURE__ */ new Date()).getTime();
  v(/* @__PURE__ */ c(V, { ...d }, l), i);
};
export {
  V as List,
  F as defineList
};
