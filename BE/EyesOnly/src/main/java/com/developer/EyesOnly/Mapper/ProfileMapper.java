package com.developer.EyesOnly.Mapper;

import com.developer.EyesOnly.DTO.Response.*;
import com.developer.EyesOnly.Entity.*;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
public class ProfileMapper {

    public MyProfileResponse toMyProfileResponse(
            Account account,
            long soNguoiTheoDoi,
            long soNguoiDangTheoDoi,
            PageResponse<PostProfileResponse> thuVienTacPham
    ) {
        return MyProfileResponse.builder()
                .accountID(account.getAccountID())
                .username(account.getUsername())
                .tenHienThi(account.getTenHienThi())
                .avatar(account.getAvatar())
                .email(account.getEmail())
                .tieuSu(account.getTieuSu())
                .soNguoiTheoDoi(soNguoiTheoDoi)
                .soNguoiDangTheoDoi(soNguoiDangTheoDoi)
                .ngayThamGia(account.getNgayTaoTaiKhoan())
                .daVoHieuHoa(account.getDaVoHieuHoa())
                .ngayVoHieuHoa(Boolean.TRUE.equals(account.getDaVoHieuHoa())
                        ? account.getNgayVoHieuHoa()
                        : null)
                .thuVienTacPham(thuVienTacPham)
                .build();
    }

    public PostProfileResponse toPostProfileResponse(Post post) {
        return PostProfileResponse.builder()
                .postID(post.getPostID())
                .tieuDe(post.getTieuDe())
                .moTa(post.getMoTa())
                .ngayDang(post.getNgayDang())
                .luotXem(post.getLuotXem())
                .sanPhamAI(post.getSanPhamAI())
                .hanCheHienThi(post.getHanCheHienThi())
                .choPhepComment(post.getChoPhepComment())
                .congKhai(post.getCongKhai())
                .lstKTEOFile(toKteoFileResponses(post.getFiles()))
                .build();
    }

    public List<KteoFileResponse> toKteoFileResponses(List<KTEOFile> files) {
        if (files == null) {
            return List.of();
        }

        return files.stream()
                .sorted(Comparator.comparing(
                        KTEOFile::getThuTu,
                        Comparator.nullsLast(Integer::compareTo)
                ))
                .map(file -> KteoFileResponse.builder()
                        .fileID(file.getFileID())
                        .link(file.getLink())
                        .width(file.getWidth())
                        .height(file.getHeight())
                        .thuTu(file.getThuTu())
                        .verifyKey(file.getVerifyKey())
                        .build())
                .toList();
    }

    public List<String> toTagNames(List<GanThe> ganThes) {
        if (ganThes == null) {
            return List.of();
        }

        return ganThes.stream()
                .map(GanThe::getTag)
                .filter(tag -> tag != null)
                .map(Tag::getTenTag)
                .distinct()
                .toList();
    }

    public PageResponse<PostProfileResponse> toPostPageResponse(
            Page<Long> postIdPage,
            List<PostProfileResponse> posts
    ) {
        return PageResponse.<PostProfileResponse>builder()
                .content(posts)
                .page(postIdPage.getNumber())
                .size(postIdPage.getSize())
                .totalElements(postIdPage.getTotalElements())
                .totalPages(postIdPage.getTotalPages())
                .first(postIdPage.isFirst())
                .last(postIdPage.isLast())
                .build();
    }
}