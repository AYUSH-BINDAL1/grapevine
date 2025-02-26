package com.grapevine.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.grapevine.model.EmailConfirmation;

public interface EmailConfirmationRepository extends JpaRepository<EmailConfirmation, String> {
}