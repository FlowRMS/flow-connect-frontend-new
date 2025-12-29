/* empty css                */
import g from "./revogrid-pro115.js";
import { SCROLL_CHANGE_EVENT as k } from "./revogrid-pro100.js";
import { BEFORE_ROW_RENDER_EVENT as S } from "./revogrid-pro78.js";
import { CorePlugin as p } from "./revogrid-pro106.js";
class x extends p {
  config;
  loadedChunks = /* @__PURE__ */ new Set();
  loadingChunks = /* @__PURE__ */ new Set();
  defaultChunkSize = 100;
  // Fallback if we can't calculate
  currentOrder;
  currentFilter;
  constructor(i, o) {
    super(i, o);
    let s = 0;
    this.addEventListener("resizeviewport", (t) => {
      t.detail.dimension === "rgRow" && t.detail.size && this.config.dynamicChunkSize && (this.calculateChunkSize(), this.initializeSource());
    }), this.addEventListener("beforefilterapply", (t) => {
      t.preventDefault(), this.currentFilter = t.detail.filterItems, s = -1, this.loadedChunks.clear(), this.loadingChunks.clear(), this.emit("viewportscroll");
    }), this.addEventListener("beforesortingapply", (t) => {
      t.preventDefault(), t.detail.additive ? this.currentOrder = { ...this.currentOrder, [t.detail.column.prop]: t.detail.order } : this.currentOrder = { [t.detail.column.prop]: t.detail.order }, s = -1, this.loadedChunks.clear(), this.loadingChunks.clear(), this.emit("viewportscroll");
    }), this.addEventListener(S, (t) => {
      const { node: n, item: r } = t.detail, h = Math.floor(r.itemIndex / this.config.chunkSize);
      n.$attrs$ && (n.$attrs$.loading = this.loadingChunks.has(h));
    });
    const d = g(() => {
      const t = this.providers.viewport.stores.rgRow.store.get("items");
      if (!t?.length) return;
      const n = t[0]?.itemIndex ?? 0, r = t[t.length - 1]?.itemIndex ?? 0;
      this.cleanupChunksOutsideViewport(n, r);
    }, 100);
    this.addEventListener("viewportscroll", async () => {
      const t = this.providers.viewport.stores.rgRow.store.get("items");
      if (!t?.length) return;
      const n = t[0]?.itemIndex ?? 0, r = t[t.length - 1]?.itemIndex ?? 0, h = n > s ? "down" : "up";
      if (s === n) return;
      s = n;
      const a = Math.floor(this.config.chunkSize * this.config.preloadThreshold), u = Math.floor(n / this.config.chunkSize), f = Math.ceil(r / this.config.chunkSize);
      for (let e = u; e <= f; e++)
        if (!this.loadedChunks.has(e) && !this.loadingChunks.has(e)) {
          const l = e * this.config.chunkSize;
          if (this.config.total && l >= this.config.total) continue;
          await this.loadChunk(l, this.config.chunkSize, this.currentOrder, this.currentFilter);
        }
      if (h === "down") {
        const e = f + 1, l = e * this.config.chunkSize;
        (!this.config.total || l < this.config.total) && !this.loadingChunks.has(e) && !this.loadedChunks.has(e) && r + a >= e * this.config.chunkSize && await this.loadChunk(l, this.config.chunkSize, this.currentOrder, this.currentFilter);
      } else if (h === "up") {
        const e = u - 1, l = Math.max(0, e * this.config.chunkSize);
        e >= 0 && !this.loadingChunks.has(e) && !this.loadedChunks.has(e) && n <= u * this.config.chunkSize + a && await this.loadChunk(l, this.config.chunkSize, this.currentOrder, this.currentFilter);
      }
      d();
    }), this.addEventListener(
      "additionaldatachanged",
      ({ detail: t }) => {
        t.infinityScroll && (this.config = this.getConfig(t.infinityScroll), this.initializeSource());
      }
    ), this.config = this.getConfig(i.additionalData?.infinityScroll), this.initializeSource(), this.loadChunk(0 * this.config.chunkSize, this.config.chunkSize, this.currentOrder, this.currentFilter);
  }
  calculateChunkSize(i = this.revogrid.clientHeight) {
    if (!this.config?.dynamicChunkSize || !i) return;
    const o = i / this.providers.dimension.stores.rgRow.store.get("originItemSize"), s = Math.floor(o) * 2;
    this.config && (this.config = {
      ...this.config,
      chunkSize: s,
      // Update buffer size if it was not explicitly provided
      bufferSize: this.config.bufferSize ?? s * 2
    });
  }
  initializeSource() {
    if (this.config.total) {
      const i = Array(this.config.total).fill({});
      this.revogrid.source = i;
    } else
      this.revogrid.source = [];
  }
  getConfig(i = {}) {
    if (!i.loadData)
      throw new Error("loadData function must be provided for InfinityScrollPlugin");
    const o = i.chunkSize ?? this.defaultChunkSize;
    return {
      chunkSize: o,
      dynamicChunkSize: !i.chunkSize,
      // Buffer size is 2x chunk size if not provided
      bufferSize: i.bufferSize ?? o * 2,
      preloadThreshold: i.preloadThreshold ?? 0.75,
      total: i.total,
      loadData: i.loadData
    };
  }
  async loadChunk(i, o, s, d) {
    this.config.chunkSize || this.calculateChunkSize();
    const c = Math.floor(i / this.config.chunkSize);
    if (!this.loadingChunks.has(c))
      try {
        this.loadingChunks.add(c), this.emit(k, {
          skip: i,
          limit: o
        });
        const t = await this.config.loadData(i, o, s, d), n = [...this.providers.data.stores.rgRow.store.get("source") || []];
        this.config.total && n.length < this.config.total && (n.length = this.config.total), t.forEach((r, h) => {
          n[i + h] = r;
        }), this.config.total ? this.providers.data.stores.rgRow.store.set("source", n) : this.revogrid.source = n, this.loadedChunks.add(c);
      } finally {
        this.loadingChunks.delete(c);
      }
  }
  cleanupChunksOutsideViewport(i, o) {
    const s = this.config.bufferSize, d = Math.max(0, i - s), c = o + s, t = Math.floor(d / this.config.chunkSize), n = Math.ceil(c / this.config.chunkSize), r = 3, h = [...this.providers.data.stores.rgRow.store.get("source") || []];
    for (const a of this.loadedChunks)
      if (a < t - r || a > n + r) {
        this.loadedChunks.delete(a);
        const u = a * this.config.chunkSize, f = Math.min(
          u + this.config.chunkSize,
          this.config.total || h.length
        );
        for (let e = u; e < f; e++)
          h[e] = {};
      }
    this.providers.data.stores.rgRow.store.set("source", h);
  }
  destroy() {
    this.loadedChunks.clear(), this.loadingChunks.clear(), super.destroy();
  }
}
export {
  x as InfinityScrollPlugin,
  k as SCROLL_CHANGE_EVENT
};
