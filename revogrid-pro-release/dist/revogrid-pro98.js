import { jsx as r } from "./revogrid-pro118.js";
const o = ({ value: t, aggregators: a, onUpdateValue: l }) => /* @__PURE__ */ r(
  "select",
  {
    className: "badge",
    value: t,
    onChange: (e) => l(e.currentTarget.value),
    children: a.map((e) => /* @__PURE__ */ r("option", { value: e, children: e }, e))
  }
);
export {
  o as ValueSelector
};
