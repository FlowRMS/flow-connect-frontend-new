import { CLIPBOARD_COPY_EVENT as n, CLIPBOARD_PASTE_EVENT as i } from "./revogrid-pro78.js";
import { CorePlugin as p } from "./revogrid-pro106.js";
const a = "$rv-parse_";
class P extends p {
  constructor(r, e) {
    super(r, e), this.addEventListener(
      n,
      (t) => {
        t.preventDefault();
        const s = t.detail.data ? this.parserCopy(t.detail.data) : "";
        t.detail.event.setData("text/plain", s);
      }
    ), this.addEventListener(
      i,
      (t) => {
        t.detail.parsed = this.parserPaste(t.detail.parsed);
      }
    );
  }
  parserPaste(r) {
    return r.map((e) => e.map((t) => typeof t == "string" && t.startsWith(a) ? JSON.parse(t.slice(a.length)) : t));
  }
  parserCopy(r) {
    return r.map((e) => e.map(
      (t) => typeof t == "object" ? `${a}${JSON.stringify(t)}` : t
    ).join("	")).join(`
`);
  }
}
export {
  P as ClipboardJsonPlugin
};
