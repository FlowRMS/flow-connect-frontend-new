import { h as p } from "@revolist/revogrid";
import { FIlTER_SELECTION as d, FIlTER_QUICK_SEARCH as y, FIlTER_SLIDER as f } from "./revogrid-pro89.js";
import { defineList as E } from "./revogrid-pro199.js";
import { RangeSlider as R } from "./revogrid-pro200.js";
const x = (s, {
  multiFilterItems: a,
  dataStores: h,
  config: n = {},
  change: u
}) => {
  const c = [];
  if (s.filterTypes?.[d]) {
    const o = s.prop ?? "", t = a[o] = a[o] ?? [];
    let r = t.find((e) => e.type === d), l = t.find((e) => e.type === y);
    r || (r = {
      id: t.length,
      type: d,
      value: /* @__PURE__ */ new Set(),
      relation: "and",
      hidden: !0
    }, t.push(r)), l || (l = {
      id: t.length,
      type: y,
      value: "",
      relation: "and",
      hidden: !0
    }, t.push(l)), c.push(
      p(
        "span",
        null,
        n.localization?.captions?.selectionTitle ?? "Select values"
      ),
      p("div", {
        ref: (e) => {
          e && E(e, {
            columnProp: o,
            dataProvider: h,
            exclude: r?.value,
            search: l?.value,
            filter: (i) => {
              r.value = i, u(a);
            },
            quickFilter: (i) => {
              l.value = i, u(a);
            },
            sortDirection: n.selection?.sortDirection ?? "asc"
          });
        }
      })
    );
  }
  if (s.filterTypes?.[f]) {
    const o = s.prop ?? "", t = a[o] = a[o] ?? [];
    let r = 0, l = 0;
    Object.entries(h).forEach(([i, { store: T }]) => {
      T.get("source").forEach((v) => {
        r = Math.max(r, v[o] ?? 0), l = Math.min(l, v[o] ?? 0);
      });
    });
    let e = t.find((i) => i.type === f);
    e || (e = {
      id: t.length,
      type: f,
      value: {
        fromValue: l,
        toValue: r
      },
      relation: "and",
      hidden: !0
    }, t.push(e)), c.push(
      p(
        "span",
        null,
        n.localization?.captions?.sliderTitle ?? "Select range"
      ),
      p(R, {
        min: l,
        fromValue: e?.value?.fromValue ?? l,
        toValue: e?.value?.toValue ?? r,
        max: r,
        showTooltips: n.slider?.showTooltips ?? !0,
        showRangeDisplay: n.slider?.showRangeDisplay ?? !0,
        formatValue: n.slider?.formatValue,
        onRangeChange: (i) => {
          e.value = i, u(a);
        }
      })
    );
  }
  return p(
    "div",
    {
      class: { filter: !0 },
      slot: "header"
    },
    c
  );
};
export {
  x as popUpContent
};
