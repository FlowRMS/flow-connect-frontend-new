/* empty css                */
import { read as h, utils as d, writeFile as E } from "./revogrid-pro132.js";
import { dispatch as u } from "@revolist/revogrid";
import { EXCEL_EXPORT_EVENT as x, EXCEL_BEFORE_IMPORT_EVENT as v, EXCEL_BEFORE_SET_EVENT as w } from "./revogrid-pro78.js";
import { evaluateRawValuesFormula as y, isFormula as _ } from "./revogrid-pro133.js";
import { CorePlugin as k } from "./revogrid-pro106.js";
const c = "is-dragging";
class b extends k {
  constructor(t, r) {
    super(t, r), this.addEventListener(
      x,
      async (e) => this.export(e.detail)
    );
    const s = () => t.readonly ? !1 : t.additionalData?.excel?.allowDrag ?? !0;
    t.addEventListener("dragover", (e) => {
      s() && (e.preventDefault(), t.classList.add(c));
    }), t.addEventListener("dragenter", (e) => {
      s() && (e.preventDefault(), t.classList.add(c));
    }), t.addEventListener("drop", async (e) => {
      if (s() && (e.preventDefault(), t.classList.remove(c), e.dataTransfer && e.dataTransfer.files.length > 0)) {
        const o = e.dataTransfer.files[0];
        this.importFile(o);
      }
    });
  }
  // Utility method to read the file as an array buffer
  async readFileAsArrayBuffer(t) {
    return new Promise((r, s) => {
      const e = new FileReader();
      e.onload = () => r(e.result), e.onerror = s, e.readAsArrayBuffer(t);
    });
  }
  /**
   * Imports an Excel file into the grid.
   *
   * @param file The File object to import
   *
   * This method reads the file using FileReader, parses it using xlsx library,
   * and then dispatches the 'excel-before-import' event to allow plugins to
   * modify the sheet before it is imported.
   *
   * After the sheet is imported, the method dispatches the 'excel-before-set'
   * event to allow plugins to modify the data before it is set as the new
   * source.
   *
   * If either event is prevented, the method will not set the new source.
   *
   * If the file is not an Excel file, the method will log an error.
   */
  async importFile(t, r = this.revogrid.additionalData?.excel || {}) {
    if (this.isExcel(t, r.allowedExtensions))
      try {
        const s = await this.readFileAsArrayBuffer(t), e = h(s, { type: "array", ...r }), o = e.SheetNames[0], i = e.Sheets[o], n = u(this.revogrid, v, {
          sheetName: o,
          sheet: i,
          workbook: e
        });
        if (n.defaultPrevented)
          return;
        const l = d.sheet_to_json(n.detail.sheet, {
          header: r?.skipColumnGeneration ? void 0 : 1,
          ...r?.jsonFormat
        }), a = r?.skipColumnGeneration ? void 0 : l.splice(0, 1)[0], p = u(this.revogrid, w, {
          sheetName: o,
          sheet: i,
          workbook: e,
          jsonData: l
        });
        if (p.defaultPrevented)
          return;
        !r.skipColumnGeneration && a && (this.revogrid.columns = a.map(
          (m, f) => ({
            name: m,
            prop: f
          })
        )), this.revogrid.source = p.detail.jsonData;
      } catch (s) {
        console.error("Failed to load Excel file:", s);
      }
    else
      console.error("Only Excel files are supported.");
  }
  isExcel(t, r = [".xlsx", ".xls"]) {
    return t.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || r.some((s) => t.name.endsWith(s));
  }
  export(t) {
    const r = [
      ...this.revogrid.pinnedTopSource,
      ...this.revogrid.source,
      ...this.revogrid.pinnedBottomSource
    ], s = r.map((i) => {
      const n = {};
      for (const [l, a] of Object.entries(i))
        n[l] = _(a) ? y(
          a,
          r,
          this.providers.column.getColumns("all")
        ) : a;
      return n;
    }), e = d.book_new(), o = d.json_to_sheet(s);
    d.book_append_sheet(e, o, t?.workbookName || "Workbook 1"), E(
      e,
      t?.sheetName || "RevoGrid-Sheet.xlsx",
      t?.writingOptions ?? { bookType: "xlsx" }
    );
  }
}
export {
  b as ExportExcelPlugin
};
