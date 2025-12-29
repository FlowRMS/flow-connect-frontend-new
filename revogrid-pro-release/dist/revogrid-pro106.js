import { BasePlugin as b, getVisibleSourceItem as u } from "@revolist/revogrid";
class d extends b {
  attributeObservers = /* @__PURE__ */ new Map();
  constructor(...e) {
    super(...e);
  }
  /**
   * Observe attribute changes on the grid element
   * @param attrName - The attribute name to observe (supports both kebab-case and camelCase)
   * @param callback - Callback function when attribute changes
   */
  observeAttribute(e, t) {
    const r = e.replace(/-([a-z])/g, (s) => s[1].toUpperCase());
    if (!this.attributeObservers.has(e)) {
      const s = new MutationObserver((o) => {
        o.forEach((i) => {
          i.type === "attributes" && (i.attributeName === e || i.attributeName === r) && t(this.revogrid.getAttribute(e) || this.revogrid.getAttribute(r));
        });
      });
      s.observe(this.revogrid, {
        attributes: !0,
        attributeFilter: [e, r]
      }), this.attributeObservers.set(e, s);
    }
  }
  /**
   * Stop observing an attribute
   * @param attrName - The attribute name to stop observing
   */
  unobserveAttribute(e) {
    const t = this.attributeObservers.get(e);
    t && (t.disconnect(), this.attributeObservers.delete(e));
  }
  /**
   * Set the trimmed state for a column
   */
  setColumnTrimmed(e, t) {
    const r = this.providers.column.dataSources[t];
    r.addTrimmed(e), this.providers.dimension.setTrimmed(e, t), t === "rgCol" && this.providers.dimension.setData(
      u(r.store).length,
      t
    );
  }
  /**
   * Destroy plugin and clean up all observers
   */
  destroy() {
    this.attributeObservers.forEach((e) => e.disconnect()), this.attributeObservers.clear(), super.destroy();
  }
}
export {
  d as CorePlugin
};
