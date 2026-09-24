import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

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

function generatedSubtitle(recordCount: number) {
  return `Generated ${new Date().toLocaleString("en-IN")} \u00b7 ${recordCount} record${recordCount === 1 ? "" : "s"}`
}

// --- Excel styling (needs real cell styling -> exceljs, SheetJS's free xlsx can't write styles) ---

const NAVY = "FF0F172A"
const HEADER_FILL = "FFE2E8F0"
const MUTED_TEXT = "FF64748B"
const BORDER: Partial<import("exceljs").Borders> = {
  top: { style: "thin", color: { argb: "FFCBD5E1" } },
  bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
  left: { style: "thin", color: { argb: "FFCBD5E1" } },
  right: { style: "thin", color: { argb: "FFCBD5E1" } },
}

function addHeading(sheet: import("exceljs").Worksheet, title: string, span: number) {
  const row = sheet.addRow([title])
  sheet.mergeCells(row.number, 1, row.number, span)
  row.height = 22
  row.getCell(1).font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } }
  row.getCell(1).alignment = { vertical: "middle" }
  for (let column = 1; column <= span; column++) {
    row.getCell(column).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } }
  }
}

function addSubtitle(sheet: import("exceljs").Worksheet, text: string, span: number) {
  const row = sheet.addRow([text])
  sheet.mergeCells(row.number, 1, row.number, span)
  row.getCell(1).font = { italic: true, size: 9, color: { argb: MUTED_TEXT } }
}

function addTableHeader(sheet: import("exceljs").Worksheet, headers: string[]) {
  const row = sheet.addRow(headers)
  row.eachCell((cell) => {
    cell.font = { bold: true }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } }
    cell.border = BORDER
  })
}

function addTableRows(
  sheet: import("exceljs").Worksheet,
  rows: Array<Array<string | number | boolean>>,
  currencyCols: number[] = []
) {
  rows.forEach((values) => {
    const row = sheet.addRow(values)
    row.eachCell((cell, colNumber) => {
      cell.border = BORDER
      if (currencyCols.includes(colNumber)) cell.numFmt = "#,##0.00"
    })
  })
}

function addTotalsRow(
  sheet: import("exceljs").Worksheet,
  values: Array<string | number>,
  currencyCols: number[] = []
) {
  const row = sheet.addRow(values)
  row.eachCell((cell, colNumber) => {
    cell.font = { bold: true }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } }
    cell.border = BORDER
    if (currencyCols.includes(colNumber)) cell.numFmt = "#,##0.00"
  })
}

async function downloadWorkbook(workbook: import("exceljs").Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}

export async function exportTableToExcel(
  headers: string[],
  rows: TableExportColumn[][],
  filename: string,
  title: string = filename
) {
  const ExcelJS = (await import("exceljs")).default
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Data")
  sheet.columns = headers.map(() => ({ width: 20 }))

  addHeading(sheet, title, headers.length)
  addSubtitle(sheet, generatedSubtitle(rows.length), headers.length)
  addTableHeader(sheet, headers)
  addTableRows(sheet, createExportRows(rows))

  await downloadWorkbook(workbook, filename)
}

export type CustomerReportData = {
  customer: {
    name: string
    phone?: string | null
    address?: string | null
    notes?: string | null
    pendingBalance?: number
  }
  ledger: Array<{
    entryDate: string
    entryType: string
    reference: string
    description: string
    debit: number
    credit: number
    runningBalance: number
  }>
  invoices: Array<{
    invoiceNumber: string
    invoiceDate: string
    totalAmount: number
    invoiceItems: Array<{ materialName: string | null; quantityBrass: number; rate: number }>
  }>
  payments: Array<{
    paymentDate: string
    amount: number
    paymentMode: string | null
    externalRef: string | null
    notes: string | null
    invoiceNumber: string | null
  }>
}

/** Single sheet, tables stacked top to bottom, with a summary and per-table totals mirroring the customer page. */
export async function exportCustomerReportToExcel(data: CustomerReportData, filename: string) {
  const ExcelJS = (await import("exceljs")).default
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Customer report")
  sheet.columns = [{ width: 18 }, { width: 20 }, { width: 16 }, { width: 30 }, { width: 16 }, { width: 16 }, { width: 18 }]

  const totalDebit = data.ledger.reduce((sum, entry) => sum + entry.debit, 0)
  const totalCredit = data.ledger.reduce((sum, entry) => sum + entry.credit, 0)
  const finalBalance = data.ledger.at(-1)?.runningBalance ?? data.customer.pendingBalance ?? 0
  const totalBilled = data.invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
  const totalReceived = data.payments.reduce((sum, payment) => sum + payment.amount, 0)

  addHeading(sheet, `Customer report \u2014 ${data.customer.name}`, 7)
  addSubtitle(sheet, generatedSubtitle(data.ledger.length + data.invoices.length + data.payments.length), 7)
  sheet.addRow([])

  addHeading(sheet, "Customer details", 7)
  addTableRows(
    sheet,
    [
      ["Name", data.customer.name],
      ["Phone", data.customer.phone ?? "-"],
      ["Address", data.customer.address ?? "-"],
      ["Pending balance", data.customer.pendingBalance ?? 0],
    ],
    [2]
  )
  sheet.addRow([])

  addHeading(sheet, "Ledger", 7)
  addTableHeader(sheet, ["Date", "Entry", "Reference", "Description", "Debit", "Credit", "Running balance"])
  addTableRows(
    sheet,
    data.ledger.map((entry) => [
      entry.entryDate,
      entry.entryType,
      entry.reference,
      entry.description,
      entry.debit,
      entry.credit,
      entry.runningBalance,
    ]),
    [5, 6, 7]
  )
  addTotalsRow(sheet, ["", "", "", "Total", totalDebit, totalCredit, finalBalance], [5, 6, 7])
  sheet.addRow([])

  addTableHeader(sheet, ["Summary", "Value"])
  addTableRows(
    sheet,
    [
      ["Total sales", totalDebit],
      ["Total payments", totalCredit],
      ["Final balance", finalBalance],
      ["Invoices raised", data.invoices.length],
      ["Total billed", totalBilled],
      ["Receipts recorded", data.payments.length],
      ["Total received", totalReceived],
    ],
    [2]
  )
  sheet.addRow([])

  addHeading(sheet, "Invoices", 6)
  addTableHeader(sheet, ["Invoice", "Date", "Item", "Quantity (brass)", "Rate", "Total"])
  addTableRows(
    sheet,
    data.invoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.invoiceDate,
      invoice.invoiceItems[0]?.materialName ?? "-",
      invoice.invoiceItems[0]?.quantityBrass ?? "-",
      invoice.invoiceItems[0]?.rate ?? "-",
      invoice.totalAmount,
    ]),
    [5, 6]
  )
  addTotalsRow(sheet, ["", "", "", "", "Total", totalBilled], [6])
  sheet.addRow([])

  addHeading(sheet, "Payments", 6)
  addTableHeader(sheet, ["Date", "Amount", "Mode", "Reference", "Invoice", "Notes"])
  addTableRows(
    sheet,
    data.payments.map((payment) => [
      payment.paymentDate,
      payment.amount,
      payment.paymentMode ?? "-",
      payment.externalRef ?? "-",
      payment.invoiceNumber ?? "-",
      payment.notes ?? "-",
    ]),
    [2]
  )
  addTotalsRow(sheet, ["Total", totalReceived, "", "", "", ""], [2])

  await downloadWorkbook(workbook, filename)
}

export function exportTableToPdf(
  headers: string[],
  rows: TableExportColumn[][],
  filename: string,
  title: string = filename
) {
  const document = new jsPDF({ orientation: headers.length > 6 ? "landscape" : "portrait" })

  document.setFontSize(14)
  document.setTextColor(15, 23, 42)
  document.text(title, 8, 12)
  document.setFontSize(9)
  document.setTextColor(100, 116, 139)
  document.text(generatedSubtitle(rows.length), 8, 18)

  autoTable(document, {
    startY: 24,
    head: [headers],
    body: createExportRows(rows).map((row) => row.map(String)),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { top: 12, right: 8, bottom: 12, left: 8 },
  })
  document.save(`${filename}.pdf`)
}
