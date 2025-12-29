/* empty css                */
/* empty css                */
import "@revolist/revogrid";
import { parseBoolean as r } from "./revogrid-pro86.js";
function u(t, e = !1) {
  return e ? t("div", { class: "thumb thumb-up", title: "True" }, "👍") : t("div", { class: "thumb thumb-down", title: "False" }, "👎");
}
const o = (t, { value: e }) => t("div", { class: "thumb-cell" }, [u(t, r(e))]);
export {
  o as thumbsRenderer
};
