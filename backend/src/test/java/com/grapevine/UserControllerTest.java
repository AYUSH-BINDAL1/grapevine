package com.grapevine;

import com.grapevine.controller.UserController;
import com.grapevine.exception.InvalidSessionException;
import com.grapevine.exception.UserAlreadyExistsException;
import com.grapevine.exception.UserNotFoundException;
import com.grapevine.model.*;
import com.grapevine.model.login.LoginRequest;
import com.grapevine.model.login.LoginResponse;
import com.grapevine.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private String testSessionId;
    private User testUser;
    private Group testGroup;
    private Event testEvent;
    private Location testLocation;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        testSessionId = "test-session-id";

        testUser = new User();
        testUser.setUserEmail("test@example.com");
        testUser.setPassword("password");
        testUser.setName("Test User");
        testUser.setBirthday(LocalDate.now().minusYears(20));

        testGroup = new Group();
        testGroup.setGroupId(1L);
        testGroup.setName("Test Group");

        testEvent = new Event();
        testEvent.setEventId(1L);
        testEvent.setName("Test Event");

        testLocation = new Location();
        testLocation.setLocationId(1L);
        testLocation.setFullName("Test Location");
    }

    @Test
    void registerUser_Success() {
        // Arrange
        when(userService.initiateUserRegistration(any(User.class))).thenReturn("verification-token");

        // Act
        ResponseEntity<?> response = userController.registerUser(testUser);

        // Assert
        assertEquals(200, response.getStatusCodeValue());
        assertEquals("verification-token", response.getBody());
        verify(userService).initiateUserRegistration(testUser);
    }

    @Test
    void registerUser_UserAlreadyExists() {
        // Arrange
        when(userService.initiateUserRegistration(any(User.class)))
                .thenThrow(new UserAlreadyExistsException("User already exists"));

        // Act
        ResponseEntity<?> response = userController.registerUser(testUser);

        // Assert
        assertEquals(HttpStatus.CONFLICT.value(), response.getStatusCodeValue());
        verify(userService).initiateUserRegistration(testUser);
    }

    @Test
    void verifyUser_Success() {
        // Arrange
        when(userService.verifyAndCreateUser(anyString(), any(User.class))).thenReturn(testUser);

        // Act
        User result = userController.verifyUser("token", testUser);

        // Assert
        assertNotNull(result);
        assertEquals(testUser, result);
        verify(userService).verifyAndCreateUser("token", testUser);
    }

    @Test
    void login_Success() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password");

        when(userService.login("test@example.com", "password")).thenReturn(testSessionId);
        when(userService.getUserByEmail("test@example.com")).thenReturn(testUser);

        // Act
        ResponseEntity<LoginResponse> response = userController.login(loginRequest);

        // Assert
        assertEquals(200, response.getStatusCodeValue());
        assertNotNull(response.getBody());
        assertEquals(testSessionId, response.getBody().getSessionId());
        assertEquals(testUser, response.getBody().getUser());
        verify(userService).login("test@example.com", "password");
        verify(userService).getUserByEmail("test@example.com");
    }

    @Test
    void logout_Success() {
        // Arrange
        doNothing().when(userService).logout(testSessionId);

        // Act
        ResponseEntity<Void> response = userController.logout(testSessionId);

        // Assert
        assertEquals(200, response.getStatusCodeValue());
        verify(userService).logout(testSessionId);
    }

    @Test
    void getUser_Success() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.getUserByEmail("test@example.com")).thenReturn(testUser);

        // Act
        User result = userController.getUser("test@example.com", testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(testUser, result);
        verify(userService).validateSession(testSessionId);
        verify(userService).getUserByEmail("test@example.com");
    }

    @Test
    void getUser_InvalidSession() {
        // Arrange
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        // Act & Assert
        assertThrows(InvalidSessionException.class,
                () -> userController.getUser("test@example.com", testSessionId));
        verify(userService).validateSession(testSessionId);
        verifyNoMoreInteractions(userService);
    }

    @Test
    void updateUserProfile_Success() {
        // Arrange
        User updatedUser = new User();
        updatedUser.setName("Updated Name");
        updatedUser.setBiography("New bio");

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.updateUser("test@example.com", updatedUser)).thenReturn(updatedUser);

        // Act
        User result = userController.updateUserProfile("test@example.com", testSessionId, updatedUser);

        // Assert
        assertNotNull(result);
        assertEquals("Updated Name", result.getName());
        assertEquals("New bio", result.getBiography());
        verify(userService).validateSession(testSessionId);
        verify(userService).updateUser("test@example.com", updatedUser);
    }

    @Test
    void updateUserProfile_NotAuthorized() {
        // Arrange
        User differentUser = new User();
        differentUser.setUserEmail("different@example.com");

        when(userService.validateSession(testSessionId)).thenReturn(differentUser);

        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userController.updateUserProfile("test@example.com", testSessionId, testUser));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        verify(userService).validateSession(testSessionId);
        verifyNoMoreInteractions(userService);
    }

    @Test
    void getAllGroups_Success() {
        // Arrange
        List<Group> groups = Arrays.asList(testGroup);
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.getAllGroups("test@example.com")).thenReturn(groups);

        // Act
        List<Group> result = userController.getAllGroups("test@example.com", testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testGroup, result.get(0));
        verify(userService).validateSession(testSessionId);
        verify(userService).getAllGroups("test@example.com");
    }

    @Test
    void getAllShortGroups_Success() {
        // Arrange
        ShortGroup shortGroup = new ShortGroup(1L, "Test Group", true);
        List<ShortGroup> shortGroups = Arrays.asList(shortGroup);

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.getAllShortGroups("test@example.com")).thenReturn(shortGroups);

        // Act
        List<ShortGroup> result = userController.getAllShortGroups("test@example.com", testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getGroupId());
        assertEquals("Test Group", result.get(0).getName());
        verify(userService).validateSession(testSessionId);
        verify(userService).getAllShortGroups("test@example.com");
    }

    @Test
    void getAllEvents_Success() {
        // Arrange
        List<Event> events = Arrays.asList(testEvent);
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.getAllEvents("test@example.com")).thenReturn(events);

        // Act
        List<Event> result = userController.getAllEvents("test@example.com", testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testEvent, result.get(0));
        verify(userService).validateSession(testSessionId);
        verify(userService).getAllEvents("test@example.com");
    }

    @Test
    void getAllShortEvents_Success() {
        // Arrange
        ShortEvent shortEvent = new ShortEvent(1L, "Test Event");
        List<ShortEvent> shortEvents = Arrays.asList(shortEvent);

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.getAllShortEvents("test@example.com")).thenReturn(shortEvents);

        // Act
        List<ShortEvent> result = userController.getAllShortEvents("test@example.com", testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getEventId());
        assertEquals("Test Event", result.get(0).getName());
        verify(userService).validateSession(testSessionId);
        verify(userService).getAllShortEvents("test@example.com");
    }

    @Test
    void getPreferredLocations_Success() {
        // Arrange
        List<Location> locations = Arrays.asList(testLocation);
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.getPreferredLocations(testUser)).thenReturn(locations);

        // Act
        List<Location> result = userController.getPreferredLocations("test@example.com", testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testLocation, result.get(0));
        verify(userService).validateSession(testSessionId);
        verify(userService).getPreferredLocations(testUser);
    }

    @Test
    void getCurrentUser_Success() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);

        // Act
        User result = userController.getCurrentUser(testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(testUser, result);
        verify(userService).validateSession(testSessionId);
    }
}