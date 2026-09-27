package com.productapp.controller;

import com.productapp.dto.BusinessSettingsResponse;
import com.productapp.service.BusinessSettingsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/business-settings")
public class BusinessSettingsController {
    private final BusinessSettingsService businessSettingsService;

    public BusinessSettingsController(BusinessSettingsService businessSettingsService) {
        this.businessSettingsService = businessSettingsService;
    }

    @GetMapping
    public BusinessSettingsResponse getSettings() {
        return businessSettingsService.getSettings();
    }
}