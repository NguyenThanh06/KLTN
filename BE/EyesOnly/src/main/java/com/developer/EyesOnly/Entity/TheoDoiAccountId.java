package com.developer.EyesOnly.Entity;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TheoDoiAccountId implements Serializable {

    // người bị follow
    private Long accountDuocTheoDoi;

    // người follow
    private Long accountTheoDoi;
}