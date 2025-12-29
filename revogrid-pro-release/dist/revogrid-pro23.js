/* empty css                */
import o from "./revogrid-pro191.js";
import i from "./revogrid-pro192.js";
import r from "./revogrid-pro193.js";
import t from "./revogrid-pro194.js";
function l(n, e) {
  switch (e) {
    case "id":
      return n("span", { class: "column-icon key-icon", title: "ID", innerHTML: o });
    case "integer":
      return n("span", { class: "column-icon integer-icon", title: "Integer", innerHTML: r });
    case "currency":
      return n("span", { class: "column-icon currency-icon", title: "Currency", innerHTML: r });
    case "boolean":
      return n("span", { class: "column-icon decimal-icon", title: "Decimal", innerHTML: t });
    default:
      return n("span", { class: "column-icon string-icon", title: "String", innerHTML: i });
  }
}
const y = (n, e) => {
  const c = e.columnType || "default";
  return n("div", { class: "column-type-container" }, [
    l(n, c),
    n("span", { class: "column-label" }, e.name || "")
  ]);
};
export {
  y as columnTypeRenderer
};
