package com.productapp.service;

import com.productapp.dto.TruckEntryRequest;
import com.productapp.dto.TruckEntryResponse;
import com.productapp.entity.MaterialType;
import com.productapp.entity.TruckEntry;
import com.productapp.entity.User;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.MaterialRepository;
import com.productapp.repository.TruckEntryRepository;
import com.productapp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TruckEntryService {

    private final TruckEntryRepository truckEntryRepository;
    private final MaterialRepository materialRepository;
    private final UserRepository userRepository;

    public TruckEntryService(TruckEntryRepository truckEntryRepository,
                             MaterialRepository materialRepository,
                             UserRepository userRepository) {
        this.truckEntryRepository = truckEntryRepository;
        this.materialRepository = materialRepository;
        this.userRepository = userRepository;
    }

        @Transactional
        public TruckEntryResponse createTruckEntry(TruckEntryRequest request, String username) {
        User user = userRepository.findByUsernameAndIsActiveTrue(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        MaterialType materialType = materialRepository.findByIdAndIsActiveTrue(request.getMaterialTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Material type not found: " + request.getMaterialTypeId()));

		/*
		 * TruckEntry truckEntry = TruckEntry.builder()
		 * .entryDate(request.getEntryDate()) .truckNumber(request.getTruckNumber())
		 * .materialType(materialType) .quantityBrass(request.getQuantityBrass())
		 * .supplierName(request.getSupplierName()) .remarks(request.getRemarks())
		 * .createdBy(user) .build();
		 */
        
        TruckEntry truckEntry = new TruckEntry();
        truckEntry.setEntryDate(request.getEntryDate());
        truckEntry.setTruckNumber(request.getTruckNumber());
        truckEntry.setMaterialType(materialType);
        truckEntry.setQuantityBrass(request.getQuantityBrass());
        truckEntry.setSupplierName(request.getSupplierName());
        truckEntry.setRemarks(request.getRemarks());
        truckEntry.setCreatedBy(user);
        return TruckEntryResponse.fromEntity(truckEntryRepository.save(truckEntry));
    }

    public List<TruckEntryResponse> getAllTruckEntries() {
        return truckEntryRepository.findAllByIsActiveTrue().stream()
                .map(TruckEntryResponse::fromEntity)
                .collect(Collectors.toList());
    }

        public Page<TruckEntryResponse> getPage(Pageable pageable) {
                return truckEntryRepository.findAllByIsActiveTrue(pageable).map(TruckEntryResponse::fromEntity);
        }

    public TruckEntryResponse getTruckEntryById(Long id) {
        TruckEntry truckEntry = truckEntryRepository.findById(id)
                .filter(entry -> Boolean.TRUE.equals(entry.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Truck entry not found: " + id));
        return TruckEntryResponse.fromEntity(truckEntry);
    }

        @Transactional
        public TruckEntryResponse updateTruckEntry(Long id, TruckEntryRequest request, String username) {
        TruckEntry existing = truckEntryRepository.findById(id)
                .filter(entry -> Boolean.TRUE.equals(entry.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Truck entry not found: " + id));

        MaterialType materialType = materialRepository.findByIdAndIsActiveTrue(request.getMaterialTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Material type not found: " + request.getMaterialTypeId()));

        User user = userRepository.findByUsernameAndIsActiveTrue(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        existing.setEntryDate(request.getEntryDate());
        existing.setTruckNumber(request.getTruckNumber());
        existing.setMaterialType(materialType);
        existing.setQuantityBrass(request.getQuantityBrass());
        existing.setSupplierName(request.getSupplierName());
        existing.setRemarks(request.getRemarks());

        return TruckEntryResponse.fromEntity(truckEntryRepository.save(existing));
    }

        @Transactional
        public void deleteTruckEntry(Long id) {
        TruckEntry existing = truckEntryRepository.findById(id)
                .filter(entry -> Boolean.TRUE.equals(entry.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Truck entry not found: " + id));
        existing.setIsActive(false);
        truckEntryRepository.save(existing);
    }
}
