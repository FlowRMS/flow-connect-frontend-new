import { getCellDataParsed as g } from "@revolist/revogrid";
function b(t) {
  return t ?? ((e, { model: r, column: n }) => g(r, n));
}
function x(t) {
  return t ?? ((e, r) => r.name);
}
function _(...t) {
  return ((...e) => (e[1] = {
    ...e[1]
  }, e[0]("div", { class: "flex cell-wrapper" }, t.map((r) => r(...e)))));
}
function u(t) {
  return t ? typeof t == "string" ? t.split(" ").reduce((e, r) => ({ ...e, [r.trim()]: !0 }), {}) : t : {};
}
function l(t) {
  return t ? typeof t == "string" ? t.split(";").reduce((e, r) => {
    const [n, s] = r.split(":").map((i) => i.trim());
    if (n && s) {
      const i = n.replace(/-([a-z])/g, (o) => o[1].toUpperCase());
      return { ...e, [i]: s };
    }
    return e;
  }, {}) : t : {};
}
function h(...t) {
  return (...e) => t.reduce((r, n) => {
    const s = n?.(...e) || {}, i = u(r.class), o = u(s.class), c = { ...i, ...o }, a = l(r.style), f = l(s.style), p = { ...a, ...f }, m = {
      ...Object.keys(c).length > 0 ? { class: c } : {},
      ...Object.keys(p).length > 0 ? { style: p } : {}
    }, { class: d, style: A, ...y } = s;
    return {
      ...r,
      ...y,
      ...m
    };
  }, {});
}
function z(t, e) {
  const r = e.replace(/-([a-z])/g, (s) => s[1].toUpperCase()), n = t.getAttribute(e) || t.getAttribute(r);
  return C(n || void 0);
}
function C(t) {
  if (!t) return [];
  if (Array.isArray(t))
    return t.map((e) => e.toString());
  try {
    const e = JSON.parse(t);
    return Array.isArray(e) ? e.map((r) => r.toString()) : [];
  } catch {
    return t.split(",").map((r) => r.trim());
  }
}
export {
  x as defaultColumnTemplate,
  b as defaultTemplate,
  _ as extendTemplates,
  z as getColumnAttribute,
  h as mergeCellProperties,
  C as parseColumnAttribute
};
