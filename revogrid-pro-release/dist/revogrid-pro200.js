import { h as s } from "@revolist/revogrid";
const j = ({
  min: _,
  max: x,
  fromValue: R,
  toValue: I,
  showTooltips: o = !1,
  showRangeDisplay: T = !1,
  onRangeChange: y,
  formatValue: S = (r) => r !== void 0 ? r % 1 === 0 ? r.toString() : r.toFixed(2) : ""
}) => {
  let r, n, i, l;
  const p = Math.round(Number(_) * 100), v = Math.round(Number(x) * 100), O = Math.round(Number(R) * 100), E = Math.round(Number(I) * 100), N = (e, t) => {
    const c = parseInt(e.value, 10) / 100, d = parseInt(t.value, 10) / 100;
    return [c, d];
  }, C = (e, t) => {
    const c = Number(e.value) / 100, d = S(c);
    t.textContent = d;
    const u = (Number(e.value) - p) / (v - p) * 100, m = t.parentElement?.getBoundingClientRect(), a = t.getBoundingClientRect();
    if (m && a) {
      const g = m.width - a.width, P = u / 100 * (m.width - a.width), V = Math.min(Math.max(8, P), g);
      t.style.left = `${V}px`;
    } else
      t.style.left = `${u}%`;
    t.style.opacity = "1";
  }, h = (e) => {
    e.style.opacity = "0";
  }, L = (e, t, c) => {
    const d = getComputedStyle(c), u = d.getPropertyValue("--slider-color").trim() || "#C6C6C6", m = d.getPropertyValue("--range-color").trim() || "#25daa5", a = parseInt(t.max, 10) - parseInt(t.min, 10), F = parseInt(e.value, 10) - parseInt(e.min, 10), g = parseInt(t.value, 10) - parseInt(t.min, 10);
    c.style.background = `linear-gradient(
        to right,
        ${u} 0%,
        ${u} ${F / a * 100}%,
        ${m} ${F / a * 100}%,
        ${m} ${g / a * 100}%, 
        ${u} ${g / a * 100}%, 
        ${u} 100%)`;
  }, $ = (e) => {
    n && (Number(e.value) <= 0 ? n.style.zIndex = "2" : n.style.zIndex = "0");
  }, M = () => {
    if (!r || !n) return;
    const [e, t] = N(r, n);
    L(r, n, n), e > t && (r.value = n.value), o && i && C(r, i), y({ fromValue: e, toValue: t });
  }, b = () => {
    if (!r || !n) return;
    const [e, t] = N(r, n);
    L(r, n, n), $(n), e <= t ? n.value = String(Math.round(t * 100)) : n.value = r.value, o && l && C(n, l), y({ fromValue: e, toValue: t });
  }, A = [];
  T && A.push(
    s("div", { className: "range-values" }, [
      s("span", null, S(R)),
      s("span", null, S(I))
    ])
  );
  const f = [];
  return o && f.push(
    s("div", {
      className: "slider-tooltip",
      ref: (e) => i = e
    })
  ), f.push(
    s("input", {
      ref: (e) => {
        r = e, e && (e.value = String(O));
      },
      className: "fromSlider",
      type: "range",
      value: String(O),
      min: p,
      max: v,
      onInput: M,
      onMouseOver: () => o && i && C(r, i),
      onMouseOut: () => o && i && h(i)
    })
  ), o && f.push(
    s("div", {
      className: "slider-tooltip",
      ref: (e) => l = e
    })
  ), f.push(
    s("input", {
      ref: (e) => {
        n = e, e && (e.value = String(E));
      },
      className: "toSlider",
      type: "range",
      value: String(E),
      min: p,
      max: v,
      onInput: b,
      onMouseOver: () => o && l && C(n, l),
      onMouseOut: () => o && l && h(l)
    })
  ), A.push(s("div", { className: "sliders_control" }, f)), s("div", { className: "range_container" }, A);
};
export {
  j as RangeSlider
};
