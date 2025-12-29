import { EXPAND_ICON as d } from "./revogrid-pro39.js";
const f = (l, s) => function(...r) {
  const [t, c] = r, { model: o } = c, n = s(o), a = n.level, i = n.hasChildren, p = n.expanded, g = i ? t(
    "button",
    {
      onMouseDown: (e) => {
        e.preventDefault();
      },
      onDblClick: (e) => {
        e.preventDefault();
      },
      onClick: (e) => {
        e.preventDefault(), l(o);
      },
      class: "tree-toggle",
      expanded: p,
      style: {
        cursor: "pointer",
        marginRight: "5px",
        userSelect: "none"
      }
    },
    d
  ) : t("span", { style: { marginRight: "15px" } }, []);
  return t(
    "div",
    {
      class: "overflow-hidden",
      style: {
        marginLeft: `${a * 20}px`,
        display: "flex",
        alignItems: "center"
      }
    },
    g
  );
};
export {
  f as TreeCellTemplate
};
