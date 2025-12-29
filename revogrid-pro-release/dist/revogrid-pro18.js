/* empty css                */
import { getThresholdClasses as l } from "./revogrid-pro127.js";
const n = (s, { value: e, column: r }) => {
  const t = a(e, r), o = l(Number(e), r);
  return s(
    "div",
    {
      class: {
        "badge-cell": !0,
        default: !t,
        ...o,
        rectangular: r.rectangular
      },
      style: t ? {
        backgroundColor: t.backgroundColor,
        color: t.color
      } : {}
    },
    String(e)
  );
};
function a(s, e) {
  return (e.badgeStyles || {})[s];
}
export {
  n as badgeRenderer
};
