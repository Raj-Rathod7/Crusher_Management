import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

export type TableExportColumn = {
  header: string
  value: unknown
}

export function normalizeExportValue(value: unknown): string | number | boolean {
  if (value === null || value === undefined) {
    return ""
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value
  }

  return JSON.stringify(value)
}

function createExportRows(rows: TableExportColumn[][]) {
  return rows.map((row) => row.map((cell) => normalizeExportValue(cell.value)))
}

export function exportTableToExcel(
  headers: string[],
  rows: TableExportColumn[][],
  filename: string
) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...createExportRows(rows)])
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, "Data")
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

export function exportTableToPdf(
  headers: string[],
  rows: TableExportColumn[][],
  filename: string
) {
  const document = new jsPDF({ orientation: headers.length > 6 ? "landscape" : "portrait" })

  autoTable(document, {
    head: [headers],
    body: createExportRows(rows).map((row) => row.map(String)),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 41, 59] },
    margin: { top: 12, right: 8, bottom: 12, left: 8 },
  })
  document.save(`${filename}.pdf`)
}
