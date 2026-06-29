package com.productapp.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class TruckEntryRequest {

    @NotNull
    private LocalDate entryDate;

    @NotBlank
    private String truckNumber;

    @NotNull
    private Long materialTypeId;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal quantityBrass;

    private String supplierName;
    private String remarks;

    public LocalDate getEntryDate() {
        return entryDate;
    }

    public void setEntryDate(LocalDate entryDate) {
        this.entryDate = entryDate;
    }

    public String getTruckNumber() {
        return truckNumber;
    }

    public void setTruckNumber(String truckNumber) {
        this.truckNumber = truckNumber;
    }

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

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
