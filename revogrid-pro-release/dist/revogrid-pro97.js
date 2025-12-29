import { jsx as e } from "./revogrid-pro118.js";
import { useState as N } from "./revogrid-pro121.js";
import { DeleteButton as O } from "./revogrid-pro124.js";
const I = ({
  title: n,
  panel: c,
  items: t,
  dimensions: d,
  placeholder: i = "Drag here",
  i18n: l,
  renderItem: g,
  onRemove: D,
  onDrop: h,
  onDragOver: v,
  onDragEnter: u,
  onItemDragStart: f
}) => {
  const [p, o] = N(!1), s = t.length === 0;
  return /* @__PURE__ */ e("div", { children: [
    /* @__PURE__ */ e("div", { className: "zone-title text-sm font-semibold", children: n }),
    /* @__PURE__ */ e(
      "ul",
      {
        className: `min-h-[3rem] overflow-auto grow panel-card ${s ? "empty" : ""} ${p ? "drag-over" : ""}`,
        onDrop: () => {
          o(!1), h(c);
        },
        onDragOver: (r) => {
          r.preventDefault(), o(!0), v(r);
        },
        onDragLeave: () => {
          o(!1);
        },
        onDragEnter: u,
        children: s ? /* @__PURE__ */ e("li", { className: "empty", children: i }) : t.map((r, a) => {
          const m = d[r];
          return /* @__PURE__ */ e(
            "li",
            {
              className: "flex items-center gap-2 rounded-md transition-colors ease-in-out",
              draggable: !0,
              onDragStart: () => f(a, r),
              children: [
                /* @__PURE__ */ e("span", { className: "flex grow", children: g?.(a, m) ?? m?.name ?? r }),
                /* @__PURE__ */ e(O, { onClick: () => D(a), locale: {
                  title: l.remove,
                  ariaLabel: l.remove
                } })
              ]
            },
            `${n}-${a}`
          );
        })
      }
    )
  ] });
};
export {
  I as DropZone
};
