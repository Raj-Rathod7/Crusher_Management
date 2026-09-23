package com.productapp.service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.productapp.dto.CustomerLedgerEntry;
import com.productapp.entity.Customer;
import com.productapp.entity.CustomerLedger;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.CustomerLedgerRepository;
import com.productapp.repository.CustomerRepository;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class CustomerLedgerExportService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;

    private final CustomerRepository customerRepository;
    private final CustomerLedgerRepository ledgerRepository;

    public CustomerLedgerExportService(CustomerRepository customerRepository,
                                       CustomerLedgerRepository ledgerRepository) {
        this.customerRepository = customerRepository;
        this.ledgerRepository = ledgerRepository;
    }

    @Transactional(readOnly = true)
    public byte[] exportExcel(Long customerId, LocalDate dateFrom, LocalDate dateTo) {
        ExportData data = loadData(customerId, dateFrom, dateTo);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Ledger");
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);

            int rowIndex = 0;
            Row customerRow = sheet.createRow(rowIndex++);
            customerRow.createCell(0).setCellValue("Customer");
            customerRow.createCell(1).setCellValue(data.customer().getName());
            Row rangeRow = sheet.createRow(rowIndex++);
            rangeRow.createCell(0).setCellValue("Date range");
            rangeRow.createCell(1).setCellValue(formatDateRange(dateFrom, dateTo));
            Row openingRow = sheet.createRow(rowIndex++);
            openingRow.createCell(0).setCellValue("Opening balance");
            openingRow.createCell(1).setCellValue(data.openingBalance().doubleValue());
            rowIndex++;

            Row header = sheet.createRow(rowIndex++);
            String[] headers = {"Date", "Entry type", "Reference", "Description", "Debit", "Credit", "Running balance"};
            for (int index = 0; index < headers.length; index++) {
                header.createCell(index).setCellValue(headers[index]);
                header.getCell(index).setCellStyle(headerStyle);
            }

            for (CustomerLedgerEntry entry : data.entries()) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(entry.entryDate().format(DATE_FORMAT));
                row.createCell(1).setCellValue(entry.entryType());
                row.createCell(2).setCellValue(entry.reference());
                row.createCell(3).setCellValue(entry.description());
                row.createCell(4).setCellValue(entry.debit().doubleValue());
                row.createCell(5).setCellValue(entry.credit().doubleValue());
                row.createCell(6).setCellValue(entry.runningBalance().doubleValue());
            }

            Row closingRow = sheet.createRow(rowIndex);
            closingRow.createCell(0).setCellValue("Closing balance");
            closingRow.createCell(1).setCellValue(data.closingBalance().doubleValue());
            for (int index = 0; index < headers.length; index++) {
                sheet.autoSizeColumn(index);
            }
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to generate Excel ledger", exception);
        }
    }

    @Transactional(readOnly = true)
    public byte[] exportPdf(Long customerId, LocalDate dateFrom, LocalDate dateTo) {
        ExportData data = loadData(customerId, dateFrom, dateTo);
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 28, 28, 28, 28);
            PdfWriter.getInstance(document, output);
            document.open();

            com.lowagie.text.Font titleFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 16, com.lowagie.text.Font.BOLD);
            com.lowagie.text.Font labelFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 10, com.lowagie.text.Font.BOLD);
            document.add(new Paragraph("Customer Ledger", titleFont));
            document.add(new Paragraph("Customer: " + data.customer().getName()));
            document.add(new Paragraph("Date range: " + formatDateRange(dateFrom, dateTo)));
            document.add(new Paragraph("Opening balance: " + data.openingBalance().toPlainString()));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(new float[]{1.1f, 1.3f, 1.5f, 3.2f, 1.3f, 1.3f, 1.5f});
            table.setWidthPercentage(100);
            String[] headers = {"Date", "Entry", "Reference", "Description", "Debit", "Credit", "Balance"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, labelFont));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setBorder(Rectangle.BOTTOM);
                table.addCell(cell);
            }
            for (CustomerLedgerEntry entry : data.entries()) {
                table.addCell(entry.entryDate().format(DATE_FORMAT));
                table.addCell(entry.entryType());
                table.addCell(entry.reference());
                table.addCell(entry.description());
                table.addCell(entry.debit().toPlainString());
                table.addCell(entry.credit().toPlainString());
                table.addCell(entry.runningBalance().toPlainString());
            }
            document.add(table);
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Closing balance: " + data.closingBalance().toPlainString(), labelFont));
            document.close();
            return output.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to generate PDF ledger", exception);
        }
    }

    private ExportData loadData(Long customerId, LocalDate dateFrom, LocalDate dateTo) {
        Customer customer = customerRepository.findById(customerId)
                .filter(foundCustomer -> Boolean.TRUE.equals(foundCustomer.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id : " + customerId));
        List<CustomerLedger> allEntries = ledgerRepository
                .findAllByCustomerIdAndIsActiveTrueOrderByEntryDateAscIdAsc(customerId);
        BigDecimal openingBalance = allEntries.stream()
                .filter(entry -> dateFrom != null && entry.getEntryDate().isBefore(dateFrom))
                .map(entry -> entry.getDebit().subtract(entry.getCredit()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal runningBalance = openingBalance;
        List<CustomerLedgerEntry> entries = new ArrayList<>();
        for (CustomerLedger entry : allEntries) {
            if (dateFrom != null && entry.getEntryDate().isBefore(dateFrom)) continue;
            if (dateTo != null && entry.getEntryDate().isAfter(dateTo)) continue;
            runningBalance = runningBalance.add(entry.getDebit()).subtract(entry.getCredit());
            entries.add(new CustomerLedgerEntry(entry.getEntryDate(), entry.getEntryType(), entry.getReference(),
                    entry.getDescription(), entry.getDebit(), entry.getCredit(), runningBalance));
        }
        return new ExportData(customer, openingBalance, entries, runningBalance);
    }

    private String formatDateRange(LocalDate dateFrom, LocalDate dateTo) {
        return (dateFrom == null ? "Beginning" : dateFrom.format(DATE_FORMAT)) + " to "
                + (dateTo == null ? "Present" : dateTo.format(DATE_FORMAT));
    }

    private record ExportData(Customer customer, BigDecimal openingBalance,
                              List<CustomerLedgerEntry> entries, BigDecimal closingBalance) {
    }
}