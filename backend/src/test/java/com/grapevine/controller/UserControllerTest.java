package com.grapevine.controller;

import com.grapevine.exception.ErrorResponse;
import com.grapevine.exception.InvalidSessionException;
import com.grapevine.exception.UserAlreadyExistsException;
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
import java.util.*;

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

    //STORY4 As an instructor, I would like to be able to set what courses I am teaching.
    @Test
    void updateUserProfile_Success() {
        // Arrange
        User updatedUser = new User();
        updatedUser.setName("Updated Name");
        updatedUser.setRole(User.Role.GTA);

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.updateUser("test@example.com", updatedUser)).thenReturn(updatedUser);

        // Act
        User result = userController.updateUserProfile("test@example.com", testSessionId, updatedUser);

        // Assert
        assertNotNull(result);
        assertEquals("Updated Name", result.getName());
        assertEquals(User.Role.GTA, result.getRole());
        verify(userService).validateSession(testSessionId);
        verify(userService).updateUser("test@example.com", updatedUser);
    }


    @Test
    void addCourse_Success() {
        // Arrange
        User updatedUser = new User();
        List<String> newCourses = List.of(new String[]{"CS180", "CS250"});
        updatedUser.setCourses(newCourses);


        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.updateUser("test@example.com", updatedUser)).thenReturn(updatedUser);

        // Act
        User result = userController.updateUserProfile("test@example.com", testSessionId, updatedUser);

        // Assert
        assertNotNull(result);
        assertEquals(List.of(new String[]{"CS180", "CS250"}), result.getCourses());
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
        ShortGroup shortGroup = new ShortGroup(1L, "Test Group", true, false);
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
        ShortEvent shortEvent = new ShortEvent(1L, "Test Event", 1L, true);
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

    //STORY7 As a user I would like to be able to delete my account and all information tied to it.
    @Test
    void deleteUser_Success() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        doNothing().when(userService).deleteUser("test@example.com");
        doNothing().when(userService).logout(testSessionId);

        // Create a map with the password for deletion
        java.util.Map<String, String> deleteRequest = new java.util.HashMap<>();
        deleteRequest.put("password", "password");

        // Act
        ResponseEntity<?> response = userController.deleteUser("test@example.com", testSessionId, deleteRequest);

        // Assert
        assertEquals(HttpStatus.NO_CONTENT.value(), response.getStatusCodeValue());
        verify(userService).validateSession(testSessionId);
        verify(userService).deleteUser("test@example.com");
        verify(userService).logout(testSessionId);
    }

    @Test
    void deleteUser_IncorrectPassword() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);

        // Create a map with incorrect password
        java.util.Map<String, String> deleteRequest = new java.util.HashMap<>();
        deleteRequest.put("password", "wrongpassword");

        // Act
        ResponseEntity<?> response = userController.deleteUser("test@example.com", testSessionId, deleteRequest);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED.value(), response.getStatusCodeValue());
        ErrorResponse errorResponse = (ErrorResponse) response.getBody();
        assertEquals("Incorrect password", errorResponse.getMessage());
        verify(userService).validateSession(testSessionId);
        verify(userService, never()).deleteUser(anyString());
        verify(userService, never()).logout(anyString());
    }

    @Test
    void deleteUser_MissingPassword() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);

        // Create an empty map without password
        java.util.Map<String, String> deleteRequest = new java.util.HashMap<>();

        // Act
        ResponseEntity<?> response = userController.deleteUser("test@example.com", testSessionId, deleteRequest);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED.value(), response.getStatusCodeValue());
        ErrorResponse errorResponse = (ErrorResponse) response.getBody();
        assertEquals("Incorrect password", errorResponse.getMessage());
        verify(userService).validateSession(testSessionId);
        verify(userService, never()).deleteUser(anyString());
        verify(userService, never()).logout(anyString());
    }

    @Test
    void deleteUser_NotAuthorized() {
        // Arrange
        User differentUser = new User();
        differentUser.setUserEmail("different@example.com");
        differentUser.setPassword("password");

        when(userService.validateSession(testSessionId)).thenReturn(differentUser);

        java.util.Map<String, String> deleteRequest = new java.util.HashMap<>();
        deleteRequest.put("password", "password");

        // Act
        ResponseEntity<?> response = userController.deleteUser("test@example.com", testSessionId, deleteRequest);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN.value(), response.getStatusCodeValue());
        ErrorResponse errorResponse = (ErrorResponse) response.getBody();
        assertEquals("You can only delete your own account", errorResponse.getMessage());
        verify(userService).validateSession(testSessionId);
        verify(userService, never()).deleteUser(anyString());
        verify(userService, never()).logout(anyString());
    }

    @Test
    void deleteUser_UnexpectedError() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        doThrow(new RuntimeException("Database error")).when(userService).deleteUser("test@example.com");

        java.util.Map<String, String> deleteRequest = new java.util.HashMap<>();
        deleteRequest.put("password", "password");

        // Act
        ResponseEntity<?> response = userController.deleteUser("test@example.com", testSessionId, deleteRequest);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), response.getStatusCodeValue());
        ErrorResponse errorResponse = (ErrorResponse) response.getBody();
        assertEquals("An unexpected error occurred", errorResponse.getMessage());
        verify(userService).validateSession(testSessionId);
        verify(userService).deleteUser("test@example.com");
        verify(userService, never()).logout(anyString());
    }
    // STORY1 As a student, I would like to be able to set my current friends
    @Test
    void sendFriendRequest_Success() {
        // Arrange
        String receiverEmail = "friend@example.com";
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("receiverEmail", receiverEmail);

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.sendFriendRequest("test@example.com", receiverEmail)).thenReturn(testUser);

        // Act
        ResponseEntity<User> response = userController.sendFriendRequest(
                "test@example.com", testSessionId, requestBody);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testUser, response.getBody());
        verify(userService).validateSession(testSessionId);
        verify(userService).sendFriendRequest("test@example.com", receiverEmail);
    }

    @Test
    void sendFriendRequest_InvalidSession() {
        // Arrange
        String receiverEmail = "friend@example.com";
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("receiverEmail", receiverEmail);

        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        // Act & Assert
        assertThrows(InvalidSessionException.class, () ->
                userController.sendFriendRequest("test@example.com", testSessionId, requestBody));

        verify(userService).validateSession(testSessionId);
        verify(userService, never()).sendFriendRequest(anyString(), anyString());
    }

    @Test
    void sendFriendRequest_Forbidden() {
        // Arrange
        String userEmail = "other@example.com";
        String receiverEmail = "friend@example.com";
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("receiverEmail", receiverEmail);

        when(userService.validateSession(testSessionId)).thenReturn(testUser);

        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
                userController.sendFriendRequest(userEmail, testSessionId, requestBody));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        assertEquals("You can only send friend requests from your own account", exception.getReason());
        verify(userService).validateSession(testSessionId);
        verify(userService, never()).sendFriendRequest(anyString(), anyString());
    }

    @Test
    void sendFriendRequest_MissingEmail() {
        // Arrange
        Map<String, String> requestBody = new HashMap<>();
        // No receiverEmail set

        when(userService.validateSession(testSessionId)).thenReturn(testUser);

        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
                userController.sendFriendRequest("test@example.com", testSessionId, requestBody));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals("Receiver email is required", exception.getReason());
        verify(userService).validateSession(testSessionId);
        verify(userService, never()).sendFriendRequest(anyString(), anyString());
    }

    @Test
    void getIncomingFriendRequests_Success() {
        // Arrange
        List<User> incomingRequests = new ArrayList<>();
        User friend1 = new User();
        friend1.setUserEmail("friend1@example.com");
        friend1.setName("Friend One");
        User friend2 = new User();
        friend2.setUserEmail("friend2@example.com");
        friend2.setName("Friend Two");
        incomingRequests.add(friend1);
        incomingRequests.add(friend2);

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.getIncomingFriendRequests("test@example.com")).thenReturn(incomingRequests);

        // Act
        ResponseEntity<List<User>> response = userController.getIncomingFriendRequests(
                "test@example.com", testSessionId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(incomingRequests, response.getBody());
        assertEquals(2, response.getBody().size());
        verify(userService).validateSession(testSessionId);
        verify(userService).getIncomingFriendRequests("test@example.com");
    }

    @Test
    void getIncomingFriendRequests_Forbidden() {
        // Arrange
        String userEmail = "other@example.com";

        when(userService.validateSession(testSessionId)).thenReturn(testUser);

        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
                userController.getIncomingFriendRequests(userEmail, testSessionId));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        assertEquals("You can only view your own friend requests", exception.getReason());
        verify(userService).validateSession(testSessionId);
        verify(userService, never()).getIncomingFriendRequests(anyString());
    }

    @Test
    void getOutgoingFriendRequests_Success() {
        // Arrange
        List<User> outgoingRequests = new ArrayList<>();
        User friend1 = new User();
        friend1.setUserEmail("friend1@example.com");
        friend1.setName("Friend One");
        outgoingRequests.add(friend1);

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.getOutgoingFriendRequests("test@example.com")).thenReturn(outgoingRequests);

        // Act
        ResponseEntity<List<User>> response = userController.getOutgoingFriendRequests(
                "test@example.com", testSessionId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(outgoingRequests, response.getBody());
        assertEquals(1, response.getBody().size());
        verify(userService).validateSession(testSessionId);
        verify(userService).getOutgoingFriendRequests("test@example.com");
    }
    // STORY2 As a user, I would like to be able to connect (make friends/view profile) with other users
    @Test
    void acceptFriendRequest_Success() {
        // Arrange
        String requesterEmail = "requester@example.com";
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("requesterEmail", requesterEmail);

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.acceptFriendRequest("test@example.com", requesterEmail)).thenReturn(testUser);

        // Act
        ResponseEntity<User> response = userController.acceptFriendRequest(
                "test@example.com", testSessionId, requestBody);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testUser, response.getBody());
        verify(userService).validateSession(testSessionId);
        verify(userService).acceptFriendRequest("test@example.com", requesterEmail);
    }

    @Test
    void denyFriendRequest_Success() {
        // Arrange
        String requesterEmail = "requester@example.com";
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("requesterEmail", requesterEmail);

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.denyFriendRequest("test@example.com", requesterEmail)).thenReturn(testUser);

        // Act
        ResponseEntity<User> response = userController.denyFriendRequest(
                "test@example.com", testSessionId, requestBody);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testUser, response.getBody());
        verify(userService).validateSession(testSessionId);
        verify(userService).denyFriendRequest("test@example.com", requesterEmail);
    }

    @Test
    void getUserFriends_Success() {
        // Arrange
        List<User> friends = new ArrayList<>();
        User friend1 = new User();
        friend1.setUserEmail("friend1@example.com");
        friend1.setName("Friend One");
        User friend2 = new User();
        friend2.setUserEmail("friend2@example.com");
        friend2.setName("Friend Two");
        friends.add(friend1);
        friends.add(friend2);

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.getUserFriends("test@example.com")).thenReturn(friends);

        // Act
        ResponseEntity<List<User>> response = userController.getUserFriends(
                "test@example.com", testSessionId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(friends, response.getBody());
        assertEquals(2, response.getBody().size());
        verify(userService).validateSession(testSessionId);
        verify(userService).getUserFriends("test@example.com");
    }

    @Test
    void removeFriend_Success() {
        // Arrange
        String friendEmail = "friend@example.com";

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.removeFriend("test@example.com", friendEmail)).thenReturn(testUser);

        // Act
        ResponseEntity<User> response = userController.removeFriend(
                "test@example.com", friendEmail, testSessionId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testUser, response.getBody());
        verify(userService).validateSession(testSessionId);
        verify(userService).removeFriend("test@example.com", friendEmail);
    }

    @Test
    void removeFriend_Forbidden() {
        // Arrange
        String userEmail = "other@example.com";
        String friendEmail = "friend@example.com";

        when(userService.validateSession(testSessionId)).thenReturn(testUser);

        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
                userController.removeFriend(userEmail, friendEmail, testSessionId));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        assertEquals("You can only modify your own friends list", exception.getReason());
        verify(userService).validateSession(testSessionId);
        verify(userService, never()).removeFriend(anyString(), anyString());
    }

    // STORY3 As a user I would like to be able to search for other users based on my profile
    @Test
    void searchUsers_Success() {
        // Arrange
        String query = "test";
        List<User> foundUsers = Arrays.asList(testUser);

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.searchUsersByName(query)).thenReturn(foundUsers);

        // Act
        ResponseEntity<List<User>> response = userController.searchUsers(query, testSessionId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(foundUsers, response.getBody());
        assertEquals(1, response.getBody().size());
        verify(userService).validateSession(testSessionId);
        verify(userService).searchUsersByName(query);
    }

    @Test
    void searchUsers_NoResults() {
        // Arrange
        String query = "nonexistent";
        List<User> emptyList = Collections.emptyList();

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.searchUsersByName(query)).thenReturn(emptyList);

        // Act
        ResponseEntity<List<User>> response = userController.searchUsers(query, testSessionId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEmpty());
        verify(userService).validateSession(testSessionId);
        verify(userService).searchUsersByName(query);
    }

    @Test
    void searchUsers_InvalidSession() {
        // Arrange
        String query = "test";

        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        // Act & Assert
        assertThrows(InvalidSessionException.class, () ->
                userController.searchUsers(query, testSessionId));

        verify(userService).validateSession(testSessionId);
        verifyNoMoreInteractions(userService);
    }

}