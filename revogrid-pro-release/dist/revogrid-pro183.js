import { getCell as n, getRow as l } from "./revogrid-pro185.js";
class u {
  constructor(t) {
    this.config = t;
  }
  currentCell = null;
  initialCoordinate = null;
  previous = null;
  /** Drag finished, calculate and apply changes */
  endOrder(t, e) {
    if (this.currentCell === null)
      return;
    const i = n(t, e);
    i.y < this.currentCell.y && i.y++, i.y < 0 && (i.y = 0), this.config.positionChanged(t, {
      from: this.currentCell.y,
      to: i.y,
      type: e.type
    }), this.clear();
  }
  start(t) {
    this.initialCoordinate = {
      x: t.x,
      y: t.y
    };
  }
  /** Drag started, reserve initial cell for farther use */
  startOrder(t) {
    this.currentCell = t;
  }
  move(t, e) {
    if (!this.currentCell)
      return this.initialCoordinate && Math.abs(this.initialCoordinate.y - t.y) > 5 && this.config.orderStart(t), null;
    const i = l(t.y, e);
    if (this.previous === i.itemIndex || i.itemIndex < -1)
      return null;
    const r = e.dataItem.providers?.dimension.get("count");
    return r && i.itemIndex >= r ? null : (this.previous = i.itemIndex, i);
  }
  /** Drag stopped, probably cursor outside of document area */
  clear() {
    this.currentCell = null, this.previous = null, this.initialCoordinate = null;
  }
}
export {
  u as default
};
