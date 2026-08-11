package com.productapp.controller;

import com.productapp.dto.TruckEntryRequest;
import com.productapp.dto.TruckEntryResponse;
import com.productapp.service.TruckEntryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/truck-entries")
public class TruckEntryController {

    private final TruckEntryService truckEntryService;

    public TruckEntryController(TruckEntryService truckEntryService) {
        this.truckEntryService = truckEntryService;
    }

    @PostMapping
    public ResponseEntity<TruckEntryResponse> createTruckEntry(
            @Valid @RequestBody TruckEntryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        TruckEntryResponse created = truckEntryService.createTruckEntry(request, userDetails.getUsername());
        return ResponseEntity.status(201).body(created);
    }

    @GetMapping
    public ResponseEntity<List<TruckEntryResponse>> getAllTruckEntries() {
        return ResponseEntity.ok(truckEntryService.getAllTruckEntries());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TruckEntryResponse> getTruckEntry(@PathVariable Long id) {
        return ResponseEntity.ok(truckEntryService.getTruckEntryById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TruckEntryResponse> updateTruckEntry(
            @PathVariable Long id,
            @Valid @RequestBody TruckEntryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        TruckEntryResponse updated = truckEntryService.updateTruckEntry(id, request, userDetails.getUsername());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTruckEntry(@PathVariable Long id) {
        truckEntryService.deleteTruckEntry(id);
        return ResponseEntity.noContent().build();
    }
}
