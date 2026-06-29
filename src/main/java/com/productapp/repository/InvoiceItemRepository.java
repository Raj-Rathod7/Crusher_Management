package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.productapp.entity.InvoiceItem;

public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, Long> {
}
