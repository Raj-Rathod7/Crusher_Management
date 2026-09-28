package com.productapp.service;

import com.productapp.dto.BusinessSettingsResponse;
import com.productapp.repository.BusinessSettingsRepository;
import org.springframework.stereotype.Service;

@Service
public class BusinessSettingsService {
    private static final long SETTINGS_ID = 1L;

    private final BusinessSettingsRepository businessSettingsRepository;

    public BusinessSettingsService(BusinessSettingsRepository businessSettingsRepository) {
        this.businessSettingsRepository = businessSettingsRepository;
    }

    public BusinessSettingsResponse getSettings() {
        return businessSettingsRepository.findById(SETTINGS_ID)
                .map(BusinessSettingsResponse::fromEntity)
                .orElseGet(BusinessSettingsResponse::empty);
    }
}