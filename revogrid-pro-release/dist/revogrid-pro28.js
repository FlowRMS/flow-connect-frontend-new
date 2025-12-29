/* empty css                */
import { getThresholdClasses as o } from "./revogrid-pro127.js";
const n = ({ value: e, column: r }) => {
  if (!e) return {};
  const t = Number(e), s = o(t, r);
  return {
    class: {
      "threshold-cell": Object.keys(s).length > 0,
      ...s
    }
  };
};
export {
  n as thresholdRenderer
};
