package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CheckBiKhoaService {
    private final UserRepository userRepository;

    public AppException checkBiKhoa(Long accountID){
        Account account = userRepository.findById(accountID).orElseThrow(()->new AppException(ErrorCode.USER_NOT_EXISTED));
        System.out.println(
                account.getBiKhoa()
        );
        if(account.getBiKhoa() == true){
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }


        return null;
    }
}
