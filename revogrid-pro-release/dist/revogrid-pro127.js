function o(t, h) {
  const e = (h.thresholds ?? []).filter((s) => t >= s.value).sort((s, l) => l.value - s.value)[0];
  return e ? { [e.className]: !0 } : {};
}
export {
  o as getThresholdClasses
};
