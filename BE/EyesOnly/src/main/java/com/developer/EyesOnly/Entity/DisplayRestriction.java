package com.developer.EyesOnly.Entity;

import lombok.Getter;

import lombok.Getter;

@Getter
public enum DisplayRestriction {

    ALL((byte) 0, "Mọi độ tuổi"),
    R_18((byte) 1, "Nội dung 18+"),
    R_18G((byte) 2, "Nội dung bạo lực / máu me"),
    TEMP_HIDDEN((byte) 99, "Đã tạm ẩn");

    private final Byte value;
    private final String displayName;

    DisplayRestriction(byte value, String displayName) {
        this.value = value;
        this.displayName = displayName;
    }

    public static DisplayRestriction fromString(String input) {
        if (input == null) {
            return null;
        }

        return switch (input.trim().toUpperCase()) {
            case "ALL" -> ALL;
            case "R_18" -> R_18;
            case "R_18G" -> R_18G;
            case "TEMP_HIDDEN" -> TEMP_HIDDEN;
            default -> null;
        };
    }

    public static DisplayRestriction fromValue(Byte value) {
        if (value == null) {
            return null;
        }

        for (DisplayRestriction restriction : DisplayRestriction.values()) {
            if (restriction.value == value) {
                return restriction;
            }
        }

        return null;
    }

    public static String getDisplayNameByValue(Byte value) {
        DisplayRestriction restriction = fromValue(value);

        return restriction == null
                ? "Không xác định"
                : restriction.getDisplayName();
    }
}
