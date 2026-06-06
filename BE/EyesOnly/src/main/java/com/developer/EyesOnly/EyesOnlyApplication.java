package com.developer.EyesOnly;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
@EnableScheduling
public class EyesOnlyApplication {

	public static void main(String[] args) {
		SpringApplication.run(EyesOnlyApplication.class, args);
		System.out.println(new BCryptPasswordEncoder().encode("123456"));
	}

}
