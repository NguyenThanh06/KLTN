package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Request.BaoCaoUserRequest;
import com.developer.EyesOnly.DTO.Response.BaoCaoUserResponse;
import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Entity.BaoCaoUser;
import com.developer.EyesOnly.Enum.UserReportType;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Repository.BaoCaoUserRepository;
import com.developer.EyesOnly.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class BaoCaoUserService {

    private final BaoCaoUserRepository baoCaoUserRepository;
    private final UserRepository userRepository;
    private final CheckBiKhoaService checkBiKhoaService;
    @Transactional
    public BaoCaoUserResponse reportUser(
            Long currentAccountId,
            Long targetAccountId,
            BaoCaoUserRequest request
    ) {
        checkBiKhoaService.checkBiKhoa(currentAccountId);
        if (currentAccountId.equals(targetAccountId)) {
            throw new AppException(ErrorCode.CANNOT_REPORT_YOURSELF);
        }

        Account targetAccount = userRepository.findById(targetAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if(targetAccount.getBiKhoa()==true)
            throw new AppException(ErrorCode.DA_BI_KHOA);
        boolean alreadyReported =
                baoCaoUserRepository.existsByAccount_AccountIDAndNguoiBaoCao_AccountID(
                        targetAccountId,
                        currentAccountId
                );

        if (alreadyReported) {
            throw new AppException(ErrorCode.USER_ALREADY_REPORTED);
        }
        validateReportRequest(request);
        Account reporterAccount = userRepository.findById(currentAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        BaoCaoUser baoCaoUser = BaoCaoUser.builder()
                .account(targetAccount)
                .nguoiBaoCao(reporterAccount)
                .ngayBaoCao(LocalDateTime.now())
                .mucBaoCao(request.getMucBaoCao().trim())
                .noiDungBaoCao(request.getNoiDungBaoCao().trim())
                .build();

        BaoCaoUser savedReport = baoCaoUserRepository.save(baoCaoUser);

        return BaoCaoUserResponse.builder()
                .baoCaoUID(savedReport.getBaoCaoUID())
                .accountID(targetAccount.getAccountID())
                .username(targetAccount.getUsername())
                .tenHienThi(targetAccount.getTenHienThi())
                .mucBaoCao(savedReport.getMucBaoCao())
                .noiDungBaoCao(savedReport.getNoiDungBaoCao())
                .ngayBaoCao(savedReport.getNgayBaoCao())
                .message("Bạn đã báo cáo người dùng thành công. Chúng tôi sẽ tiến hành xem xét sớm nhất")
                .build();
    }

    private void validateReportRequest(BaoCaoUserRequest request) {
        System.out.println(request.getMucBaoCao());
        if (request.getMucBaoCao() == null || request.getMucBaoCao().isBlank()) {
            throw new AppException(ErrorCode.REPORT_TYPE_BLANK);
        }

        if (request.getNoiDungBaoCao() == null || request.getNoiDungBaoCao().isBlank()) {
            throw new AppException(ErrorCode.REPORT_CONTENT_BLANK);
        }

        String mucBaoCao = request.getMucBaoCao().trim();

        if (!com.developer.EyesOnly.Enum.UserReportType.isValid(mucBaoCao)) {
            throw new AppException(ErrorCode.REPORT_TYPE_INVALID);
        }

        String noiDungBaoCao = request.getNoiDungBaoCao().trim();

        if (noiDungBaoCao.length() > 500) {
            throw new AppException(ErrorCode.REPORT_CONTENT_TOO_LONG);
        }
    }
}