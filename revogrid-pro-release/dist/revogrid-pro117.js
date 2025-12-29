import { h as o } from "@revolist/revogrid";
const i = "rv-context-menu", r = (s, n, e, t) => [
  ...s.icon ? [o("span", { class: { [s.icon]: !0, icon: !0 } })] : [],
  o(
    "span",
    null,
    typeof s.name == "function" ? s.name(n, e) : s.name
  )
];
function d() {
  const s = this.config?.items.filter((e) => !(typeof e.hidden == "function" ? e.hidden(
    e,
    this.providers.selection.focused,
    this.providers.selection.selectedRange
  ) : e.hidden)).map((e, t) => o(
    "li",
    {
      key: t,
      class: {
        [e.class || ""]: !0,
        [typeof e.rowClass == "function" ? e.rowClass(
          e,
          this.providers.selection.focused,
          this.providers.selection.selectedRange
        ) : e.rowClass || ""]: !0
      },
      onClick: (c) => {
        e.action?.(
          c,
          this.providers.selection.focused,
          this.providers.selection.selectedRange,
          this.close
        ), e.keepOpen || this.close();
      }
    },
    e.template ? e.template(
      o,
      e,
      this.providers.selection.focused,
      this.providers.selection.selectedRange,
      this.close
    ) : r(
      e,
      this.providers.selection.focused,
      this.providers.selection.selectedRange,
      this.close
    )
  )) ?? [], n = o("ul", null, s);
  return o(
    "div",
    {
      class: { [i]: !0 },
      ref: (e) => {
        this.contextMenu = e;
      }
    },
    n
  );
}
export {
  i as POP_EL,
  d as contextPopUp
};
