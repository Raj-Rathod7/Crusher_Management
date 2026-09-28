package com.productapp.controller;

import com.productapp.dto.DashboardChartsResponse;
import com.productapp.dto.DashboardResponse;
import com.productapp.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public DashboardResponse getSummary(
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo) {
        return dashboardService.getSummary(dateFrom, dateTo);
    }

    @GetMapping("/charts")
    public DashboardChartsResponse getCharts(
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo) {
        return dashboardService.getCharts(dateFrom, dateTo);
    }
}