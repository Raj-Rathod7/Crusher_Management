package com.productapp.controller;

import com.productapp.dto.PaymentResponse;
import com.productapp.entity.CustomerPaymentRequest;
import com.productapp.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public List<PaymentResponse> getAll() {
        return paymentService.getAll();
    }

    @GetMapping("/{id}")
    public PaymentResponse getById(@PathVariable Long id) {
        return paymentService.getById(id);
    }

    @PutMapping("/{id}")
    public PaymentResponse update(@PathVariable Long id, @Valid @RequestBody CustomerPaymentRequest request) {
        return paymentService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        paymentService.delete(id);
    }
}
