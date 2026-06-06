package com.developer.EyesOnly.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ChanAccount")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChanAccount {

    @EmbeddedId
    private ChanAccountId id;

    // người bị chặn
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("accountBiChan")
    @JoinColumn(name = "AccountBiChan")
    private Account accountBiChan;

    // người chặn
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("accountChan")
    @JoinColumn(name = "AccountChan")
    private Account accountChan;
}