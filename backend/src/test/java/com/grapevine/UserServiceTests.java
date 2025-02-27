package com.grapevine;

import com.grapevine.exception.InvalidCredentialsException;
import com.grapevine.exception.InvalidSessionException;
import com.grapevine.exception.InvalidVerificationTokenException;
import com.grapevine.exception.UserNotFoundException;
import com.grapevine.model.User;
import com.grapevine.model.VerificationToken;
import com.grapevine.repository.UserRepository;
import com.grapevine.repository.VerificationTokenRepository;
import com.grapevine.service.EmailService;
import com.grapevine.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@SpringBootTest
public class UserServiceTests {

    @Mock
    private UserRepository userRepository;

    @Mock
    private VerificationTokenRepository tokenRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private VerificationToken testToken;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setUserEmail("test@example.com");
        testUser.setPassword("password123");
        testUser.setName("Test User");
        testUser.setBirthday(LocalDate.of(2000, 1, 1));

        testToken = new VerificationToken("TOKEN123", "test@example.com");
    }

    @Test
    void testInitiateUserRegistration() {
        when(tokenRepository.save(any(VerificationToken.class))).thenReturn(testToken);
        doNothing().when(emailService).sendVerificationEmail(anyString(), anyString());

        String token = userService.initiateUserRegistration(testUser);

        assertNotNull(token);
        verify(tokenRepository).save(any(VerificationToken.class));
        verify(emailService).sendVerificationEmail(eq("test@example.com"), anyString());
    }

    @Test
    void testVerifyAndCreateUser_Success() {
        when(tokenRepository.findByToken("TOKEN123")).thenReturn(testToken);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        User result = userService.verifyAndCreateUser("TOKEN123", testUser);

        assertNotNull(result);
        assertEquals("test@example.com", result.getUserEmail());
        verify(tokenRepository).findByToken("TOKEN123");
        verify(tokenRepository).delete(testToken);
        verify(userRepository).save(testUser);
    }

    @Test
    void testVerifyAndCreateUser_InvalidToken() {
        when(tokenRepository.findByToken("INVALID")).thenReturn(null);

        assertThrows(InvalidVerificationTokenException.class,
                () -> userService.verifyAndCreateUser("INVALID", testUser));
    }

    @Test
    void testVerifyAndCreateUser_EmailMismatch() {
        User differentUser = new User();
        differentUser.setUserEmail("different@example.com");

        when(tokenRepository.findByToken("TOKEN123")).thenReturn(testToken);

        assertThrows(InvalidVerificationTokenException.class,
                () -> userService.verifyAndCreateUser("TOKEN123", differentUser));
    }

    @Test
    void testGetUserByEmail_Success() {
        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));

        User result = userService.getUserByEmail("test@example.com");

        assertNotNull(result);
        assertEquals("test@example.com", result.getUserEmail());
    }

    @Test
    void testGetUserByEmail_NotFound() {
        when(userRepository.findById("nonexistent@example.com")).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class,
                () -> userService.getUserByEmail("nonexistent@example.com"));
    }

    @Test
    void testLogin_Success() {
        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));

        String sessionId = userService.login("test@example.com", "password123");

        assertNotNull(sessionId);
    }

    @Test
    void testLogin_UserNotFound() {
        when(userRepository.findById("nonexistent@example.com")).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class,
                () -> userService.login("nonexistent@example.com", "password123"));
    }

    @Test
    void testLogin_InvalidPassword() {
        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));

        assertThrows(InvalidCredentialsException.class,
                () -> userService.login("test@example.com", "wrongpassword"));
    }

    @Test
    void testValidateSession_InvalidSession() {
        assertThrows(InvalidSessionException.class,
                () -> userService.validateSession("nonexistent-session"));
    }

    @Test
    void testSessionLifecycle() {
        // Login to create a session
        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));

        String sessionId = userService.login("test@example.com", "password123");
        assertNotNull(sessionId);

        // Validate the session
        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));

        User user = userService.validateSession(sessionId);
        assertNotNull(user);
        assertEquals("test@example.com", user.getUserEmail());

        // Logout
        userService.logout(sessionId);

        // Session should now be invalid
        assertThrows(InvalidSessionException.class, () -> userService.validateSession(sessionId));
    }
}