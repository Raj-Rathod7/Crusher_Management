package com.productapp.controller;

import com.productapp.dto.TruckEntryRequest;
import com.productapp.entity.TruckEntry;
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
    public ResponseEntity<TruckEntry> createTruckEntry(
            @Valid @RequestBody TruckEntryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        TruckEntry created = truckEntryService.createTruckEntry(request, userDetails.getUsername());
        return ResponseEntity.status(201).body(created);
    }

    @GetMapping
    public ResponseEntity<List<TruckEntry>> getAllTruckEntries() {
        return ResponseEntity.ok(truckEntryService.getAllTruckEntries());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TruckEntry> getTruckEntry(@PathVariable Long id) {
        return ResponseEntity.ok(truckEntryService.getTruckEntryById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TruckEntry> updateTruckEntry(
            @PathVariable Long id,
            @Valid @RequestBody TruckEntryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        TruckEntry updated = truckEntryService.updateTruckEntry(id, request, userDetails.getUsername());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTruckEntry(@PathVariable Long id) {
        truckEntryService.deleteTruckEntry(id);
        return ResponseEntity.noContent().build();
    }
}
