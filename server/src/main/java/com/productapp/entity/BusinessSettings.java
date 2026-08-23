package com.productapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "business_settings")
@SQLRestriction("is_active = true")
@SQLDelete(sql = "UPDATE business_settings SET is_active = false WHERE id = ?")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessSettings extends AuditableEntity {

    @Id
    private Long id;

    @Column(nullable = false, length = 100)
    private String businessName;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 20)
    private String phone;

}
