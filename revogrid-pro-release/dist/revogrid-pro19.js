/* empty css                */
import { getThresholdClasses as o } from "./revogrid-pro127.js";
function i(t, r, s) {
  const e = Math.round(r), a = [];
  for (let n = 1; n <= s; n++)
    a.push(
      t("span", {
        class: n <= e ? "star filled-star" : "star empty-star"
      })
    );
  return a;
}
const m = (t, { value: r, column: s }) => {
  const e = s.maxStars ?? 5, a = i(t, Number(r), e);
  return t(
    "div",
    {
      class: {
        "rating-star-container": !0,
        ...o(Number(r), s)
      }
    },
    a
  );
};
export {
  m as ratingStarRenderer
};
