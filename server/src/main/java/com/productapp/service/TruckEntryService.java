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

    public TruckEntryResponse createTruckEntry(TruckEntryRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        MaterialType materialType = materialRepository.findById(request.getMaterialTypeId())
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
        return truckEntryRepository.findAll().stream()
                .map(TruckEntryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public TruckEntryResponse getTruckEntryById(Long id) {
        TruckEntry truckEntry = truckEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Truck entry not found: " + id));
        return TruckEntryResponse.fromEntity(truckEntry);
    }

    public TruckEntryResponse updateTruckEntry(Long id, TruckEntryRequest request, String username) {
        TruckEntry existing = truckEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Truck entry not found: " + id));

        MaterialType materialType = materialRepository.findById(request.getMaterialTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Material type not found: " + request.getMaterialTypeId()));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        existing.setEntryDate(request.getEntryDate());
        existing.setTruckNumber(request.getTruckNumber());
        existing.setMaterialType(materialType);
        existing.setQuantityBrass(request.getQuantityBrass());
        existing.setSupplierName(request.getSupplierName());
        existing.setRemarks(request.getRemarks());

        return TruckEntryResponse.fromEntity(truckEntryRepository.save(existing));
    }

    public void deleteTruckEntry(Long id) {
        TruckEntry existing = truckEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Truck entry not found: " + id));
        truckEntryRepository.delete(existing);
    }
}
