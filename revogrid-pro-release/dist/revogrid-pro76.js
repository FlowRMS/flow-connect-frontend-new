import { GROUP_DEPTH as l, isGrouping as p, GROUP_COLUMN_PROP as I, expandSvgIconVNode as y } from "@revolist/revogrid";
function P({
  store: t,
  itemIndex: e,
  currentDepth: g,
  columnProp: a,
  aggregator: i
}) {
  const s = t.get("items"), n = t.get("proxyItems"), r = t.get("source"), o = s[e], d = n.indexOf(o);
  let u = 0;
  const x = [];
  for (let m = d + 1; m < n.length; m++) {
    const c = r[n[m]];
    if (typeof c[l] == "number" && c[l] <= g)
      break;
    p(c) || (u++, x.push(c));
  }
  const f = i ? i(x) : u;
  return { count: u, values: x, aggregationValue: f };
}
const v = (t, e, g) => {
  const a = e.model?.[l];
  if (typeof a > "u")
    return e.name;
  const i = e.providers.data, s = e.model?.[I] ?? "", n = g?.[s], { aggregationValue: r } = P({
    store: i,
    itemIndex: e.itemIndex,
    currentDepth: a,
    columnProp: s,
    aggregator: n
  }), o = y(e.expanded);
  o.$attrs$.width = "9px", o.$attrs$.height = "9px";
  const d = t(
    "span",
    {
      style: {
        fontSize: "10px"
      }
    },
    `(${r})`
  );
  return t(
    "div",
    {
      class: "flex items-center gap-1",
      style: {
        paddingLeft: "10px"
      }
    },
    [o, `${e.name}`, d]
  );
};
export {
  P as getGroupingData,
  v as groupingAggregation
};
