package com.productapp.service;

import com.productapp.dto.CustomerResponse;
import com.productapp.entity.Customer;
import com.productapp.repository.CustomerRepository;
import com.productapp.repository.InvoiceRepository;
import com.productapp.repository.PaymentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private CustomerService customerService;

    @Test
    void getByIdShouldReturnCustomerResponse() {
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setName("Apex Traders");
        customer.setPhone("1234567890");
        customer.setAddress("Main Road");
        customer.setIsActive(true);

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(invoiceRepository.sumOutstandingBalanceByCustomerId(1L)).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.sumAmountByCustomerIdAndDirection(1L, "CREDIT_IN")).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.sumAmountByCustomerIdAndDirection(1L, "CREDIT_OUT")).thenReturn(BigDecimal.ZERO);

        CustomerResponse response = customerService.getById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Apex Traders", response.getName());
        assertEquals("1234567890", response.getPhone());
    }
}
