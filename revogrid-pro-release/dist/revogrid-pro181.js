import { h as i } from "@revolist/revogrid";
class c {
  constructor(t, e) {
    this.onPageChange = e, this.update(t), this.locales = {
      ...this.locales,
      ...t.locales
    };
  }
  config = {
    itemsPerPage: 0,
    initialPage: 0,
    total: 0
  };
  currentPage = 0;
  totalPages = 0;
  locales = {
    previous: "‹",
    next: "›",
    first: "«",
    last: "»",
    page: "Page",
    of: "of",
    items: "items"
  };
  refresh;
  setRefresh(t) {
    this.refresh = t;
  }
  createButton(t, e, n) {
    return i(
      "button",
      {
        class: {
          "rv-button": !0,
          small: !0,
          disabled: n
        },
        disabled: n,
        onClick: e.bind(this)
      },
      t
    );
  }
  render() {
    const t = (a = 0) => {
      this.currentPage = a, this.refresh?.(), this.onPageChange(this.currentPage);
    }, e = [];
    if (this.config.navigation !== !1) {
      if (e.push(
        // first button
        this.createButton(
          this.locales.first,
          () => {
            this.currentPage > 0 && t();
          },
          this.currentPage === 0
        ),
        // previous button
        this.createButton(
          this.locales.previous,
          () => {
            this.currentPage > 0 && t(this.currentPage - 1);
          },
          this.currentPage === 0
        )
      ), this.config.buttonCount) {
        let a = 0;
        const s = this.config.buttonCount;
        this.currentPage + 1 > s && (a = this.currentPage - Math.floor(s / 2));
        const o = Math.min(a + s, this.totalPages);
        for (let r = a; r < o; r++)
          e.push(
            this.createButton(
              (r + 1).toString(),
              () => {
                t(r);
              },
              r === this.currentPage
            )
          );
      }
      e.push(
        // next button
        this.createButton(
          this.locales.next,
          () => {
            this.currentPage < this.totalPages - 1 && t(this.currentPage + 1);
          },
          this.currentPage === this.totalPages - 1
        ),
        // last button
        this.createButton(
          this.locales.last,
          () => {
            t(this.totalPages - 1);
          },
          this.currentPage === this.totalPages - 1
        )
      );
    }
    this.totalPages > 1 && (this.config.info !== !1 && e.push(i("span", null, ` ${this.locales.page}`)), e.push(
      i(
        "select",
        {
          onChange: (a) => {
            const s = a.target;
            t(parseInt(s.value, 10));
          }
        },
        new Array(this.totalPages).fill(null).map(
          (a, s) => i(
            "option",
            {
              value: s,
              selected: s === this.currentPage
            },
            (s + 1).toString()
          )
        )
      )
    ), this.config.info !== !1 && e.push(
      // of
      i("span", null, ` ${this.locales.of} ${this.totalPages}`)
    ));
    const n = [];
    if (this.config.totalInfo !== !1) {
      const a = this.currentPage * this.config.itemsPerPage, s = Math.min(
        (this.currentPage + 1) * this.config.itemsPerPage,
        this.config.total
      );
      n.push(
        // total info
        i(
          "span",
          null,
          `${a}-${s} ${this.locales.of} ${this.config.total} ${this.locales.items}`
        )
      );
    }
    return i(
      "div",
      {
        class: {
          "rv-pagination-panel": !0
        }
      },
      [i("span", null, e), i("span", null, n)]
    );
  }
  update(t) {
    this.currentPage = t.initialPage, this.totalPages = Math.ceil(t.total / t.itemsPerPage) || 0, this.config = t, this.refresh?.();
  }
}
export {
  c as PaginationPanel
};
