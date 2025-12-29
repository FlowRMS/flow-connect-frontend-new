import { ADDITIONAL_DATA_EVENT as l, ON_EDIT_EVENT as u, BEFORE_HIST_EDIT_EVENT as o, BEFORE_KEYDOWN_EVENT as S, BEFORE_UNDO_EVENT as k, FLASH_CELL_EVENT as h, BEFORE_REDO_EVENT as f } from "./revogrid-pro78.js";
import { CorePlugin as E } from "./revogrid-pro106.js";
class D extends E {
  undoStack = [];
  redoStack = [];
  maxStackSize = 200;
  // todo: make it configurable
  disabled = !1;
  constructor(t, a) {
    super(t, a), t.additionalData?.history && (this.undoStack = t.additionalData.history.undoStack, this.redoStack = t.additionalData.history.redoStack, this.maxStackSize = t.additionalData.history.maxStackSize, this.disabled = t.additionalData.history.disabled), this.addEventListener(l, (e) => {
      const { detail: i } = e;
      i.history ? (this.undoStack = i.history.undoStack, this.redoStack = i.history.redoStack, this.maxStackSize = i.history.maxStackSize, this.disabled = i.history.disabled) : this.disabled = !0;
    }), this.addEventListener(u, (e) => {
      if (this.disabled || e.defaultPrevented || e.detail.eventTypes.includes(o))
        return;
      const { detail: i } = e;
      this.undoStack.push(i), this.undoStack.length > this.maxStackSize && this.undoStack.shift(), this.redoStack = [];
    }), this.addEventListener(
      S,
      ({ detail: { original: e, focus: i } }) => {
        if (this.disabled || !i) return;
        const { ctrlKey: s, metaKey: n, key: d } = e, r = (s || n) && d.toLowerCase() === "z" && !e.shiftKey, c = (s || n) && (d.toLowerCase() === "y" || d.toLowerCase() === "z" && e.shiftKey);
        r ? (e.preventDefault(), this.undo()) : c && (e.preventDefault(), this.redo());
      }
    );
  }
  clear() {
    this.undoStack = [], this.redoStack = [];
  }
  disable(t = !0) {
    this.disabled = t;
  }
  undo() {
    if (this.undoStack.length === 0) return;
    const t = this.undoStack.pop();
    if (!t)
      return;
    const a = this.emit(k, {
      data: { ...t.previousData },
      type: t.type,
      lastChange: t
    });
    if (a.defaultPrevented)
      return;
    const e = a.detail.data || t.previousData, i = a.detail.type || t.type;
    this.emit(h, a.detail), this.emit(o, {
      data: e,
      type: i,
      models: t.models
    }).defaultPrevented || this.providers.data.setRangeData(e, i), this.redoStack.push(t), this.redoStack.length > this.maxStackSize && this.redoStack.shift();
  }
  redo() {
    if (this.redoStack.length === 0) return;
    const t = this.redoStack.pop();
    if (!t)
      return;
    const a = this.emit(f, {
      data: t.data,
      type: t.type,
      lastChange: t
    });
    if (a.defaultPrevented)
      return;
    const e = a.detail.data || t.data, i = a.detail.type || t.type;
    this.emit(h, a.detail), this.emit(o, {
      data: e,
      type: i,
      models: t.models
    }).defaultPrevented || this.providers.data.setRangeData(e, i), this.undoStack.push(t), this.undoStack.length > this.maxStackSize && this.undoStack.shift();
  }
}
export {
  D as HistoryPlugin
};
