package com.productapp.service;

import com.productapp.entity.Customer;
import com.productapp.entity.CustomerPaymentRequest;
import com.productapp.entity.User;
import com.productapp.repository.CustomerRepository;
import com.productapp.repository.InvoiceRepository;
import com.productapp.repository.PaymentRepository;
import com.productapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private UserRepository userRepository;


    @InjectMocks
    private CustomerService customerService;

    @Test
    void recordPaymentShouldRejectNonPositiveAmount() {
        Customer customer = new Customer();
        customer.setId(10L);
        customer.setName("Alpha");
        customer.setIsActive(true);

        User user = new User();
        user.setId(7L);
        user.setUsername("demo");
        user.setIsActive(true);

        when(customerRepository.findByIdAndIsActiveTrue(10L)).thenReturn(Optional.of(customer));
        when(userRepository.findByUsernameAndIsActiveTrue("demo")).thenReturn(Optional.of(user));

        Authentication authentication = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                "demo", "password");
        SecurityContextHolder.getContext().setAuthentication(authentication);

        CustomerPaymentRequest request = new CustomerPaymentRequest();
        request.setAmount(BigDecimal.ZERO);
        request.setPaymentDate(LocalDate.now());
        request.setPaymentMode("cash");

        assertThrows(IllegalArgumentException.class, () -> customerService.recordPayment(10L, request));
        SecurityContextHolder.clearContext();
    }

}
