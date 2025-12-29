class o {
  elementHandler;
  element;
  elementText;
  autoscrollEl;
  headerOffsetY = 0;
  dragHint = "";
  renderAutoscroll(e, t) {
    t && (this.autoscrollEl = document.createElement("div"), this.autoscrollEl.classList.add("auto-scroll"), t.appendChild(this.autoscrollEl));
  }
  autoscroll(e, t) {
    if (!this.autoscrollEl)
      return;
    const s = Math.min(e + 10, t - 3);
    this.autoscrollEl.style.transform = `translateY(${s}px)`, this.autoscrollEl.scrollIntoView({
      block: "nearest",
      inline: "nearest"
    });
  }
  start(e, { el: t, gridRect: l, elScroll: s }, i) {
    const r = s.getBoundingClientRect();
    r && (this.headerOffsetY = r.top - l.top), this.dragHint = i || "", this.renderAutoscroll(e, t);
  }
  stop() {
    this.element && (this.element.hidden = !0), this.autoscrollEl?.remove(), this.autoscrollEl = void 0, this.headerOffsetY = 0;
  }
  moveTip({ x: e, y: t }) {
    this.elementText && (this.elementText.style.left = `${e}px`, this.elementText.style.top = `${t}px`);
  }
  showHandler(e, t) {
    !this.elementHandler || !this.element || (this.headerOffsetY && (e = Math.max(e, this.headerOffsetY)), e = Math.min(e, t), this.elementHandler.style.transform = `translateY(${e}px)`, this.element.hidden = !1, this.elementText && (this.elementText.style.display = this.dragHint ? "block" : "none", this.elementText.innerText = this.dragHint || ""));
  }
  render(e, t) {
    return e(
      "div",
      {
        [t]: !0,
        hidden: !0,
        ref: (l) => this.element = l
      },
      [
        e("div", {
          class: {
            "drag-position": !0
          },
          style: {
            top: 0
          },
          ref: (l) => this.elementHandler = l
        }),
        e("div", {
          class: {
            draggable: !0
          },
          ref: (l) => this.elementText = l
        })
      ]
    );
  }
}
export {
  o as OrderHandler
};
