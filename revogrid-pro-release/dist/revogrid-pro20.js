/* empty css                */
function c(t, n, i) {
  const e = i.timelineRange ?? { start: 0, end: 100 }, s = e.end - e.start;
  return n.map((r, a) => {
    const l = (r.start - e.start) / s * 100, o = (r.end - r.start) / s * 100;
    return t("div", {
      class: "timeline-event-bar",
      style: {
        left: `${l}%`,
        width: `${o}%`,
        position: "absolute"
      },
      title: r.label || "",
      // Tooltip for the event
      key: a
      // Ensure unique key for each bar
    });
  });
}
const m = (t, { value: n, column: i }) => {
  const e = Array.isArray(n) ? n : [];
  return t(
    "div",
    { class: "timeline-container" },
    [
      t("div", { class: "timeline-bar" }, []),
      // Background bar
      ...c(t, e, i)
      // Dynamic event bars
    ]
  );
};
export {
  m as timelineRenderer
};
