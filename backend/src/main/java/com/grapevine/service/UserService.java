package com.grapevine.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.grapevine.model.User;
import com.grapevine.model.EmailConfirmation;
import com.grapevine.repository.UserRepository;
import com.grapevine.repository.EmailConfirmationRepository;
import com.grapevine.exception.UserNotFoundException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Random;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.web.bind.annotation.CrossOrigin;

@Service
@RequiredArgsConstructor

public class UserService {
    private final UserRepository userRepository;
    private final EmailConfirmationRepository emailConfirmationRepository;
    private final EmailService emailService;

    public void createUser(User user) {
        // Check if user already exists
        if (userRepository.existsById(user.getUserEmail())) {
            throw new IllegalArgumentException("User already exists with email: " + user.getUserEmail());
        }

        // Generate and save confirmation code
        String confirmationCode = generateConfirmationCode();
        EmailConfirmation emailConfirmation = new EmailConfirmation();
        emailConfirmation.setUserEmail(user.getUserEmail());
        emailConfirmation.setConfirmationCode(confirmationCode);
        emailConfirmation.setExpirationTime(LocalDateTime.now().plusHours(1));

        // Store the unconfirmed user data temporarily
        emailConfirmation.setUserJson(convertUserToJson(user));
        emailConfirmationRepository.save(emailConfirmation);

        try {
            String emailText = String.format(
                    "Welcome to Grapevine! Please confirm your email using this code: %s\n" +
                            "This code will expire in 1 hour.", confirmationCode);
            emailService.sendEmail(user.getUserEmail(), "Confirm Your Email", emailText);
        } catch (MessagingException e) {
            emailConfirmationRepository.delete(emailConfirmation);
            throw new RuntimeException("Failed to send confirmation email", e);
        }
    }

    public void confirmEmail(String userEmail, String confirmationCode) {
        EmailConfirmation confirmation = emailConfirmationRepository.findById(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("No pending confirmation for: " + userEmail));

        if (!confirmation.getConfirmationCode().equals(confirmationCode)) {
            throw new IllegalArgumentException("Invalid confirmation code");
        }

        if (confirmation.getExpirationTime().isBefore(LocalDateTime.now())) {
            emailConfirmationRepository.delete(confirmation);
            throw new IllegalArgumentException("Confirmation code has expired");
        }

        // Convert stored JSON back to User object and save
        User user = convertJsonToUser(confirmation.getUserJson());
        user.setEmailConfirmed(true);
        userRepository.save(user);
        emailConfirmationRepository.delete(confirmation);
    }

    public User getUserByEmail(String userEmail) {
        return userRepository.findById(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + userEmail));
    }

    private String generateConfirmationCode() {
        Random random = new Random();
        StringBuilder code = new StringBuilder(6);
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        for (int i = 0; i < 6; i++) {
            code.append(characters.charAt(random.nextInt(characters.length())));
        }
        return code.toString();
    }

    private void sendConfirmationEmail(String userEmail, String confirmationCode) throws MessagingException {
        String subject = "Email Confirmation";
        String text = "Your confirmation code is: " + confirmationCode;
        emailService.sendEmail(userEmail, subject, text);
    }
}