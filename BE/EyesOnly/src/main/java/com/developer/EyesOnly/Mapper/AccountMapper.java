package com.developer.EyesOnly.Mapper;

import com.developer.EyesOnly.DTO.Request.AccountCreationRequest;
import com.developer.EyesOnly.DTO.Request.AccountUpdateRequest;
import com.developer.EyesOnly.DTO.Response.AccountResponse;
import com.developer.EyesOnly.Entity.Account;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface AccountMapper {
    Account toAccount(AccountCreationRequest request);
    AccountResponse toAccountResponse(Account account);
    public void updateUser(@MappingTarget Account account, AccountUpdateRequest request);

}
