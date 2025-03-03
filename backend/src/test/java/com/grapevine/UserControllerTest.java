package com.grapevine;

import com.grapevine.controller.UserController;
import com.grapevine.exception.InvalidCredentialsException;
import com.grapevine.exception.InvalidSessionException;
import com.grapevine.exception.UserNotFoundException;
import com.grapevine.model.Group;
import com.grapevine.model.ShortGroup;
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
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@SpringBootTest
public class UserControllerTest {

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
        testUser.setMajors(Arrays.asList("Computer Science"));
        testUser.setHostedGroups(new ArrayList<>());
        testUser.setJoinedGroups(new ArrayList<>());
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

    @Test
    void testUpdateUserProfile_Success() {
        User updatedUser = new User();
        updatedUser.setName("Updated Name");
        updatedUser.setBiography("New bio");

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.updateUser(anyString(), any(User.class))).thenReturn(updatedUser);

        User result = userController.updateUserProfile("test@example.com", testSessionId, updatedUser);

        assertNotNull(result);
        assertEquals("Updated Name", result.getName());
        assertEquals("New bio", result.getBiography());
        verify(userService).validateSession(testSessionId);
        verify(userService).updateUser("test@example.com", updatedUser);
    }

    @Test
    void testUpdateUserProfile_InvalidSession() {
        User updatedUser = new User();

        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        assertThrows(InvalidSessionException.class,
                () -> userController.updateUserProfile("test@example.com", testSessionId, updatedUser));
    }

    @Test
    void testUpdateUserProfile_ForbiddenAction() {
        User updatedUser = new User();
        User differentUser = new User();
        differentUser.setUserEmail("different@example.com");

        when(userService.validateSession(testSessionId)).thenReturn(differentUser);

        assertThrows(ResponseStatusException.class,
                () -> userController.updateUserProfile("test@example.com", testSessionId, updatedUser));
    }

    @Test
    void testGetAllGroups_Success() {
        Group group1 = new Group();
        group1.setGroupId(1L);
        group1.setName("Group 1");

        Group group2 = new Group();
        group2.setGroupId(2L);
        group2.setName("Group 2");

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.getAllGroups("test@example.com")).thenReturn(Arrays.asList(group1, group2));

        List<Group> result = userController.getAllGroups("test@example.com", testSessionId);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getGroupId());
        assertEquals(2L, result.get(1).getGroupId());
        verify(userService).validateSession(testSessionId);
        verify(userService).getAllGroups("test@example.com");
    }

    @Test
    void testGetAllGroups_InvalidSession() {
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        assertThrows(InvalidSessionException.class,
                () -> userController.getAllGroups("test@example.com", testSessionId));
    }

    @Test
    void testGetAllGroups_ForbiddenAction() {
        User differentUser = new User();
        differentUser.setUserEmail("different@example.com");

        when(userService.validateSession(testSessionId)).thenReturn(differentUser);

        assertThrows(ResponseStatusException.class,
                () -> userController.getAllGroups("test@example.com", testSessionId));
    }

    @Test
    void testGetAllShortGroups_Success() {
        ShortGroup group1 = new ShortGroup(1L, "Group 1");
        ShortGroup group2 = new ShortGroup(2L, "Group 2");

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.getAllShortGroups("test@example.com")).thenReturn(Arrays.asList(group1, group2));

        List<ShortGroup> result = userController.getAllShortGroups("test@example.com", testSessionId);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getGroupId());
        assertEquals("Group 1", result.get(0).getName());
        assertEquals(2L, result.get(1).getGroupId());
        assertEquals("Group 2", result.get(1).getName());
        verify(userService).validateSession(testSessionId);
        verify(userService).getAllShortGroups("test@example.com");
    }

    @Test
    void testGetAllShortGroups_InvalidSession() {
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        assertThrows(InvalidSessionException.class,
                () -> userController.getAllShortGroups("test@example.com", testSessionId));
    }

    @Test
    void testGetAllShortGroups_ForbiddenAction() {
        User differentUser = new User();
        differentUser.setUserEmail("different@example.com");

        when(userService.validateSession(testSessionId)).thenReturn(differentUser);

        assertThrows(ResponseStatusException.class,
                () -> userController.getAllShortGroups("test@example.com", testSessionId));
    }

    @Test
    void testGetHostedGroups_Success() {
        Group group = new Group();
        group.setGroupId(1L);
        group.setName("Hosted Group");

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.getHostedGroups("test@example.com")).thenReturn(List.of(group));

        List<Group> result = userController.getHostedGroups("test@example.com", testSessionId);

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getGroupId());
        assertEquals("Hosted Group", result.get(0).getName());
        verify(userService).validateSession(testSessionId);
        verify(userService).getHostedGroups("test@example.com");
    }

    @Test
    void testGetHostedGroups_InvalidSession() {
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        assertThrows(InvalidSessionException.class,
                () -> userController.getHostedGroups("test@example.com", testSessionId));
    }

    @Test
    void testGetHostedGroups_ForbiddenAction() {
        User differentUser = new User();
        differentUser.setUserEmail("different@example.com");

        when(userService.validateSession(testSessionId)).thenReturn(differentUser);

        assertThrows(ResponseStatusException.class,
                () -> userController.getHostedGroups("test@example.com", testSessionId));
    }

    @Test
    void testGetHostedShortGroups_Success() {
        ShortGroup group = new ShortGroup(1L, "Hosted Group");

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.getHostedShortGroups("test@example.com")).thenReturn(List.of(group));

        List<ShortGroup> result = userController.getHostedShortGroups("test@example.com", testSessionId);

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getGroupId());
        assertEquals("Hosted Group", result.get(0).getName());
        verify(userService).validateSession(testSessionId);
        verify(userService).getHostedShortGroups("test@example.com");
    }

    @Test
    void testGetHostedShortGroups_InvalidSession() {
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        assertThrows(InvalidSessionException.class,
                () -> userController.getHostedShortGroups("test@example.com", testSessionId));
    }

    @Test
    void testGetHostedShortGroups_ForbiddenAction() {
        User differentUser = new User();
        differentUser.setUserEmail("different@example.com");

        when(userService.validateSession(testSessionId)).thenReturn(differentUser);

        assertThrows(ResponseStatusException.class,
                () -> userController.getHostedShortGroups("test@example.com", testSessionId));
    }

    @Test
    void testGetJoinedGroups_Success() {
        Group group = new Group();
        group.setGroupId(2L);
        group.setName("Joined Group");

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(userService.getJoinedGroups("test@example.com")).thenReturn(List.of(group));

        List<Group> result = userController.getJoinedGroups("test@example.com", testSessionId);

        assertEquals(1, result.size());
        assertEquals(2L, result.get(0).getGroupId());
        assertEquals("Joined Group", result.get(0).getName());
        verify(userService).validateSession(testSessionId);
        verify(userService).getJoinedGroups("test@example.com");
    }

    @Test
    void testGetJoinedGroups_InvalidSession() {
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        assertThrows(InvalidSessionException.class,
                () -> userController.getJoinedGroups("test@example.com", testSessionId));
    }

    @Test
    void testGetJoinedGroups_ForbiddenAction() {
        User differentUser = new User();
        differentUser.setUserEmail("different@example.com");

        when(userService.validateSession(testSessionId)).thenReturn(differentUser);

        assertThrows(ResponseStatusException.class,
                () -> userController.getJoinedGroups("test@example.com", testSessionId));
    }

    @Test
    void testGetJoinedShortGroups_ForbiddenAction() {
        User differentUser = new User();
        differentUser.setUserEmail("different@example.com");

        when(userService.validateSession(testSessionId)).thenReturn(differentUser);

        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> userController.getJoinedShortGroups("test@example.com", testSessionId));
    }
}