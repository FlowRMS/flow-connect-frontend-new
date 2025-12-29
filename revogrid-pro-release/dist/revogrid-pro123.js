import { jsx as e } from "./revogrid-pro118.js";
import { createElement as S, Fragment as E } from "./revogrid-pro119.js";
import "./revogrid-pro204.js";
import { useDropdownService as I } from "./revogrid-pro205.js";
import { useRef as k, useEffect as K, useCallback as F } from "./revogrid-pro121.js";
function L({
  options: y,
  value: f,
  onChange: N,
  config: d,
  multiSelect: h,
  search: n,
  searchPlaceholder: c,
  listboxId: i,
  searchId: m,
  renderOption: v,
  renderNoResults: $,
  onClose: x,
  theme: o
}) {
  const r = k(null), t = k(null), {
    searchValue: u,
    focusedIndex: C,
    selectedOptions: D,
    filteredOptions: p,
    handleSelect: b,
    handleKeyDown: w,
    handleSearchChange: a,
    setFocusedIndex: s
  } = I(y, f, N, d, x);
  return K(() => {
    d.autoFocus && n && r.current ? r.current.focus() : d.autoFocus && t.current && t.current.focus();
  }, [d.autoFocus, n]), /* @__PURE__ */ e(
    "div",
    {
      className: "dropdown-listbox",
      "data-theme": o ?? "default",
      role: "listbox",
      id: i,
      "aria-multiselectable": h,
      tabIndex: -1,
      onKeyDown: (l) => {
        l.key === "Escape" ? x() : w(l);
      },
      children: [
        n && /* @__PURE__ */ e("div", { className: "dropdown-search", children: /* @__PURE__ */ e(
          "input",
          {
            ref: r,
            type: "text",
            id: m,
            className: `dropdown-search-input ${o ? `theme-${o}` : ""}`,
            placeholder: c,
            value: u,
            onChange: a,
            "aria-label": "Search options"
          }
        ) }),
        /* @__PURE__ */ e(
          O,
          {
            options: y,
            filteredOptions: p,
            searchValue: u,
            searchPlaceholder: c,
            search: n,
            multiSelect: h,
            focusedIndex: C,
            selectedOptions: D,
            listboxId: i,
            searchId: m,
            onSearchChange: a,
            onKeyDown: w,
            onSelect: b,
            onFocusChange: s,
            renderOption: v,
            renderNoResults: $,
            searchInputRef: r,
            dropdownListRef: t,
            theme: o
          }
        )
      ]
    }
  );
}
function O({
  options: y,
  filteredOptions: f,
  searchValue: N,
  searchPlaceholder: d,
  search: h,
  multiSelect: n,
  focusedIndex: c,
  selectedOptions: i,
  listboxId: m,
  searchId: v,
  onSearchChange: $,
  onKeyDown: x,
  onSelect: o,
  onFocusChange: r,
  renderOption: t,
  renderNoResults: u,
  searchInputRef: C,
  dropdownListRef: D,
  theme: p
}) {
  const b = F(
    (a) => i.some(
      (s) => JSON.stringify(s.value) === JSON.stringify(a.value)
    ),
    [i]
  ), w = F(
    (a, s) => {
      const l = b(a), g = c === s;
      return /* @__PURE__ */ e(
        "li",
        {
          role: "option",
          "aria-selected": l,
          "aria-disabled": a.disabled,
          tabIndex: -1,
          className: `dropdown-option ${l ? "selected" : ""} ${g ? "focused" : ""} ${a.disabled ? "disabled" : ""} ${p ? `theme-${p}` : ""}`,
          onClick: () => o(a),
          onMouseEnter: () => r(s),
          children: t ? t(S, a, l) : /* @__PURE__ */ e("div", { className: "option-content", children: [
            n && /* @__PURE__ */ e(
              "input",
              {
                type: "checkbox",
                checked: l,
                readOnly: !0,
                tabIndex: -1,
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ e("span", { children: a.label })
          ] })
        },
        `${a.label}-${s}`
      );
    },
    [
      c,
      o,
      b,
      n,
      t,
      r,
      p
    ]
  );
  return /* @__PURE__ */ e(E, { children: [
    h && /* @__PURE__ */ e("div", { className: "dropdown-search", children: /* @__PURE__ */ e(
      "input",
      {
        ref: C,
        type: "text",
        id: v,
        value: N,
        onChange: $,
        placeholder: d,
        "aria-controls": m,
        "aria-autocomplete": "list",
        autoComplete: "off"
      }
    ) }),
    /* @__PURE__ */ e(
      "ul",
      {
        ref: D,
        className: "dropdown-options",
        role: "presentation",
        children: f.length > 0 ? f.map(w) : /* @__PURE__ */ e("li", { className: "no-results", children: u ? u(S) : /* @__PURE__ */ e("span", { children: "No results found" }) })
      }
    )
  ] });
}
export {
  O as DropdownContent,
  L as DropdownPopupContent
};
