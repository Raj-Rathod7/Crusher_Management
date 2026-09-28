package com.productapp.entity;

import jakarta.validation.constraints.NotBlank;

public class ReversePaymentRequest {

    @NotBlank
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
