package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.productapp.entity.TruckEntry;

public interface TruckEntryRepository extends JpaRepository<TruckEntry, Long> {

	List<TruckEntry> findAllByIsActiveTrueOrderByCreatedAtDesc();

	Page<TruckEntry> findAllByIsActiveTrueOrderByCreatedAtDesc(Pageable pageable);

	List<TruckEntry> findAllByIsActiveTrueAndEntryDateOrderByCreatedAtDesc(LocalDate entryDate);

	Page<TruckEntry> findAllByIsActiveTrueAndEntryDateOrderByCreatedAtDesc(LocalDate entryDate, Pageable pageable);

	long countByIsActiveTrue();

	@Query("select count(t) from TruckEntry t "
			+ "where (:dateFrom is null or t.entryDate >= :dateFrom) and (:dateTo is null or t.entryDate <= :dateTo)")
	long countByDateRange(@Param("dateFrom") LocalDate dateFrom, @Param("dateTo") LocalDate dateTo);

	@Query("select t.entryDate, count(t), coalesce(sum(t.quantityBrass), 0) from TruckEntry t "
			+ "where (:dateFrom is null or t.entryDate >= :dateFrom) "
			+ "and (:dateTo is null or t.entryDate <= :dateTo) "
			+ "group by t.entryDate order by t.entryDate")
	List<Object[]> inwardByDate(@Param("dateFrom") LocalDate dateFrom, @Param("dateTo") LocalDate dateTo);
}
