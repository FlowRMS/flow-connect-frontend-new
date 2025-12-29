import { useState as h, useEffect as A, useMemo as x, useCallback as O } from "./revogrid-pro121.js";
const E = (s, r) => s.label.toLowerCase().includes(r.toLowerCase()), I = (s, r, a) => {
  if (a === "none") return 0;
  const o = s.label.localeCompare(r.label);
  return a === "asc" ? o : -o;
};
function T(s, r, a, o = {}, g) {
  const {
    search: J = !1,
    filterFunction: N = E,
    sortDirection: v = "none",
    sortFunction: b = I,
    multiSelect: d = !1,
    autocomplete: w = !1
  } = o, [S, D] = h(""), [i, y] = h(-1), [l, f] = h([]);
  A(() => {
    if (r === void 0) {
      f([]);
      return;
    }
    if (d && Array.isArray(r)) {
      const e = s.filter(
        (t) => r.some(
          (n) => JSON.stringify(n) === JSON.stringify(t.value)
        )
      );
      f(e);
    } else {
      const e = s.find(
        (t) => JSON.stringify(t.value) === JSON.stringify(r)
      );
      f(e ? [e] : []);
    }
  }, [r, s, d]);
  const c = x(() => {
    let e = [...s];
    return J && S && (e = e.filter((t) => N(t, S))), v !== "none" && e.sort((t, n) => b(t, n, v)), e;
  }, [
    s,
    J,
    S,
    N,
    v,
    b
  ]), m = O(
    (e) => {
      if (!e.disabled)
        if (d) {
          const t = l.some(
            (u) => JSON.stringify(u.value) === JSON.stringify(e.value)
          );
          let n;
          t ? n = l.filter(
            (u) => JSON.stringify(u.value) !== JSON.stringify(e.value)
          ) : n = [...l, e], f(n), a(n.map((u) => u.value)), w && D("");
        } else
          f([e]), a(e.value), g && g();
    },
    [d, l, a, w, g]
  ), p = O(
    (e) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          break;
        case "ArrowDown":
          e.preventDefault(), y(
            (t) => t < c.length - 1 ? t + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault(), y(
            (t) => t > 0 ? t - 1 : c.length - 1
          );
          break;
        case "Enter":
        case " ":
          e.preventDefault(), i >= 0 && i < c.length && m(c[i]);
          break;
      }
    },
    [c, i, m]
  ), k = O(
    (e) => {
      const t = e.currentTarget.value;
      D(t), y(-1);
    },
    []
  ), F = O(
    (e) => l.some(
      (t) => JSON.stringify(t.value) === JSON.stringify(e.value)
    ),
    [l]
  );
  return {
    // State
    searchValue: S,
    focusedIndex: i,
    selectedOptions: l,
    filteredOptions: c,
    // Actions
    handleSelect: m,
    handleKeyDown: p,
    handleSearchChange: k,
    isOptionSelected: F,
    setFocusedIndex: y
  };
}
export {
  T as useDropdownService
};
