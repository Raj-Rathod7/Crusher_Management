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
    @Index(name = "idx_payments_invoice", columnList = "invoice_id"),
    @Index(name = "idx_payments_customer", columnList = "customer_id"),
    @Index(name = "idx_payments_entry_type", columnList = "entry_type")
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
    @JoinColumn(name = "invoice_id", nullable = true)
    private Invoice invoice;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 20)
    private String paymentMode;

    @Column(length = 30)
    private String chequeNumber;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // ADVANCE_RECEIPT, CREDIT_APPLIED, INVOICE_PAYMENT, CREDIT_REFUND, CREDIT_ADJUSTMENT
    @Column(name = "entry_type", nullable = false, length = 30)
    private String entryType;

    // CREDIT_IN / CREDIT_OUT; null for plain INVOICE_PAYMENT rows (not part of credit ledger)
    @Column(name = "direction", length = 20)
    private String direction;

    @Column(name = "receipt_number", length = 40, unique = true)
    private String receiptNumber;

    @Column(name = "external_ref", length = 100)
    private String externalRef;

    // links a CREDIT_APPLIED/CREDIT_ADJUSTMENT row back to the ADVANCE_RECEIPT it drew from
    @ManyToOne
    @JoinColumn(name = "source_receipt_id", nullable = true)
    private Payment sourceReceipt;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

}
