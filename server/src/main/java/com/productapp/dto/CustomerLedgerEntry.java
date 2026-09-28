package com.productapp.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CustomerLedgerEntry(
        LocalDate entryDate,
        String entryType,
        String reference,
        String description,
        BigDecimal debit,
        BigDecimal credit,
        BigDecimal runningBalance) {
}