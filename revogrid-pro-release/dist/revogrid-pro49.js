import { EVENT_BEFORE_EDIT as p, BEFORE_CLIPBOARD_PASTE_EVENT as r, BEFORE_HIST_EDIT_EVENT as v, BEFORE_RANGE_EDIT_EVENT as c, ON_EDIT_EVENT as u } from "./revogrid-pro78.js";
import { getPreviousData as s } from "./revogrid-pro105.js";
import { CorePlugin as D } from "./revogrid-pro106.js";
const i = "collectedit";
class I extends D {
  /**
   * Constructor for EventManagerPlugin
   * @param revogrid - The Grid element
   * @param providers - The Plugin providers
   */
  constructor(n, o) {
    super(n, o);
    let a, d;
    const T = n.additionalData?.eventManager || {}, m = () => {
      d && clearTimeout(d), d = setTimeout(() => {
        d = void 0, E(a);
      }, T.collectEventsDelay || 0);
    }, E = (t) => {
      const e = n.additionalData?.eventManager || {}, l = this.emit(u, t);
      !l.defaultPrevented && e.applyEventsToSource !== !1 && o.data.setRangeData(l.detail.data, l.detail.type), a = void 0;
    };
    this.addEventListener(
      i,
      ({ detail: t }) => {
        const e = a?.eventTypes || [];
        e.push(...t.eventTypes), a = { ...a, ...t, eventTypes: e }, (n.additionalData?.eventManager || {}).collectEvents ? m() : E(a);
      }
    ), this.addEventListener(
      p,
      (t) => {
        t.preventDefault();
        const e = {
          data: {
            [t.detail.rowIndex]: {
              [t.detail.prop]: t.detail.val
            }
          },
          previousData: {
            [t.detail.rowIndex]: {
              [t.detail.prop]: t.detail.model?.[t.detail.prop]
            }
          },
          models: {
            [t.detail.rowIndex]: t.detail.model
          },
          type: t.detail.type,
          eventTypes: [p]
        };
        this.emit(i, e);
      }
    ), this.addEventListener(
      r,
      (t) => {
        t.preventDefault();
        const e = {
          data: t.detail.data,
          type: t.detail.rowType,
          previousData: s(t.detail),
          models: t.detail.models,
          eventTypes: [r]
        };
        this.emit(i, e);
      }
    ), this.addEventListener(v, (t) => {
      t.preventDefault();
      const e = {
        data: t.detail.data,
        type: t.detail.type,
        previousData: s(t.detail),
        models: t.detail.models,
        eventTypes: [v]
      };
      this.emit(i, e);
    }), this.addEventListener(
      c,
      (t) => {
        t.preventDefault();
        const e = {
          ...t.detail,
          previousData: s(t.detail),
          eventTypes: [c]
        };
        this.emit(i, e);
      }
    );
  }
}
export {
  I as EventManagerPlugin
};
