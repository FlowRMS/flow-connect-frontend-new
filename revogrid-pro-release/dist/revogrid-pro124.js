import { jsx as o } from "./revogrid-pro118.js";
import r from "./revogrid-pro189.js";
/* empty css                */
import { ignoreCellEvents as l } from "./revogrid-pro81.js";
const s = ({
  onClick: t,
  locale: e = {
    title: "Remove",
    ariaLabel: "Remove"
  }
}) => /* @__PURE__ */ o(
  "button",
  {
    ...l,
    onClick: t,
    type: "button",
    title: e.title,
    "aria-label": e.ariaLabel,
    className: "rounded-lg flex focus:outline-none remove-btn",
    dangerouslySetInnerHTML: { __html: r }
  }
);
export {
  s as DeleteButton
};
