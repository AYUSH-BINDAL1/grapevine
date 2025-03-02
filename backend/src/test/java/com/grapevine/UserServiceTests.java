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
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Map;
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

    @Test
    void testUpdateUser_Success() {
        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Original values
        testUser.setName("Original Name");
        testUser.setBiography("Original Bio");

        // Create updated user with proper weekly availability format
        User updatedUser = new User();
        updatedUser.setName("Updated Name");
        updatedUser.setBiography("New biography");
        updatedUser.setYear(2);
        updatedUser.setMajors(Arrays.asList("Computer Science", "Mathematics"));
        updatedUser.setMinors(Arrays.asList("Physics"));
        updatedUser.setCourses(Arrays.asList("CS101", "MATH202"));

        // Use a properly formatted weekly availability string
        String availability = "1".repeat(24) + "0".repeat(144); // First day available, rest unavailable
        updatedUser.setWeeklyAvailability(availability);

        // Profile picture
        updatedUser.setProfilePicturePath("/profiles/test.jpg");

        User result = userService.updateUser("test@example.com", updatedUser);

        assertNotNull(result);
        assertEquals("Updated Name", result.getName());
        assertEquals("New biography", result.getBiography());
        assertEquals(2, result.getYear());
        assertEquals(Arrays.asList("Computer Science", "Mathematics"), result.getMajors());
        assertEquals(Arrays.asList("Physics"), result.getMinors());
        assertEquals(Arrays.asList("CS101", "MATH202"), result.getCourses());
        assertEquals(availability, result.getWeeklyAvailability());
        assertEquals("/profiles/test.jpg", result.getProfilePicturePath());

        verify(userRepository).save(testUser);
    }

    @Test
    void testUpdateUser_UserNotFound() {
        when(userRepository.findById("nonexistent@example.com")).thenReturn(Optional.empty());

        User updatedUser = new User();
        updatedUser.setName("Updated Name");

        assertThrows(UserNotFoundException.class,
                () -> userService.updateUser("nonexistent@example.com", updatedUser));
    }

    @Test
    void testLogout_WithValidSession() {
        // First create a valid session
        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        String sessionId = userService.login("test@example.com", "password123");

        // Then logout
        userService.logout(sessionId);

        // Verify session is invalidated
        assertThrows(InvalidSessionException.class, () -> userService.validateSession(sessionId));
    }

    @Test
    void testLogout_WithNullSession() {
        // Should not throw any exception
        userService.logout(null);
    }

    @Test
    void testLogout_WithInvalidSession() {
        // Should not throw any exception
        userService.logout("invalid-session-id");
    }

    @Test
    void testValidateSession_SessionExpiry() throws Exception {
        // This would require manipulating the private SessionInfo class or using reflection
        // Here's a basic approach that requires some refactoring to test properly

        // Create a session first
        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        String sessionId = userService.login("test@example.com", "password123");

        // We'd need a way to manipulate the session expiry time
        // For now, we can just note that this would require additional testing infrastructure

        // This assertion serves as a reminder that this test needs implementation
        assertTrue(true, "Test for session expiry requires refactoring");
    }

    @Test
    void testUpdateUser_NullFields() {
        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Original values
        testUser.setName("Original Name");
        testUser.setBiography("Original Bio");
        testUser.setYear(3);

        // Only update biography
        User partialUpdate = new User();
        partialUpdate.setBiography("Updated Bio");

        User result = userService.updateUser("test@example.com", partialUpdate);

        // Only biography should change, other fields should remain the same
        assertEquals("Original Name", result.getName());
        assertEquals("Updated Bio", result.getBiography());
        assertEquals(3, result.getYear());
    }

    @Test
    void testWeeklyAvailabilityInitialization() {
        User newUser = new User();
        String weeklyAvailability = newUser.getWeeklyAvailability();

        assertNotNull(weeklyAvailability);
        assertEquals(168, weeklyAvailability.length());
        // All slots should be initialized as unavailable (0)
        assertTrue(weeklyAvailability.matches("^[0]+$"));
    }

    @Test
    void testGenerateVerificationToken() throws Exception {
        // Use reflection to test private method
        java.lang.reflect.Method method = UserService.class.getDeclaredMethod("generateVerificationToken");
        method.setAccessible(true);

        String token1 = (String) method.invoke(userService);
        String token2 = (String) method.invoke(userService);

        assertNotNull(token1);
        assertNotNull(token2);
        assertEquals(6, token1.length());
        // Tokens should be different
        assertNotEquals(token1, token2);
    }

    @Test
    void testSessionExpiry() throws Exception {
        // Create a session
        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        String sessionId = userService.login("test@example.com", "password123");

        // Use reflection to directly access and modify the private session info
        java.lang.reflect.Field sessionsField = UserService.class.getDeclaredField("activeSessions");
        sessionsField.setAccessible(true);

        @SuppressWarnings("unchecked")
        Map<String, Object> sessions = (Map<String, Object>) sessionsField.get(userService);
        Object sessionInfo = sessions.get(sessionId);

        java.lang.reflect.Field expiryField = sessionInfo.getClass().getDeclaredField("expiryTime");
        expiryField.setAccessible(true);

        // Set expiry time to the past
        expiryField.set(sessionInfo, LocalDateTime.now().minusHours(1));

        // Session should now be expired
        assertThrows(InvalidSessionException.class, () -> userService.validateSession(sessionId));

        // Session should be removed after failed validation
        assertFalse(sessions.containsKey(sessionId));
    }

    @Test
    void testUserWithNullFields() {
        User nullFieldsUser = new User();
        nullFieldsUser.setUserEmail("nullfields@example.com");
        nullFieldsUser.setPassword("password");
        nullFieldsUser.setName("Null Fields User");
        nullFieldsUser.setBirthday(LocalDate.now());
        // Other fields left null

        when(tokenRepository.findByToken("TOKEN123")).thenReturn(new VerificationToken("TOKEN123", "nullfields@example.com"));
        when(userRepository.save(any(User.class))).thenReturn(nullFieldsUser);

        User result = userService.verifyAndCreateUser("TOKEN123", nullFieldsUser);

        assertNotNull(result);
        assertEquals("nullfields@example.com", result.getUserEmail());
        // The following assertions check that no NPEs occur when fields are null
        assertNull(result.getBiography());
        assertNull(result.getYear());
        assertNull(result.getMajors());
        assertNull(result.getMinors());
        assertNull(result.getCourses());
        assertNull(result.getAvailableTimes());
    }

    @Test
    void testMultipleSessionsForSameUser() {
        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));

        // Login twice to create two different sessions for the same user
        String sessionId1 = userService.login("test@example.com", "password123");
        String sessionId2 = userService.login("test@example.com", "password123");

        assertNotNull(sessionId1);
        assertNotNull(sessionId2);
        assertNotEquals(sessionId1, sessionId2);

        // Both sessions should be valid
        User user1 = userService.validateSession(sessionId1);
        User user2 = userService.validateSession(sessionId2);

        assertEquals(user1.getUserEmail(), user2.getUserEmail());

        // Logout from one session
        userService.logout(sessionId1);

        // First session should be invalid
        assertThrows(InvalidSessionException.class, () -> userService.validateSession(sessionId1));

        // Second session should still be valid
        assertNotNull(userService.validateSession(sessionId2));
    }
}