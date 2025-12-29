import { jsx as t } from "./revogrid-pro118.js";
import { render as F, createElement as x } from "./revogrid-pro119.js";
/* empty css                */
import { useRef as H, useMemo as k, useState as E, useEffect as Q } from "./revogrid-pro121.js";
import { DropdownPopup as U } from "./revogrid-pro122.js";
import { DropdownPopupContent as W } from "./revogrid-pro123.js";
import { DeleteButton as X } from "./revogrid-pro124.js";
const Y = ({
  options: r,
  className: n
}) => /* @__PURE__ */ t("span", { className: `selected-value ${n}`, children: r[0].label }), Z = ({
  options: r,
  removeOption: n,
  className: a
}) => /* @__PURE__ */ t("div", { className: `selected-values ${a}`, children: r.map((i, l) => /* @__PURE__ */ t("span", { className: "selected-tag", children: [
  i.label,
  /* @__PURE__ */ t(
    X,
    {
      onClick: (m) => {
        m.stopPropagation(), n(i);
      },
      locale: {
        title: `Remove ${i.label}`,
        ariaLabel: `Remove ${i.label}`
      }
    }
  )
] }, l)) }), I = ({
  className: r
}) => /* @__PURE__ */ t("span", { className: `dropdown-arrow ${r}`, children: "▼" }), ee = ({
  placeholder: r,
  className: n
}) => [/* @__PURE__ */ t("span", { className: `placeholder px-2 ${n}`, children: r }), /* @__PURE__ */ t(I, { className: "mr-2" })];
function te({
  source: r,
  value: n,
  onChange: a,
  placeholder: i = "Select an option",
  disabled: l = !1,
  name: m,
  id: v,
  className: A = "",
  style: C,
  config: y = {},
  renderOption: L,
  renderPlaceholder: N,
  renderSelectedValue: O,
  renderNoResults: P
}) {
  const {
    search: B = !1,
    searchPlaceholder: M = "Search...",
    closeOnClickOutside: S = !0,
    multiSelect: c = !1,
    portalTarget: R = typeof document < "u" ? document.body : null,
    ariaLabel: T,
    ariaLabelledBy: V,
    ariaDescribedBy: j,
    popupClassName: q
  } = y, f = H(null), g = k(
    () => v || `dropdown-${Math.random().toString(36).substring(2, 9)}`,
    [v]
  ), w = `${g}-listbox`, G = `${g}-search`, b = `${g}-menu`, [d, $] = E(!1), [D] = E(y.theme ?? "default"), s = k(() => {
    if (n === void 0)
      return [];
    if (c && Array.isArray(n))
      return r.filter(
        (e) => n.some(
          (o) => JSON.stringify(o) === JSON.stringify(e.value)
        )
      );
    {
      const e = r.find(
        (o) => JSON.stringify(o.value) === JSON.stringify(n)
      );
      return e ? [e] : [];
    }
  }, [n, r, c]), J = () => {
    $((e) => !e);
  }, h = () => {
    $(!1);
  }, K = (e) => {
    if (!e.disabled)
      if (c) {
        const o = s.some(
          (p) => JSON.stringify(p.value) === JSON.stringify(e.value)
        );
        let u;
        o ? u = s.filter(
          (p) => JSON.stringify(p.value) !== JSON.stringify(e.value)
        ) : u = [...s, e], a && a(u.map((p) => p.value));
      } else
        a && a(e.value), h();
  };
  Q(() => {
    if (!S || !d) return;
    const e = (o) => {
      const u = document.getElementById(b);
      u && !u.contains(o.target) && f.current && !f.current.contains(o.target) && h();
    };
    return document.addEventListener("mousedown", e), () => {
      document.removeEventListener("mousedown", e);
    };
  }, [S, d, b]);
  const _ = () => {
    const e = [I({})];
    return O ? O(x, s, e) : s.length > 0 ? c ? /* @__PURE__ */ t(Z, { options: s, removeOption: K }) : /* @__PURE__ */ t(Y, { options: s }) : N ? N(x, i, e) : /* @__PURE__ */ t(ee, { placeholder: i });
  }, z = () => /* @__PURE__ */ t(
    U,
    {
      triggerRef: f,
      portalTarget: R,
      theme: D,
      dropdownMenuId: b,
      popupClassName: q,
      children: /* @__PURE__ */ t(
        W,
        {
          options: r,
          value: n,
          onChange: a || (() => {
          }),
          config: y,
          multiSelect: c,
          search: B,
          searchPlaceholder: M,
          listboxId: w,
          searchId: G,
          renderOption: L,
          renderNoResults: P,
          onClose: h,
          theme: D
        }
      )
    }
  );
  return /* @__PURE__ */ t(
    "div",
    {
      className: `dropdown-container ${A} ${l ? "disabled" : ""}`,
      style: C,
      children: [
        /* @__PURE__ */ t(
          "div",
          {
            ref: f,
            className: `dropdown-trigger ${d ? "open" : ""}`,
            role: "combobox",
            "aria-haspopup": "listbox",
            "aria-expanded": d,
            "aria-owns": w,
            "aria-controls": w,
            "aria-label": T,
            "aria-labelledby": V,
            "aria-describedby": j,
            tabIndex: l ? -1 : 0,
            onClick: l ? void 0 : J,
            onKeyDown: (e) => {
              l || !d && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") && (e.preventDefault(), J());
            },
            children: _()
          }
        ),
        d && z(),
        m && /* @__PURE__ */ t(
          "input",
          {
            type: "hidden",
            name: m,
            value: JSON.stringify(c ? s.map((e) => e.value) : s[0]?.value || "")
          }
        )
      ]
    }
  );
}
const ce = (r, n) => {
  F(/* @__PURE__ */ t(te, { ...n }), r);
};
export {
  te as Dropdown,
  ce as defineDropdown
};
