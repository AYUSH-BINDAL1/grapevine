package com.grapevine.service;

import com.grapevine.exception.UserNotFoundException;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.grapevine.model.User;
import com.grapevine.model.VerificationToken;
import com.grapevine.repository.UserRepository;
import com.grapevine.repository.VerificationTokenRepository;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final VerificationTokenRepository tokenRepository;
    private final EmailService emailService;

    public String initiateUserRegistration(User user) {
        String verificationToken = generateVerificationToken();
        VerificationToken token = new VerificationToken(verificationToken, user.getUserEmail());
        tokenRepository.save(token);
        emailService.sendVerificationEmail(user.getUserEmail(), verificationToken);
        return verificationToken;
    }

    public User verifyAndCreateUser(String token, User user) {
        VerificationToken verificationToken = tokenRepository.findByToken(token);
        if (verificationToken == null || !verificationToken.getUserEmail().equals(user.getUserEmail())) {
            throw new RuntimeException("Invalid verification token");
        }
        tokenRepository.delete(verificationToken);
        return userRepository.save(user);
    }

    private String generateVerificationToken() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder token = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 6; i++) {
            token.append(chars.charAt(random.nextInt(chars.length())));
        }
        return token.toString();
    }

    public User getUserByEmail(String userEmail) {
        return userRepository.findById(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + userEmail));
    }
}