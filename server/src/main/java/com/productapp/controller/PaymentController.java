package com.productapp.controller;

import com.productapp.dto.AdvanceReceiptResponse;
import com.productapp.dto.PaymentResponse;
import com.productapp.entity.AdvanceReceiptRequest;
import com.productapp.entity.Payment;
import com.productapp.entity.ReversePaymentRequest;
import com.productapp.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public PaymentResponse create(@RequestBody Payment payment) {
        return paymentService.save(payment);
    }

    @GetMapping
    public List<PaymentResponse> getAll() {
        return paymentService.getAll();
    }

    @GetMapping("/{id}")
    public PaymentResponse getById(@PathVariable Long id) {
        return paymentService.getById(id);
    }

    @PostMapping("/advance")
    public AdvanceReceiptResponse createAdvanceReceipt(@Valid @RequestBody AdvanceReceiptRequest request) {
        return paymentService.createAdvanceReceipt(request);
    }

    @GetMapping("/receipts")
    public List<PaymentResponse> getReceipts(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        return paymentService.listReceipts(customerId, dateFrom, dateTo);
    }

    @PostMapping("/{id}/reverse")
    public AdvanceReceiptResponse reverse(@PathVariable Long id, @Valid @RequestBody ReversePaymentRequest request) {
        return paymentService.reverseReceipt(id, request);
    }
}
