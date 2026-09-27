package com.productapp.dto;

import com.productapp.entity.BusinessSettings;

public record BusinessSettingsResponse(String businessName, String address, String phone) {
    public static BusinessSettingsResponse fromEntity(BusinessSettings settings) {
        return new BusinessSettingsResponse(
                settings.getBusinessName(),
                settings.getAddress(),
                settings.getPhone());
    }

    public static BusinessSettingsResponse empty() {
        return new BusinessSettingsResponse(null, null, null);
    }
}