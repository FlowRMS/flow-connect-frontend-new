const o = (t, n) => n ? (typeof t == "boolean" && (t = t.toString()), typeof t == "number" && (t = t.toString()), t || (t = ""), n ? (typeof t != "string" && (t = JSON.stringify(t)), n.has(t.toLocaleLowerCase())) : !0) : !0, r = (t, n) => !o(t, n);
r.extra = [];
export {
  r as notContains
};
