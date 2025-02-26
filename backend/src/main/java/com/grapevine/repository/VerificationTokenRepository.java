package com.grapevine.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.grapevine.model.VerificationToken;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    VerificationToken findByToken(String token);
    VerificationToken findByUserEmail(String email);
}