package com.developer.EyesOnly.Enum;

import lombok.Getter;

@Getter
public enum ReportType {
    uncomf("Nội dung khiến mình chưa thoải mái"),
    adult("Nội dung nhạy cảm hoặc người lớn chưa được đánh dấu"),
    gore("Hình ảnh bạo lực, máu me hoặc gây ám ảnh"),
    minor("Nội dung liên quan đến trẻ vị thành niên cần được xem lại"),
    hate("Nội dung công kích, kỳ thị hoặc xúc phạm người khác"),
    copyr("Mình lo có vấn đề về quyền tác phẩm"),
    ai("Tác phẩm có thể dùng AI nhưng chưa được ghi rõ"),
    tag("Tag, mô tả hoặc phân loại không phù hợp"),
    spam("Bài đăng lặp lại, spam hoặc gây nhiễu"),
    other("Lý do khác");

    private final String displayName;

    ReportType(String displayName) {
        this.displayName = displayName;
    }
}