function n(e) {
  if (typeof e == "boolean")
    return e;
  if (typeof e == "number")
    return e === 1;
  if (typeof e == "string") {
    const r = e.trim().toLowerCase();
    if (["true", "yes", "1"].includes(r))
      return !0;
    if (["false", "no", "0"].includes(r))
      return !1;
  }
}
export {
  n as parseBoolean
};
