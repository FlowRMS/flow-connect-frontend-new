/* empty css                */
const d = (c, s, l = {}) => {
  const r = Object.values(s).reduce((e, t) => e + t, 0), o = Object.keys(s).sort((e, t) => s[t] - s[e]), a = l.maxItems ?? 5, u = o.slice(0, a), n = o.slice(a).reduce((e, t) => e + s[t], 0);
  return c(
    "ul",
    { class: "summary-percentage-content" },
    [
      ...u.map((e) => {
        const t = s[e], p = r > 0 ? Math.round(t / r * 100) : 0;
        return c(
          "li",
          { class: "summary-percentage-item" },
          `${e} (${t}) ${p}%`
        );
      }),
      ...n > 0 ? [
        c(
          "li",
          { class: "summary-percentage-item summary-percentage-others" },
          `Others (${n}) ${Math.round(
            n / r * 100
          )}%`
        )
      ] : []
    ]
  );
};
export {
  d as summaryHeaderRenderer
};
