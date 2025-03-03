package com.grapevine;

import com.grapevine.controller.UserController;
import com.grapevine.exception.InvalidCredentialsException;
import com.grapevine.exception.InvalidSessionException;
import com.grapevine.exception.UserNotFoundException;
import com.grapevine.model.User;
import com.grapevine.model.login.LoginRequest;
import com.grapevine.model.login.LoginResponse;
import com.grapevine.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@SpringBootTest
public class UserControllerTests {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private User testUser;
    private String testSessionId = "test-session-id";

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setUserEmail("test@example.com");
        testUser.setPassword("password123");
        testUser.setName("Test User");
        testUser.setBirthday(LocalDate.of(2000, 1, 1));
        //testUser.setRole(User.Role.STUDENT);
        testUser.setMajors(Arrays.asList("Computer Science"));
    }

    @Test
    void testRegisterUser() {
        when(userService.initiateUserRegistration(any(User.class))).thenReturn("TOKEN123");

        String token = userController.registerUser(testUser);

        assertEquals("TOKEN123", token);
        verify(userService).initiateUserRegistration(testUser);
    }

    @Test
    void testVerifyUser() {
        when(userService.verifyAndCreateUser(anyString(), any(User.class))).thenReturn(testUser);

        User result = userController.verifyUser("TOKEN123", testUser);

        assertNotNull(result);
        assertEquals("test@example.com", result.getUserEmail());
        verify(userService).verifyAndCreateUser("TOKEN123", testUser);
    }

    @Test
    void testLogin_Success() {
        LoginRequest request = new LoginRequest("test@example.com", "password123");

        when(userService.login("test@example.com", "password123")).thenReturn(testSessionId);
        when(userService.getUserByEmail("test@example.com")).thenReturn(testUser);

        ResponseEntity<LoginResponse> response = userController.login(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(testSessionId, response.getBody().getSessionId());
        assertEquals(testUser, response.getBody().getUser());
    }

    @Test
    void testLogin_InvalidCredentials() {
        LoginRequest request = new LoginRequest("test@example.com", "wrongpassword");

        when(userService.login("test@example.com", "wrongpassword"))
                .thenThrow(new InvalidCredentialsException("Invalid credentials"));

        assertThrows(InvalidCredentialsException.class, () -> userController.login(request));
    }

    @Test
    void testLogout() {
        ResponseEntity<Void> response = userController.logout(testSessionId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userService).logout(testSessionId);
    }

    @Test
    void testGetUser_Success() {
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.getUserByEmail("test@example.com")).thenReturn(testUser);

        User result = userController.getUser("test@example.com", testSessionId);

        assertNotNull(result);
        assertEquals("test@example.com", result.getUserEmail());
        verify(userService).validateSession(testSessionId);
        verify(userService).getUserByEmail("test@example.com");
    }

    @Test
    void testGetUser_InvalidSession() {
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        assertThrows(InvalidSessionException.class,
                () -> userController.getUser("test@example.com", testSessionId));
    }

    @Test
    void testGetUser_UserNotFound() {
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.getUserByEmail("nonexistent@example.com"))
                .thenThrow(new UserNotFoundException("User not found"));

        assertThrows(UserNotFoundException.class,
                () -> userController.getUser("nonexistent@example.com", testSessionId));
    }

    @Test
    void testGetCurrentUser_Success() {
        when(userService.validateSession(testSessionId)).thenReturn(testUser);

        User result = userController.getCurrentUser(testSessionId);

        assertNotNull(result);
        assertEquals("test@example.com", result.getUserEmail());
        verify(userService).validateSession(testSessionId);
    }

    @Test
    void testGetCurrentUser_InvalidSession() {
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        assertThrows(InvalidSessionException.class,
                () -> userController.getCurrentUser(testSessionId));
    }
}