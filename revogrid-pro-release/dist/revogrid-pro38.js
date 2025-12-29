class r {
  validate = (e) => e >= 0 && e <= 5;
  cellTemplate = (e, l) => {
    if (!(!l.value || !parseInt(l.value, 10)))
      return new Array(parseInt(l.value, 10)).fill("★").map((t) => e("span", { class: "star", style: { opacity: 0.8 } }, t));
  };
}
export {
  r as RatingColumnType
};
