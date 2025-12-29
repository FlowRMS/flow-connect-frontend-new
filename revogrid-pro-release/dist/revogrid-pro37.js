class l {
  validate = (e) => e >= 0 && e <= 100;
  cellTemplate = (e, r) => {
    if (!(!r.value || !parseInt(r.value, 10)))
      return e(
        "div",
        {
          class: {
            "progress-container": !0
          }
        },
        e(
          "div",
          {
            class: "progress-bar"
          },
          e("div", {
            class: "progress-fill",
            style: {
              width: `${parseInt(r.value, 10)}%`
            }
          })
        )
      );
  };
}
export {
  l as ProgressColumnType
};
