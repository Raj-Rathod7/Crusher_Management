package com.productapp.entity;


import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

public class InvoiceItemRequest {

    @NotNull
    private Long materialTypeId;

    @NotNull
    private BigDecimal quantityBrass;

    @NotNull
    private BigDecimal rate;

     @NotNull
    private BigDecimal amount;

    

    @NotBlank
    private String truckNumber;

    public Long getMaterialTypeId() {
        return materialTypeId;
    }

    public void setMaterialTypeId(Long materialTypeId) {
        this.materialTypeId = materialTypeId;
    }

    public BigDecimal getQuantityBrass() {
        return quantityBrass;
    }

    public void setQuantityBrass(BigDecimal quantityBrass) {
        this.quantityBrass = quantityBrass;
    }

    public BigDecimal getRate() {
        return rate;
    }

    public void setRate(BigDecimal rate) {
        this.rate = rate;
    }

    public String getTruckNumber() {
        return truckNumber;
    }

    public void setTruckNumber(String truckNumber) {
        this.truckNumber = truckNumber;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    
}