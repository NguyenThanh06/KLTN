package com.developer.EyesOnly.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "TheoDoiAccount")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TheoDoiAccount {

    @EmbeddedId
    private TheoDoiAccountId id;

    // người bị follow
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("accountDuocTheoDoi")
    @JoinColumn(name = "AccountDuocTheoDoi")
    private Account accountDuocTheoDoi;

    // người follow
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("accountTheoDoi")
    @JoinColumn(name = "AccountTheoDoi")
    private Account accountTheoDoi;
}