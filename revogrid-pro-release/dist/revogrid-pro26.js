/* empty css                */
const c = (e, t, a = {}) => {
  const s = Object.values(t).reduce((g, l, o) => g + l * o, 0), r = Object.values(t).length;
  return e(
    "div",
    { class: "summary-aggregate-content" },
    [
      a.showSum ? e(
        "div",
        { class: "summary-aggregate-item" },
        `SUM: ${s}`
      ) : null,
      a.showAvg ? e(
        "div",
        { class: "summary-aggregate-item" },
        `AVG: ${(r > 0 ? s / r : 0).toFixed(2)}`
      ) : null
    ].filter(Boolean)
    // Remove nulls if options are not set
  );
};
export {
  c as summaryAggregateRenderer
};
