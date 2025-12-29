import { TextEditor as m } from "@revolist/revogrid";
import { arrayRenderer as h } from "./revogrid-pro6.js";
const f = (t, n) => {
  const { model: a, column: r } = n, i = a[r.prop], e = r.multiColumn;
  return e ? i == null ? t("span", { class: "empty-value" }, "") : Array.isArray(i) ? i.length === 0 ? t("span", { class: "empty-array" }, "") : h((o, s) => {
    const d = e.renderers.find(
      ({ condition: u }) => u(s.value)
    )?.renderer || e.defaultRenderer;
    return d ? d(o, s) : o("span", {}, String(s.value));
  }, e.arrayOptions)(t, n) : (e.renderers.find(
    ({ condition: c }) => c(i)
  )?.renderer || e.defaultRenderer)?.(t, n) : t("span", {}, String(i));
};
class C {
  constructor(n, a, r) {
    this.data = n, this.saveCallback = a, this.closeCallback = r;
  }
  editorInstance = null;
  editCell;
  element;
  render(n) {
    const a = this.editCell?.val, r = this.data.column.multiColumn;
    if (!r)
      return "";
    const e = r.renderers.find(
      ({ condition: l }) => l(a)
    )?.editor || r.defaultEditor;
    return e ? b(e) ? this.editorInstance = new e(
      this.data,
      this.saveCallback,
      this.closeCallback
    ) : this.editorInstance = e(
      this.data,
      this.saveCallback,
      this.closeCallback
    ) : this.editorInstance = new m(this.data, this.saveCallback), this.editorInstance?.render(n);
  }
  getValue() {
    return this.editorInstance?.getValue?.() ?? this.editCell?.val;
  }
  beforeAutoSave(n) {
    return this.editorInstance?.beforeAutoSave?.(n) ?? !0;
  }
  beforeDisconnect() {
    this.editorInstance?.beforeDisconnect?.();
  }
  componentDidRender() {
    this.editorInstance && (this.editorInstance.element = this.element, this.editorInstance.componentDidRender?.());
  }
  disconnectedCallback() {
    this.editorInstance?.disconnectedCallback?.();
  }
}
const g = {
  cellTemplate: f,
  editor: C
};
function b(t) {
  return typeof t == "function" && typeof t.prototype == "object";
}
export {
  g as MultiColumn,
  b as isEditorCtrConstructible
};
