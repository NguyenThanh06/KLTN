package com.developer.EyesOnly.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "VerifyThanhCong")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyThanhCong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long verifyID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "KteoFileID")
    private KTEOFile kteoFile;

    private LocalDateTime ngayXacThuc;
}