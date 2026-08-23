package com.productapp.dto;

import com.productapp.entity.InvoiceItem;
import java.math.BigDecimal;

public class InvoiceItemResponse {
    
    private Long id;
    private Long materialTypeId;
    private String materialName;
    private BigDecimal quantityBrass;
    private BigDecimal rate;
    private BigDecimal amount;
    private String truckNumber;

    public InvoiceItemResponse() {
    }

    public static InvoiceItemResponse fromEntity(InvoiceItem item) {
        if (item == null) return null;
        InvoiceItemResponse r = new InvoiceItemResponse();
        r.setId(item.getId());
        r.setMaterialTypeId(item.getMaterialType() != null ? item.getMaterialType().getId() : null);
        r.setMaterialName(item.getMaterialType() != null ? item.getMaterialType().getName() : null);
        r.setQuantityBrass(item.getQuantityBrass());
        r.setRate(item.getRate());
        r.setAmount(item.getAmount());
        r.setTruckNumber(item.getTruckNumber());
        return r;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMaterialTypeId() {
        return materialTypeId;
    }

    public void setMaterialTypeId(Long materialTypeId) {
        this.materialTypeId = materialTypeId;
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

    public BigDecimal getRate() {
        return rate;
    }

    public void setRate(BigDecimal rate) {
        this.rate = rate;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getTruckNumber() {
        return truckNumber;
    }

    public void setTruckNumber(String truckNumber) {
        this.truckNumber = truckNumber;
    } 
    



}
