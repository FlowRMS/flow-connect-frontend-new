const u = (l, t, k) => {
  const s = t.column.link || {}, {
    target: n = "_blank",
    showProtocol: i = !1,
    className: o = "",
    style: c = {},
    preventDefault: r = !1
  } = s, e = t.value || "";
  let a = e;
  !i && e && (a = e.replace(/^(https?:\/\/|ftp:\/\/|mailto:|tel:)/i, ""));
  const f = (p) => {
    r && (p.preventDefault(), window.open(e, n));
  };
  return e ? l("a", {
    href: e,
    target: n,
    class: o,
    style: c,
    onClick: f
  }, a) : l("span", { class: "empty-link" }, "");
};
export {
  u as linkRenderer
};
