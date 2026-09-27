import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { BusinessSettings, Customer, Invoice } from "./models"
import { BUSINESS_LOGO_URL } from "./branding"

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

const NAVY = "FF17324D"
const TEAL = "FF0F766E"
const HEADER_FILL = "FFE8EEF3"
const MUTED_TEXT = "FF64748B"
const EMPTY_BUSINESS_SETTINGS: BusinessSettings = { businessName: null, address: null, phone: null }
type LogoAsset = { dataUrl: string; extension: "png" | "jpeg" }
const BORDER: Partial<import("exceljs").Borders> = {
  top: { style: "thin", color: { argb: "FFCBD5E1" } },
  bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
  left: { style: "thin", color: { argb: "FFCBD5E1" } },
  right: { style: "thin", color: { argb: "FFCBD5E1" } },
}

function addHeading(sheet: import("exceljs").Worksheet, title: string, span: number) {
  const row = sheet.addRow([title])
  if (span > 1) sheet.mergeCells(row.number, 1, row.number, span)
  row.height = 21
  row.getCell(1).font = { bold: true, size: 11, color: { argb: NAVY } }
  row.getCell(1).alignment = { vertical: "middle" }
  for (let column = 1; column <= span; column++) {
    row.getCell(column).fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } }
    row.getCell(column).border = { bottom: { style: "medium", color: { argb: TEAL } } }
  }
}

function addBusinessHeader(
  sheet: import("exceljs").Worksheet,
  settings: BusinessSettings,
  span: number,
) {
  const businessName = settings.businessName?.trim()
  const details = [settings.address?.trim(), settings.phone?.trim() ? `Phone: ${settings.phone.trim()}` : ""]
    .filter(Boolean)
    .join("  |  ")

  if (!businessName && !details) return

  const nameRow = sheet.addRow([businessName || details])
  if (span > 1) sheet.mergeCells(nameRow.number, 1, nameRow.number, span)
  nameRow.height = 28
  nameRow.getCell(1).font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } }
  nameRow.getCell(1).alignment = { vertical: "middle", indent: 1 }
  for (let column = 1; column <= span; column++) {
    nameRow.getCell(column).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } }
  }

  if (businessName && details) {
    const detailRow = sheet.addRow([details])
    if (span > 1) sheet.mergeCells(detailRow.number, 1, detailRow.number, span)
    detailRow.height = 19
    detailRow.getCell(1).font = { size: 9, color: { argb: MUTED_TEXT } }
    detailRow.getCell(1).alignment = { vertical: "middle" }
  }
}

function configureExcelPage(sheet: import("exceljs").Worksheet, span: number) {
  sheet.pageSetup = {
    orientation: span > 6 ? "landscape" : "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  }
  sheet.headerFooter = { oddFooter: "&RPage &P of &N" }
}

function addSubtitle(sheet: import("exceljs").Worksheet, text: string, span: number) {
  const row = sheet.addRow([text])
  sheet.mergeCells(row.number, 1, row.number, span)
  row.getCell(1).font = { italic: true, size: 9, color: { argb: MUTED_TEXT } }
}

function addTableHeader(sheet: import("exceljs").Worksheet, headers: string[]) {
  const row = sheet.addRow(headers)
  row.height = 22
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } }
    cell.border = BORDER
    cell.alignment = { vertical: "middle", wrapText: true }
  })
  return row
}

function addTableRows(
  sheet: import("exceljs").Worksheet,
  rows: Array<Array<string | number | boolean>>,
  currencyCols: number[] = []
) {
  rows.forEach((values, index) => {
    const row = sheet.addRow(values)
    row.eachCell((cell, colNumber) => {
      cell.border = BORDER
      if (index % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }
      }
      if (currencyCols.includes(colNumber)) cell.numFmt = "#,##0.00"
      if (typeof values[colNumber - 1] === "number") {
        cell.alignment = { ...cell.alignment, horizontal: "right" }
      }
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

async function loadBusinessLogo(): Promise<LogoAsset | null> {
  try {
    const response = await fetch(BUSINESS_LOGO_URL)
    if (!response.ok) return null

    const blob = await response.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })

    return { dataUrl, extension: blob.type === "image/jpeg" ? "jpeg" : "png" }
  } catch {
    return null
  }
}

function addExcelLogo(
  workbook: import("exceljs").Workbook,
  sheet: import("exceljs").Worksheet,
  logo: LogoAsset | null,
) {
  if (!logo) return

  const imageId = workbook.addImage({ base64: logo.dataUrl, extension: logo.extension })
  sheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 34, height: 34 } })
}

export async function exportTableToExcel(
  headers: string[],
  rows: TableExportColumn[][],
  filename: string,
  title: string = filename,
  businessSettings: BusinessSettings = EMPTY_BUSINESS_SETTINGS,
) {
  const ExcelJS = (await import("exceljs")).default
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Data")
  sheet.columns = headers.map(() => ({ width: 20 }))
  const logo = await loadBusinessLogo()

  addBusinessHeader(sheet, businessSettings, headers.length)
  addExcelLogo(workbook, sheet, logo)
  addHeading(sheet, title, headers.length)
  addSubtitle(sheet, generatedSubtitle(rows.length), headers.length)
  const tableHeader = addTableHeader(sheet, headers)
  addTableRows(sheet, createExportRows(rows))
  sheet.views = [{ state: "frozen", ySplit: tableHeader.number }]
  if (rows.length > 0) {
    sheet.autoFilter = {
      from: { row: tableHeader.number, column: 1 },
      to: { row: sheet.rowCount, column: headers.length },
    }
  }
  configureExcelPage(sheet, headers.length)

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
    invoiceItems: Array<{ materialName: string | null; quantityBrass: number; rate: number | null }>
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

export async function exportInvoiceToPdf(
  invoice: Invoice,
  customer: Customer | undefined,
  filename: string,
  businessSettings: BusinessSettings = EMPTY_BUSINESS_SETTINGS,
) {
  const document = new jsPDF()
  const logo = await loadBusinessLogo()
  const isAmountPending = invoice.totalPending
  const total = invoice.totalAmount
  const paid = invoice.payment?.amount ?? 0
  const balanceDue = isAmountPending ? null : Math.max(0, total - paid)
  const currency = (value: number) =>
    `INR ${new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`

  let y = addPdfDocumentHeader(
    document,
    businessSettings,
    isAmountPending ? "PROVISIONAL INVOICE" : "INVOICE",
    `Invoice no. ${invoice.invoiceNumber}  |  Issued ${invoice.invoiceDate}`,
    logo,
  )

  if (isAmountPending) {
    document.setFillColor(255, 247, 237)
    document.setDrawColor(217, 119, 6)
    document.roundedRect(8, y, document.internal.pageSize.getWidth() - 16, 10, 1.5, 1.5, "FD")
    document.setFont("helvetica", "bold")
    document.setFontSize(8)
    document.setTextColor(146, 64, 14)
    document.text("Pricing pending; this document is not a final payable invoice.", 12, y + 6.5)
    y += 16
  }

  y = addPdfSectionTitle(document, "Bill to", y)
  y = addPdfInvoiceDetails(document, [
    ["Customer", customer?.name ?? invoice.customerName ?? "-"],
    ["Phone", customer?.phone ?? "-"],
    ["Address", customer?.address ?? "-"],
  ], y) + 8

  y = addPdfSectionTitle(document, "Items", y)
  y = addPdfTable(document,
    ["Description", "Vehicle", "Quantity (brass)", "Rate", "Amount"],
    invoice.invoiceItems.length
      ? invoice.invoiceItems.map((item) => [
          item.materialName ?? "Material",
          item.truckNumber ?? "-",
          item.quantityBrass,
          isAmountPending || item.rate === null ? "Pending" : currency(item.rate),
          isAmountPending ? "Pending" : currency(item.amount),
        ])
      : [["No invoice items", "-", "-", "-", "-"]],
    y,
  ) + 5

  y = addPdfInvoiceTotals(document, [
    ["Invoice total", isAmountPending ? "Pending" : currency(total)],
    ["Payment received", invoice.payment ? currency(paid) : "Not received"],
    ["Balance due", balanceDue === null ? "Pending" : currency(balanceDue)],
  ], y + 3)

  if (invoice.payment) {
    y = addPdfInvoiceDetails(document, [
      ["Payment date", invoice.payment.paymentDate],
      ["Payment mode", invoice.payment.paymentMode ?? "-"],
    ], y + 8) + 5
  }

  if (invoice.remarks?.trim()) {
    y = addPdfSectionTitle(document, "Remarks", y)
    addPdfInvoiceDetails(document, [["Notes", invoice.remarks.trim()]], y)
  }

  addPdfPageNumbers(document)
  document.save(`${filename}.pdf`)
}

function addPdfDocumentHeader(
  document: jsPDF,
  settings: BusinessSettings,
  title: string,
  subtitle: string,
  logo: LogoAsset | null = null,
) {
  const pageWidth = document.internal.pageSize.getWidth()
  const businessName = settings.businessName?.trim()
  const details = [settings.address?.trim(), settings.phone?.trim() ? `Phone: ${settings.phone.trim()}` : ""]
    .filter(Boolean)
    .join("  |  ")

  const logoOffset = logo ? 24 : 0
  if (logo) document.addImage(logo.dataUrl, logo.extension.toUpperCase(), 8, 8, 14, 14)
  const nameLines = businessName ? document.splitTextToSize(businessName, pageWidth * 0.55 - logoOffset) : []
  if (nameLines.length > 0) {
    document.setFont("helvetica", "bold")
    document.setFontSize(17)
    document.setTextColor(23, 50, 77)
    document.text(nameLines, 8 + logoOffset, 16)
  }

  if (details) {
    document.setFont("helvetica", "normal")
    document.setFontSize(8)
    document.setTextColor(100, 116, 139)
    document.text(document.splitTextToSize(details, pageWidth * 0.55 - logoOffset), 8 + logoOffset, 16 + nameLines.length * 7)
  }

  document.setFont("helvetica", "bold")
  document.setFontSize(18)
  document.setTextColor(15, 118, 110)
  const titleLines = document.splitTextToSize(title, pageWidth * 0.4)
  document.text(titleLines, pageWidth - 8, 16, { align: "right" })
  document.setFont("helvetica", "normal")
  document.setFontSize(8)
  document.setTextColor(71, 85, 105)
  document.text(document.splitTextToSize(subtitle, pageWidth * 0.4), pageWidth - 8, 16 + titleLines.length * 7, { align: "right" })

  document.setDrawColor(15, 118, 110)
  document.setLineWidth(0.8)
  document.line(8, 35, pageWidth - 8, 35)
  return 43
}

function addPdfInvoiceDetails(document: jsPDF, details: Array<[string, string]>, startY: number) {
  const pageWidth = document.internal.pageSize.getWidth()
  const labelWidth = 32
  const rowHeight = 9
  const rows = details.map(([label, value]) => ({
    label,
    lines: document.splitTextToSize(value, pageWidth - labelWidth - 24),
  }))
  const boxHeight = rows.reduce((height, row) => height + Math.max(rowHeight, row.lines.length * 4 + 3), 4)
  document.setFillColor(248, 250, 252)
  document.setDrawColor(203, 213, 225)
  document.roundedRect(8, startY, pageWidth - 16, boxHeight, 1.5, 1.5, "FD")

  let rowY = startY + 7
  rows.forEach((row) => {
    document.setFont("helvetica", "bold")
    document.setFontSize(8)
    document.setTextColor(71, 85, 105)
    document.text(row.label, 13, rowY)
    document.setFont("helvetica", "normal")
    document.setTextColor(30, 41, 59)
    document.text(row.lines, 13 + labelWidth, rowY)
    rowY += Math.max(rowHeight, row.lines.length * 4 + 3)
  })

  return startY + boxHeight
}

function addPdfInvoiceTotals(document: jsPDF, totals: Array<[string, string]>, startY: number) {
  const pageWidth = document.internal.pageSize.getWidth()
  const boxWidth = 82
  const rowHeight = 8
  const boxHeight = totals.length * rowHeight + 8
  const left = pageWidth - 8 - boxWidth

  document.setFillColor(232, 238, 243)
  document.setDrawColor(148, 163, 184)
  document.roundedRect(left, startY, boxWidth, boxHeight, 1.5, 1.5, "FD")
  totals.forEach(([label, value], index) => {
    const rowY = startY + 7 + index * rowHeight
    document.setFont("helvetica", index === totals.length - 1 ? "bold" : "normal")
    document.setFontSize(index === totals.length - 1 ? 9 : 8)
    document.setTextColor(30, 41, 59)
    document.text(label, left + 5, rowY)
    document.text(value, left + boxWidth - 5, rowY, { align: "right" })
  })

  return startY + boxHeight
}

/** Single sheet, tables stacked top to bottom, with a summary and per-table totals mirroring the customer page. */
export async function exportCustomerReportToExcel(
  data: CustomerReportData,
  filename: string,
  businessSettings: BusinessSettings = EMPTY_BUSINESS_SETTINGS,
) {
  const ExcelJS = (await import("exceljs")).default
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Customer report")
  sheet.columns = [{ width: 18 }, { width: 20 }, { width: 16 }, { width: 30 }, { width: 16 }, { width: 16 }, { width: 18 }]
  const logo = await loadBusinessLogo()

  const totalDebit = data.ledger.reduce((sum, entry) => sum + entry.debit, 0)
  const totalCredit = data.ledger.reduce((sum, entry) => sum + entry.credit, 0)
  const finalBalance = data.ledger.at(-1)?.runningBalance ?? data.customer.pendingBalance ?? 0
  const totalBilled = data.invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
  const totalReceived = data.payments.reduce((sum, payment) => sum + payment.amount, 0)

  addBusinessHeader(sheet, businessSettings, 7)
  addExcelLogo(workbook, sheet, logo)
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
    data.invoices.flatMap((invoice) => {
      const items = invoice.invoiceItems.length > 0
        ? invoice.invoiceItems
        : [{ materialName: null, quantityBrass: 0, rate: null }]
      return items.map((item, index) => [
        index === 0 ? invoice.invoiceNumber : "",
        index === 0 ? invoice.invoiceDate : "",
        item.materialName ?? "-",
        item.quantityBrass,
        item.rate ?? "-",
        index === 0 ? invoice.totalAmount : "",
      ])
    }),
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

  configureExcelPage(sheet, 7)

  await downloadWorkbook(workbook, filename)
}

function addPdfPageNumbers(document: jsPDF) {
  const pageCount = document.getNumberOfPages()

  for (let page = 1; page <= pageCount; page++) {
    document.setPage(page)
    const pageWidth = document.internal.pageSize.getWidth()
    const pageHeight = document.internal.pageSize.getHeight()
    document.setDrawColor(203, 213, 225)
    document.setLineWidth(0.3)
    document.line(8, pageHeight - 13, pageWidth - 8, pageHeight - 13)
    document.setFont("helvetica", "normal")
    document.setFontSize(8)
    document.setTextColor(100, 116, 139)
    document.text(`Page ${page} of ${pageCount}`, pageWidth - 8, pageHeight - 7, { align: "right" })
  }
}

function addPdfTable(
  document: jsPDF,
  headers: string[],
  rows: Array<Array<string | number>>,
  startY: number,
) {
  autoTable(document, {
    startY,
    head: [headers],
    body: rows,
    styles: { fontSize: 7.5, cellPadding: 2.5, overflow: "linebreak", textColor: [30, 41, 59] },
    headStyles: { fillColor: [23, 50, 77], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    lineColor: [226, 232, 240],
    lineWidth: 0.2,
    margin: { top: 12, right: 8, bottom: 18, left: 8 },
  })

  return (document as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY
}

function addPdfSectionTitle(document: jsPDF, title: string, startY: number) {
  const pageHeight = document.internal.pageSize.getHeight()
  let y = startY
  if (y + 20 > pageHeight - 18) {
    document.addPage()
    y = 12
  }
  const pageWidth = document.internal.pageSize.getWidth()

  document.setFillColor(232, 238, 243)
  document.rect(8, y, pageWidth - 16, 8, "F")
  document.setFont("helvetica", "bold")
  document.setFontSize(9)
  document.setTextColor(23, 50, 77)
  document.text(title, 11, y + 5.5)
  return y + 12
}

const formatPdfAmount = (value: number) =>
  `INR ${new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`

/** Single-sheet customer report with business details, ledger, invoices, and receipts. */
export async function exportCustomerReportToPdf(
  data: CustomerReportData,
  filename: string,
  businessSettings: BusinessSettings = EMPTY_BUSINESS_SETTINGS,
) {
  const document = new jsPDF({ orientation: "landscape" })
  const logo = await loadBusinessLogo()
  const totalDebit = data.ledger.reduce((sum, entry) => sum + entry.debit, 0)
  const totalCredit = data.ledger.reduce((sum, entry) => sum + entry.credit, 0)
  const finalBalance = data.ledger.at(-1)?.runningBalance ?? data.customer.pendingBalance ?? 0
  const totalBilled = data.invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
  const totalReceived = data.payments.reduce((sum, payment) => sum + payment.amount, 0)
  const recordCount = data.ledger.length + data.invoices.length + data.payments.length
  let y = addPdfDocumentHeader(
    document,
    businessSettings,
    "CUSTOMER REPORT",
    `${data.customer.name}  |  ${generatedSubtitle(recordCount)}`,
    logo,
  )

  y = addPdfSectionTitle(document, "Customer details", y)
  y = addPdfTable(document, ["Details", "Value"], [
    ["Customer", data.customer.name],
    ["Phone", data.customer.phone ?? "-"],
    ["Address", data.customer.address ?? "-"],
    ["Pending balance", formatPdfAmount(data.customer.pendingBalance ?? finalBalance)],
  ], y) + 6

  y = addPdfSectionTitle(document, "Summary", y)
  y = addPdfTable(document, ["Summary", "Value"], [
    ["Total sales", formatPdfAmount(totalDebit)],
    ["Total payments", formatPdfAmount(totalCredit)],
    ["Final balance", formatPdfAmount(finalBalance)],
    ["Invoices raised", data.invoices.length],
    ["Total billed", formatPdfAmount(totalBilled)],
    ["Receipts recorded", data.payments.length],
    ["Total received", formatPdfAmount(totalReceived)],
  ], y) + 6

  y = addPdfSectionTitle(document, "Ledger", y)
  y = addPdfTable(document,
    ["Date", "Entry", "Reference", "Description", "Debit", "Credit", "Running balance"],
    [
      ...data.ledger.map((entry) => [
        entry.entryDate,
        entry.entryType,
        entry.reference,
        entry.description,
        entry.debit ? formatPdfAmount(entry.debit) : "-",
        entry.credit ? formatPdfAmount(entry.credit) : "-",
        formatPdfAmount(entry.runningBalance),
      ]),
      ["", "", "", "Total", formatPdfAmount(totalDebit), formatPdfAmount(totalCredit), formatPdfAmount(finalBalance)],
    ], y) + 6

  const invoiceRows = data.invoices.flatMap((invoice) => {
    const items = invoice.invoiceItems.length > 0
      ? invoice.invoiceItems
      : [{ materialName: null, quantityBrass: 0, rate: null }]
    return items.map((item, index) => [
      index === 0 ? invoice.invoiceNumber : "",
      index === 0 ? invoice.invoiceDate : "",
      item.materialName ?? "-",
      item.quantityBrass,
      item.rate ?? "-",
      index === 0 ? formatPdfAmount(invoice.totalAmount) : "",
    ])
  })

  y = addPdfSectionTitle(document, "Invoices", y)
  y = addPdfTable(document, ["Invoice", "Date", "Item", "Quantity (brass)", "Rate", "Total"], [
    ...invoiceRows,
    ["", "", "", "", "Total billed", formatPdfAmount(totalBilled)],
  ], y) + 6

  y = addPdfSectionTitle(document, "Payments", y)
  addPdfTable(document, ["Date", "Amount", "Mode", "Reference", "Invoice", "Notes"], [
    ...data.payments.map((payment) => [
      payment.paymentDate,
      formatPdfAmount(payment.amount),
      payment.paymentMode ?? "-",
      payment.externalRef ?? "-",
      payment.invoiceNumber ?? "-",
      payment.notes ?? "-",
    ]),
    ["Total", formatPdfAmount(totalReceived), "", "", "", ""],
  ], y)

  addPdfPageNumbers(document)
  document.save(`${filename}.pdf`)
}

export async function exportTableToPdf(
  headers: string[],
  rows: TableExportColumn[][],
  filename: string,
  title: string = filename,
  businessSettings: BusinessSettings = EMPTY_BUSINESS_SETTINGS,
) {
  const document = new jsPDF({ orientation: headers.length > 6 ? "landscape" : "portrait" })
  const logo = await loadBusinessLogo()

  const tableStart = addPdfDocumentHeader(
    document,
    businessSettings,
    title.toUpperCase(),
    generatedSubtitle(rows.length),
    logo,
  )

  autoTable(document, {
    startY: tableStart,
    head: [headers],
    body: createExportRows(rows).map((row) => row.map((value) => typeof value === "boolean" ? String(value) : value)),
    styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak", textColor: [30, 41, 59] },
    headStyles: { fillColor: [23, 50, 77], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    lineColor: [226, 232, 240],
    lineWidth: 0.2,
    margin: { top: 12, right: 8, bottom: 18, left: 8 },
  })
  addPdfPageNumbers(document)
  document.save(`${filename}.pdf`)
}
