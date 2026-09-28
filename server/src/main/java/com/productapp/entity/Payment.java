package com.productapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payments_date", columnList = "payment_date"),
    @Index(name = "idx_payments_customer", columnList = "customer_id"),
    @Index(name = "idx_payments_entry_type", columnList = "entry_type"),
    @Index(name = "idx_payments_invoice", columnList = "invoice_id", unique = true)
})
@SQLRestriction("is_active = true")
@SQLDelete(sql = "UPDATE payments SET is_active = false WHERE id = ?")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate paymentDate;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @OneToOne
    @JoinColumn(name = "invoice_id", unique = true)
    private Invoice invoice;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 20)
    private String paymentMode;

    @Column(length = 30)
    private String chequeNumber;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "entry_type", nullable = false, length = 30)
    private String entryType;

    @Column(name = "external_ref", length = 100)
    private String externalRef;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

}
