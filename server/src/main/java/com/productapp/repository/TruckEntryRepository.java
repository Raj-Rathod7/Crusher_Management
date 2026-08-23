package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.productapp.entity.TruckEntry;

public interface TruckEntryRepository extends JpaRepository<TruckEntry, Long> {

	List<TruckEntry> findAllByIsActiveTrue();

	Page<TruckEntry> findAllByIsActiveTrue(Pageable pageable);

	long countByIsActiveTrue();
}
