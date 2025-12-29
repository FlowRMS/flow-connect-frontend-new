import { REVOGRID_EVENTS as a } from "@revolist/revogrid";
const p = ({
  onMouseUp: e
}) => [...a.values()].reduce(
  (o, t) => (o[`on${t.charAt(0).toUpperCase() + t.slice(1)}`] = (l) => {
    l.stopPropagation();
  }, o),
  {
    onWheel(o) {
      let t = o.target;
      for (; t && t !== o.currentTarget; ) {
        if (t.scrollHeight > t.clientHeight) {
          const r = o.deltaY > 0, n = t.scrollTop === 0, s = Math.abs(
            t.scrollTop + t.clientHeight - t.scrollHeight
          ) < 1;
          if (r && !s || !r && !n) {
            t.scrollTop += o.deltaY, o.stopPropagation(), o.preventDefault();
            break;
          }
        }
        t = t.parentElement;
      }
    },
    onDblClick(o) {
      o.stopPropagation();
    },
    onMouseUp: e
  }
), g = {
  onMouseDown: (e) => {
    e.stopPropagation();
  },
  onClick: (e) => {
    e.stopPropagation();
  },
  onDblClick: (e) => {
    e.preventDefault();
  }
};
export {
  g as ignoreCellEvents,
  p as overrideEvents
};
