package com.developer.EyesOnly.Security;

import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Account user = userRepository.findByEmail(email);

        if (user == null) {
            throw new UsernameNotFoundException("User not found");
        }

        return new User(
                user.getEmail(),
                user.getPassword(),
                Collections.emptyList()
        );
    }
}