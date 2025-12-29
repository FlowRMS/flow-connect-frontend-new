const f = "date", h = [
  "equals",
  "before",
  "after",
  "onOrBefore",
  "onOrAfter",
  "between",
  "notEqual",
  "isEmpty",
  "isNotEmpty",
  "today",
  "yesterday",
  "last7Days",
  "thisMonth",
  "lastMonth",
  "thisQuarter",
  "nextQuarter",
  "previousQuarter",
  "thisYear",
  "nextYear",
  "previousYear"
];
function d() {
  const e = /* @__PURE__ */ new Date();
  return e.setHours(0, 0, 0, 0), e;
}
function g() {
  const e = /* @__PURE__ */ new Date();
  return e.setDate(e.getDate() - 1), e.setHours(0, 0, 0, 0), e;
}
function w() {
  const e = /* @__PURE__ */ new Date();
  return e.setDate(1), e.setHours(0, 0, 0, 0), e;
}
function i() {
  const e = /* @__PURE__ */ new Date();
  return e.setMonth(e.getMonth() - 1), e.setDate(1), e.setHours(0, 0, 0, 0), e;
}
function u() {
  const e = /* @__PURE__ */ new Date(), n = Math.floor(e.getMonth() / 3) * 3;
  return e.setMonth(n), e.setDate(1), e.setHours(0, 0, 0, 0), e;
}
function c() {
  const e = /* @__PURE__ */ new Date();
  return e.setMonth(0), e.setDate(1), e.setHours(0, 0, 0, 0), e;
}
function D(e, n) {
  if (!n || !n.operator || !e && n.operator === "isEmpty")
    return !0;
  if (!e && n.operator === "isNotEmpty" || !e)
    return !1;
  const r = new Date(e), s = d(), o = g();
  switch (n.operator) {
    case "equals":
      return n.fromDate ? r.toDateString() === new Date(n.fromDate).toDateString() : !0;
    case "before":
      return n.fromDate ? r < new Date(n.fromDate) : !0;
    case "after":
      return n.fromDate ? r > new Date(n.fromDate) : !0;
    case "onOrBefore":
      return n.fromDate ? r <= new Date(n.fromDate) : !0;
    case "onOrAfter":
      return n.fromDate ? r >= new Date(n.fromDate) : !0;
    case "notEqual":
      return n.fromDate ? r.toDateString() !== new Date(n.fromDate).toDateString() : !0;
    case "today":
      return r >= s && r < new Date(s.getTime() + 1440 * 60 * 1e3);
    case "between":
      return !n.fromDate || !n.toDate ? !0 : r >= new Date(n.fromDate) && r <= new Date(n.toDate);
    case "yesterday":
      return r >= o && r < s;
    case "last7Days": {
      const t = /* @__PURE__ */ new Date();
      return t.setDate(t.getDate() - 7), r >= t && r <= s;
    }
    case "thisMonth":
      return r >= w() && r <= /* @__PURE__ */ new Date();
    case "lastMonth": {
      const t = i(), a = new Date(t);
      return a.setMonth(a.getMonth() + 1), r >= t && r < a;
    }
    case "thisQuarter": {
      const t = u(), a = new Date(t);
      return a.setMonth(a.getMonth() + 3), r >= t && r < a;
    }
    case "nextQuarter": {
      const t = u();
      t.setMonth(t.getMonth() + 3);
      const a = new Date(t);
      return a.setMonth(a.getMonth() + 3), r >= t && r < a;
    }
    case "previousQuarter": {
      const t = u();
      t.setMonth(t.getMonth() - 3);
      const a = new Date(t);
      return a.setMonth(a.getMonth() + 3), r >= t && r < a;
    }
    case "thisYear": {
      const t = c(), a = new Date(t);
      return a.setFullYear(a.getFullYear() + 1), r >= t && r < a;
    }
    case "nextYear": {
      const t = c();
      t.setFullYear(t.getFullYear() + 1);
      const a = new Date(t);
      return a.setFullYear(a.getFullYear() + 1), r >= t && r < a;
    }
    case "previousYear": {
      const t = c();
      t.setFullYear(t.getFullYear() - 1);
      const a = new Date(t);
      return a.setFullYear(a.getFullYear()), r >= t && r < a;
    }
    default:
      return !0;
  }
}
function M(e) {
  switch (e) {
    case "equals":
    case "before":
    case "after":
    case "onOrBefore":
    case "onOrAfter":
    case "notEqual":
      return "datepicker";
    case "between":
      return ((n, r) => {
        let { fromDate: s, toDate: o } = r.value;
        return n("div", {
          class: "flex flex-row gap-2"
        }, [
          n("input", {
            type: "date",
            placeholder: "From",
            onInput: (t) => {
              t.target instanceof HTMLInputElement && (s = t.target.value, r.onInput({
                fromDate: t.target.value,
                toDate: o
              }));
            }
          }),
          n("input", {
            type: "date",
            placeholder: "To",
            onInput: (t) => {
              t.target instanceof HTMLInputElement && (o = t.target.value, r.onInput({
                fromDate: s,
                toDate: o
              }));
            }
          })
        ]);
      });
    default:
      return;
  }
}
const O = h.reduce(
  (e, n) => {
    const r = function(s, o) {
      return n === "between" ? D(s, {
        operator: n,
        ...o
      }) : D(s, {
        operator: n,
        fromDate: o
      });
    };
    return r.extra = M(n), e[n] = {
      columnFilterType: f,
      name: n,
      func: r
    }, e;
  },
  {}
);
export {
  O as DATE_FILTERS,
  h as filterOperators,
  M as getExtraByOperator,
  i as getStartOfLastMonth,
  w as getStartOfThisMonth,
  u as getStartOfThisQuarter,
  c as getStartOfThisYear,
  d as getStartOfToday,
  g as getStartOfYesterday
};
