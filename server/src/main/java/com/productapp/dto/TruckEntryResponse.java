package com.productapp.dto;

import com.productapp.entity.TruckEntry;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class TruckEntryResponse {
    private Long id;
    private LocalDate entryDate;
    private String truckNumber;
    private String materialName;
    private BigDecimal quantityBrass;
    private String supplierName;
    private String remarks;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public TruckEntryResponse() {
    }

    public TruckEntryResponse(Long id, LocalDate entryDate, String truckNumber, String materialName,
                              BigDecimal quantityBrass, String supplierName, String remarks,
                              String createdByUsername, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.entryDate = entryDate;
        this.truckNumber = truckNumber;
        this.materialName = materialName;
        this.quantityBrass = quantityBrass;
        this.supplierName = supplierName;
        this.remarks = remarks;
        this.createdByUsername = createdByUsername;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static TruckEntryResponse fromEntity(TruckEntry truckEntry) {
        if (truckEntry == null) {
            return null;
        }

        return new TruckEntryResponse(
                truckEntry.getId(),
                truckEntry.getEntryDate(),
                truckEntry.getTruckNumber(),
                truckEntry.getMaterialType() != null ? truckEntry.getMaterialType().getName() : null,
                truckEntry.getQuantityBrass(),
                truckEntry.getSupplierName(),
                truckEntry.getRemarks(),
                truckEntry.getCreatedBy() != null ? truckEntry.getCreatedBy().getUsername() : null,
                truckEntry.getCreatedAt(),
                truckEntry.getUpdatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public String getMaterialName() {
        return materialName;
    }

    public void setMaterialName(String materialName) {
        this.materialName = materialName;
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

    public String getCreatedByUsername() {
        return createdByUsername;
    }

    public void setCreatedByUsername(String createdByUsername) {
        this.createdByUsername = createdByUsername;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
