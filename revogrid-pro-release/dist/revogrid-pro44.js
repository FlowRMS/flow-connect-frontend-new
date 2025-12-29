import { timeout as l, isEnterKeyValue as s, isTab as n } from "@revolist/revogrid";
class r {
  constructor(e, i) {
    this.data = e, this.saveCallback = i;
  }
  element;
  editCell;
  /**
   * Lifecycle method triggered after the editor is rendered.
   * Automatically focuses the textarea.
   */
  async componentDidRender() {
    await l(), this.element?.focus(), this.element?.select();
  }
  onKeyDown(e) {
    const i = s(e.key), t = n(e.key);
    (t || i && !e.shiftKey) && e.target && this.saveCallback && !e.isComposing && (this.beforeDisconnect(), this.saveCallback(this.getValue(), t));
  }
  /**
   * IMPORTANT: Prevent scroll glitches when editor is closed and focus is on current input element.
   */
  beforeDisconnect() {
    this.element?.blur();
  }
  getValue() {
    return this.element?.value;
  }
  /**
   * Render method for the TextAreaEditor.
   * Creates a textarea element with initial cell value, handles input events, and saves changes on blur.
   */
  render(e) {
    let i = this.editCell?.val ?? "";
    return this.editCell && (i = (this.editCell.model || {})[this.editCell.prop] ?? this.editCell.val ?? ""), e("textarea", {
      value: i,
      style: {
        width: "100%",
        height: "100%",
        resize: "none"
      },
      ref: (t) => {
        this.element = t;
      },
      // listen to keydown event on input element
      onKeyDown: (t) => this.onKeyDown(t)
    });
  }
}
export {
  r as TextAreaEditor
};
