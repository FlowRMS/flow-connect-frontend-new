function c(n = !1) {
  return { invalid: n };
}
const u = ({
  template: n,
  invalidProperties: r
} = {}) => ({
  // Add cell validation highlight
  cellProperties(...e) {
    const [{ value: t, column: i, model: o }] = e;
    if (!i.validate)
      return {};
    const s = !i.validate?.(t, o), l = s ? r?.(...e) || {} : {}, a = l.style || {};
    return delete l.style, {
      style: a,
      ...l,
      ...c(s)
    };
  },
  // Add the red triangle if the value is invalid
  cellTemplate(...e) {
    const [t, { value: i, column: o, model: s }] = e, l = n || ((v, { value: d }) => d), a = o.validationTooltip?.(i);
    return a ? t("div", { class: "validation-cell" }, [
      // Add the red triangle if the value is invalid
      t("div", {
        class: "validation-triangle",
        title: a,
        // Tooltip with the error message
        "data-tooltip": a,
        "tooltip-type": "error"
      }),
      // Display the actual cell value
      t("span", { class: "validation-value" }, l(...e))
    ]) : l(...e);
  }
});
export {
  c as invalidCellProps,
  u as validationRenderer
};
