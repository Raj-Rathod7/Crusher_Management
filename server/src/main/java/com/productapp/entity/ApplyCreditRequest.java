package com.productapp.entity;

import java.math.BigDecimal;

public class ApplyCreditRequest {

    private BigDecimal creditToApply;

    public BigDecimal getCreditToApply() {
        return creditToApply;
    }

    public void setCreditToApply(BigDecimal creditToApply) {
        this.creditToApply = creditToApply;
    }
}
