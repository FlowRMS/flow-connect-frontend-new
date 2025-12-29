class c {
  static calculateProgress(t) {
    if (!t.from || !t.to) return 0;
    const o = /* @__PURE__ */ new Date(), e = new Date(t.from), a = new Date(t.to);
    return Math.min(
      Math.max(
        (o.getTime() - e.getTime()) / (a.getTime() - e.getTime()),
        0
      ),
      1
    ) * 100;
  }
  static formatDate(t, o = {}) {
    if (!t || isNaN(t.getTime())) return "";
    const { showYear: e = !1, showMonth: a = !0 } = o, n = [];
    return a && n.push(t.toLocaleDateString("en-US", { month: "short" })), n.push(t.toLocaleDateString("en-US", { day: "numeric" })), e && n.push(t.toLocaleDateString("en-US", { year: "2-digit" })), n.join(" ");
  }
  static formatDateRange(t) {
    if (!t.from || !t.to) return "";
    const o = new Date(t.from), e = new Date(t.to);
    if (isNaN(o.getTime()) || isNaN(e.getTime()))
      return "";
    const a = o.getFullYear() === e.getFullYear(), n = o.getMonth() === e.getMonth() && a, r = this.formatDate(o, {
      showYear: !a,
      showMonth: !0
    }), s = this.formatDate(e, {
      showYear: !a,
      showMonth: !n
    });
    return `${r} - ${s}`;
  }
  static getDateRange(t) {
    return {
      start: new Date(t.from),
      end: new Date(t.to)
    };
  }
}
export {
  c as DateService
};
