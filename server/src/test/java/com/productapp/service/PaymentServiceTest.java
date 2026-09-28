package com.productapp.service;

import com.productapp.entity.Customer;
import com.productapp.entity.CustomerLedger;
import com.productapp.entity.CustomerPaymentRequest;
import com.productapp.entity.Payment;
import com.productapp.repository.CustomerLedgerRepository;
import com.productapp.repository.CustomerRepository;
import com.productapp.repository.PaymentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CustomerLedgerRepository customerLedgerRepository;

    @InjectMocks
    private PaymentService paymentService;

    @Test
    void updatePaymentMutatesExistingLedgerEntry() {
        Customer customer = customer();
        Payment payment = payment(customer);
        CustomerLedger ledger = ledger();
        CustomerPaymentRequest request = request();

        when(paymentRepository.findById(22L)).thenReturn(Optional.of(payment));
        when(customerRepository.findByIdAndIsActiveTrue(10L)).thenReturn(Optional.of(customer));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(customerLedgerRepository.findFirstBySourceTypeAndSourceIdAndIsActiveTrueOrderByIdDesc("PAYMENT", 22L))
                .thenReturn(Optional.of(ledger));

        paymentService.update(22L, request);

        verify(customerLedgerRepository).save(ledger);
        assertEquals("CUSTOMER_PAYMENT", ledger.getEntryType());
        assertEquals(new BigDecimal("175"), ledger.getCredit());
        assertEquals(BigDecimal.ZERO, ledger.getDebit());
        assertEquals(LocalDate.of(2026, 9, 24), ledger.getEntryDate());
    }

    @Test
    void deletePaymentSoftDeactivatesExistingLedgerEntry() {
        Customer customer = customer();
        Payment payment = payment(customer);
        CustomerLedger ledger = ledger();

        when(paymentRepository.findById(22L)).thenReturn(Optional.of(payment));
        when(customerLedgerRepository.findFirstBySourceTypeAndSourceIdAndIsActiveTrueOrderByIdDesc("PAYMENT", 22L))
                .thenReturn(Optional.of(ledger));

        paymentService.delete(22L);

        verify(customerLedgerRepository).save(ledger);
        verify(paymentRepository).save(payment);
        assertEquals(false, ledger.getIsActive());
        assertEquals("CUSTOMER_PAYMENT", ledger.getEntryType());
    }

    private Customer customer() {
        Customer customer = new Customer();
        customer.setId(10L);
        customer.setName("Alpha");
        customer.setIsActive(true);
        return customer;
    }

    private Payment payment(Customer customer) {
        Payment payment = new Payment();
        payment.setId(22L);
        payment.setCustomer(customer);
        payment.setAmount(new BigDecimal("125"));
        payment.setPaymentDate(LocalDate.of(2026, 9, 23));
        payment.setPaymentMode("cash");
        payment.setIsActive(true);
        return payment;
    }

    private CustomerLedger ledger() {
        CustomerLedger ledger = new CustomerLedger();
        ledger.setId(31L);
        ledger.setIsActive(true);
        ledger.setEntryType("CUSTOMER_PAYMENT");
        ledger.setSourceType("PAYMENT");
        ledger.setSourceId(22L);
        return ledger;
    }

    private CustomerPaymentRequest request() {
        CustomerPaymentRequest request = new CustomerPaymentRequest();
        request.setAmount(new BigDecimal("175"));
        request.setPaymentDate(LocalDate.of(2026, 9, 24));
        request.setPaymentMode("cash");
        request.setNotes("Updated payment");
        return request;
    }
}