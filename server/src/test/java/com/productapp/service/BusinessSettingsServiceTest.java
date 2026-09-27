package com.productapp.service;

import com.productapp.entity.BusinessSettings;
import com.productapp.repository.BusinessSettingsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BusinessSettingsServiceTest {
    @Mock
    private BusinessSettingsRepository businessSettingsRepository;

    @InjectMocks
    private BusinessSettingsService businessSettingsService;

    @Test
    void getSettingsReturnsConfiguredBusinessDetails() {
        BusinessSettings settings = new BusinessSettings();
        settings.setBusinessName("Crusher Management");
        settings.setAddress("Industrial Road");
        settings.setPhone("1234567890");
        when(businessSettingsRepository.findById(1L)).thenReturn(Optional.of(settings));

        var response = businessSettingsService.getSettings();

        assertEquals("Crusher Management", response.businessName());
        assertEquals("Industrial Road", response.address());
        assertEquals("1234567890", response.phone());
    }

    @Test
    void getSettingsReturnsEmptyDetailsWhenSingletonIsMissing() {
        when(businessSettingsRepository.findById(1L)).thenReturn(Optional.empty());

        var response = businessSettingsService.getSettings();

        assertEquals(null, response.businessName());
        assertEquals(null, response.address());
        assertEquals(null, response.phone());
    }
}