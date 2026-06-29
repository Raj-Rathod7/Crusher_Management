package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.productapp.entity.TruckEntry;

public interface TruckEntryRepository extends JpaRepository<TruckEntry, Long> {
}
