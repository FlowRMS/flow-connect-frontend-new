import { jsx as a } from "./revogrid-pro118.js";
const u = ({
  dimensions: o,
  draggingItem: c,
  onDragStart: s,
  isSelected: t,
  onCheckboxChange: n
}) => /* @__PURE__ */ a("div", { className: "gap-1 flex flex-1 flex-col max-h-[40%]", children: /* @__PURE__ */ a("div", { className: "panel-card overflow-auto flex grow", children: /* @__PURE__ */ a("ul", { className: "w-full", children: o.map((e, p) => {
  const l = t(e.prop), f = "flex items-center gap-2 transition-colors ease-in-out " + (c && c.prop === e.prop ? "dragging" : "");
  return /* @__PURE__ */ a(
    "li",
    {
      className: f,
      draggable: !l,
      onDragStart: (r) => {
        l ? r.preventDefault() : s(p, e.prop);
      },
      children: [
        /* @__PURE__ */ a(
          "input",
          {
            type: "checkbox",
            checked: l,
            onChange: (r) => n(e.prop, r.currentTarget.checked)
          }
        ),
        /* @__PURE__ */ a("span", { children: e.name ?? e.prop })
      ]
    },
    p
  );
}) }) }) });
export {
  u as DimensionsPanel
};
