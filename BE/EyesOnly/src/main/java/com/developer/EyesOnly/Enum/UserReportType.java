package com.developer.EyesOnly.Enum;

import lombok.Getter;

@Getter
public enum UserReportType {

    FAKE("Tài khoản giả mạo"),
    HARASS("Quấy rối"),
    BADPROF("Nội dung không phù hợp"),
    BADAVT("Nội dung không phù hợp"),
    SPAM("Spam"),
    SCAM("Lừa đảo"),
    OTHER("Khác");

    private final String value;

    UserReportType(String value) {
        this.value = value;
    }

    public static boolean isValid(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }

        String normalizedValue = value.trim();

        for (UserReportType type : UserReportType.values()) {
            if (type.name().equals(normalizedValue) || type.value.equals(normalizedValue)) {
                return true;
            }
        }

        return false;
    }
}
