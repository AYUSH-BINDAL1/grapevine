package com.grapevine;

import com.grapevine.exception.InvalidCredentialsException;
import com.grapevine.exception.InvalidSessionException;
import com.grapevine.exception.InvalidVerificationTokenException;
import com.grapevine.exception.UserNotFoundException;
import com.grapevine.model.Group;
import com.grapevine.model.ShortGroup;
import com.grapevine.model.User;
import com.grapevine.model.VerificationToken;
import com.grapevine.repository.GroupRepository;
import com.grapevine.repository.UserRepository;
import com.grapevine.repository.VerificationTokenRepository;
import com.grapevine.service.EmailService;
import com.grapevine.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private VerificationTokenRepository tokenRepository;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private VerificationToken testToken;
    private Group testGroup;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        testUser = new User();
        testUser.setUserEmail("test@example.com");
        testUser.setPassword("password");
        testUser.setName("Test User");
        testUser.setHostedGroups(new ArrayList<>());
        testUser.setJoinedGroups(new ArrayList<>());

        testToken = new VerificationToken("ABC123", "test@example.com");

        testGroup = new Group();
        testGroup.setGroupId(1L);
        testGroup.setName("Test Group");
    }

    @Test
    void initiateUserRegistration_shouldGenerateTokenAndSendEmail() {
        // Arrange
        when(tokenRepository.save(any(VerificationToken.class))).thenReturn(testToken);
        doNothing().when(emailService).sendVerificationEmail(anyString(), anyString());

        // Act
        String token = userService.initiateUserRegistration(testUser);

        // Assert
        assertNotNull(token);
        verify(tokenRepository).save(any(VerificationToken.class));
        verify(emailService).sendVerificationEmail(eq("test@example.com"), anyString());
    }

    @Test
    void verifyAndCreateUser_withValidToken_shouldCreateUser() {
        // Arrange
        when(tokenRepository.findByToken("ABC123")).thenReturn(testToken);
        when(userRepository.save(testUser)).thenReturn(testUser);

        // Act
        User result = userService.verifyAndCreateUser("ABC123", testUser);

        // Assert
        assertNotNull(result);
        assertEquals(testUser, result);
        verify(tokenRepository).findByToken("ABC123");
        verify(tokenRepository).delete(testToken);
        verify(userRepository).save(testUser);
    }

    @Test
    void verifyAndCreateUser_withInvalidToken_shouldThrowException() {
        // Arrange
        when(tokenRepository.findByToken("INVALID")).thenReturn(null);

        // Act & Assert
        assertThrows(InvalidVerificationTokenException.class, () -> {
            userService.verifyAndCreateUser("INVALID", testUser);
        });
        verify(tokenRepository, never()).delete(any(VerificationToken.class));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void verifyAndCreateUser_withMismatchedEmail_shouldThrowException() {
        // Arrange
        testUser.setUserEmail("different@example.com");
        when(tokenRepository.findByToken("ABC123")).thenReturn(testToken);

        // Act & Assert
        assertThrows(InvalidVerificationTokenException.class, () -> {
            userService.verifyAndCreateUser("ABC123", testUser);
        });
        verify(tokenRepository, never()).delete(any(VerificationToken.class));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void getUserByEmail_withExistingUser_shouldReturnUser() {
        // Arrange
        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));

        // Act
        User result = userService.getUserByEmail("test@example.com");

        // Assert
        assertEquals(testUser, result);
        verify(userRepository).findById("test@example.com");
    }

    @Test
    void getUserByEmail_withNonExistingUser_shouldThrowException() {
        // Arrange
        when(userRepository.findById("nonexistent@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(UserNotFoundException.class, () -> {
            userService.getUserByEmail("nonexistent@example.com");
        });
        verify(userRepository).findById("nonexistent@example.com");
    }

    @Test
    void login_withValidCredentials_shouldReturnSessionId() {
        // Arrange
        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));

        // Act
        String sessionId = userService.login("test@example.com", "password");

        // Assert
        assertNotNull(sessionId);
        verify(userRepository).findById("test@example.com");
    }

    @Test
    void login_withInvalidEmail_shouldThrowException() {
        // Arrange
        when(userRepository.findById("nonexistent@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(UserNotFoundException.class, () -> {
            userService.login("nonexistent@example.com", "password");
        });
        verify(userRepository).findById("nonexistent@example.com");
    }

    @Test
    void login_withInvalidPassword_shouldThrowException() {
        // Arrange
        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));

        // Act & Assert
        assertThrows(InvalidCredentialsException.class, () -> {
            userService.login("test@example.com", "wrongpassword");
        });
        verify(userRepository).findById("test@example.com");
    }

    @Test
    void logout_withValidSessionId_shouldRemoveSession() throws Exception {
        // Arrange - Create a session first
        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        String sessionId = userService.login("test@example.com", "password");

        // Get access to the private activeSessions map
        Field activeSessionsField = UserService.class.getDeclaredField("activeSessions");
        activeSessionsField.setAccessible(true);
        Map<String, Object> activeSessions = (Map<String, Object>) activeSessionsField.get(userService);
        assertTrue(activeSessions.containsKey(sessionId));

        // Act
        userService.logout(sessionId);

        // Assert
        assertFalse(activeSessions.containsKey(sessionId));
    }

    @Test
    void validateSession_withValidSession_shouldReturnUser() {
        // Arrange - Create a session first
        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        String sessionId = userService.login("test@example.com", "password");

        // Act
        User result = userService.validateSession(sessionId);

        // Assert
        assertEquals(testUser, result);
    }

    @Test
    void validateSession_withInvalidSession_shouldThrowException() {
        // Act & Assert
        assertThrows(InvalidSessionException.class, () -> {
            userService.validateSession("invalid-session-id");
        });
    }

    @Test
    void validateSession_withNullSession_shouldThrowException() {
        // Act & Assert
        assertThrows(InvalidSessionException.class, () -> {
            userService.validateSession(null);
        });
    }

    @Test
    void updateUser_shouldUpdateFields() {
        // Arrange
        User updatedUser = new User();
        updatedUser.setName("Updated Name");
        updatedUser.setBiography("New bio");
        updatedUser.setYear(2027);
        updatedUser.setMajors(Arrays.asList("Computer Science"));
        updatedUser.setMinors(Arrays.asList("Mathematics"));
        updatedUser.setCourses(Arrays.asList("CS101", "MATH201"));

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = userService.updateUser("test@example.com", updatedUser);

        // Assert
        assertEquals("Updated Name", result.getName());
        assertEquals("New bio", result.getBiography());
        assertEquals(2027, result.getYear());
        assertEquals(Arrays.asList("Computer Science"), result.getMajors());
        assertEquals(Arrays.asList("Mathematics"), result.getMinors());
        assertEquals(Arrays.asList("CS101", "MATH201"), result.getCourses());
        verify(userRepository).save(testUser);
    }

    @Test
    void getAllGroups_shouldReturnAllGroups() {
        // Arrange
        testUser.getHostedGroups().add(1L);
        testUser.getJoinedGroups().add(2L);

        Group group1 = new Group();
        group1.setGroupId(1L);
        group1.setName("Hosted Group");

        Group group2 = new Group();
        group2.setGroupId(2L);
        group2.setName("Joined Group");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group1));
        when(groupRepository.findById(2L)).thenReturn(Optional.of(group2));

        // Act
        List<Group> result = userService.getAllGroups("test@example.com");

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.contains(group1));
        assertTrue(result.contains(group2));
    }

    @Test
    void getAllShortGroups_shouldReturnAllShortGroups() {
        // Arrange
        testUser.getHostedGroups().add(1L);
        testUser.getJoinedGroups().add(2L);

        Group group1 = new Group();
        group1.setGroupId(1L);
        group1.setName("Hosted Group");

        Group group2 = new Group();
        group2.setGroupId(2L);
        group2.setName("Joined Group");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group1));
        when(groupRepository.findById(2L)).thenReturn(Optional.of(group2));

        // Act
        List<ShortGroup> result = userService.getAllShortGroups("test@example.com");

        // Assert
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getGroupId());
        assertEquals("Hosted Group", result.get(0).getName());
        assertEquals(2L, result.get(1).getGroupId());
        assertEquals("Joined Group", result.get(1).getName());
    }

    @Test
    void getHostedGroups_shouldReturnOnlyHostedGroups() {
        // Arrange
        testUser.getHostedGroups().add(1L);
        testUser.getJoinedGroups().add(2L);

        Group group1 = new Group();
        group1.setGroupId(1L);
        group1.setName("Hosted Group");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group1));

        // Act
        List<Group> result = userService.getHostedGroups("test@example.com");

        // Assert
        assertEquals(1, result.size());
        assertEquals(group1, result.get(0));
    }

    @Test
    void getHostedShortGroups_shouldReturnOnlyHostedShortGroups() {
        // Arrange
        testUser.getHostedGroups().add(1L);
        testUser.getJoinedGroups().add(2L);

        Group group1 = new Group();
        group1.setGroupId(1L);
        group1.setName("Hosted Group");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group1));

        // Act
        List<ShortGroup> result = userService.getHostedShortGroups("test@example.com");

        // Assert
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getGroupId());
        assertEquals("Hosted Group", result.get(0).getName());
    }

    @Test
    void getJoinedGroups_shouldReturnOnlyJoinedGroups() {
        // Arrange
        testUser.getHostedGroups().add(1L);
        testUser.getJoinedGroups().add(2L);

        Group group2 = new Group();
        group2.setGroupId(2L);
        group2.setName("Joined Group");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        when(groupRepository.findById(2L)).thenReturn(Optional.of(group2));

        // Act
        List<Group> result = userService.getJoinedGroups("test@example.com");

        // Assert
        assertEquals(1, result.size());
        assertEquals(group2, result.get(0));
    }

    @Test
    void getJoinedShortGroups_shouldReturnOnlyJoinedShortGroups() {
        // Arrange
        testUser.getHostedGroups().add(1L);
        testUser.getJoinedGroups().add(2L);

        Group group2 = new Group();
        group2.setGroupId(2L);
        group2.setName("Joined Group");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        when(groupRepository.findById(2L)).thenReturn(Optional.of(group2));

        // Act
        List<ShortGroup> result = userService.getJoinedShortGroups("test@example.com");

        // Assert
        assertEquals(1, result.size());
        assertEquals(2L, result.get(0).getGroupId());
        assertEquals("Joined Group", result.get(0).getName());
    }
}