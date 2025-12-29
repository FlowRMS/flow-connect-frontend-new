import { jsx as g } from "./revogrid-pro118.js";
import { createPortal as x } from "./revogrid-pro204.js";
import { useRef as v, useState as P, useEffect as $ } from "./revogrid-pro121.js";
function W({
  triggerRef: n,
  children: f,
  portalTarget: s,
  theme: a,
  dropdownMenuId: w,
  popupClassName: m
}) {
  const i = v(null), [r, d] = P({
    top: 0,
    left: 0,
    display: "none"
  });
  $(() => {
    if (n.current) {
      const t = n.current.getBoundingClientRect(), h = window.innerHeight, p = window.innerWidth;
      let e = t.top + window.scrollY + t.height, o = t.left;
      d({ top: e, left: o, display: "flex" });
      const y = setTimeout(() => {
        if (!i.current) return;
        const { height: u, width: c } = i.current.getBoundingClientRect();
        e + u > h && (e = t.top - u + window.scrollY), o + c > p && (o = p - c - 5), d({ top: e, left: o, display: "flex" });
      }, 0);
      return () => clearTimeout(y);
    }
  }, [n]);
  const l = /* @__PURE__ */ g(
    "div",
    {
      ref: i,
      id: w,
      className: `revo-dropdown-menu ${m || ""}`,
      "data-theme": a ?? "default",
      style: {
        top: `${r.top}px`,
        left: `${r.left}px`,
        display: r.display
      },
      children: f
    }
  );
  return s ? x(l, s) : l;
}
export {
  W as DropdownPopup
};
