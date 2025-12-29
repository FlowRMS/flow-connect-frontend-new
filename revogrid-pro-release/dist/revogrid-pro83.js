const v = (u) => (l, e) => {
  if (typeof e.previousValue < "u" && e.previousValue !== e.value) {
    const o = e.value > e.previousValue ? "↑" : e.value < e.previousValue ? "↓" : "";
    return l(
      "div",
      {
        class: {
          "cell-flash": !0,
          up: e.value > e.previousValue,
          down: e.value < e.previousValue
        }
      },
      [l("span", {
        class: "cell-flash-arrow"
      }, o), (u?.(l, e) || e.value) ?? ""]
    );
  }
  return e.value;
};
export {
  v as cellFlashArrowTemplate
};
