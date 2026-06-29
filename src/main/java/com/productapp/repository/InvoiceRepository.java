package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.productapp.entity.Invoice;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
}
