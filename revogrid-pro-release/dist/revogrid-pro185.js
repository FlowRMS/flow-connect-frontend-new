import { getItemByPosition as n } from "@revolist/revogrid";
function e(t, { yOffset: o, gridRect: r }) {
  return t - r.top - o;
}
function c(t, o) {
  return n(o.rows, e(t, o));
}
function s({ y: t }, o) {
  const r = n(o.rows, e(t, o));
  return { x: n(o.cols, 0).itemIndex, y: r.itemIndex };
}
export {
  s as getCell,
  c as getRow,
  e as getTopRelative
};
