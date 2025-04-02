package com.grapevine.service;

import com.grapevine.exception.InvalidCredentialsException;
import com.grapevine.exception.InvalidSessionException;
import com.grapevine.exception.InvalidVerificationTokenException;
import com.grapevine.exception.UserNotFoundException;
import com.grapevine.model.*;
import com.grapevine.repository.EventRepository;
import com.grapevine.repository.GroupRepository;
import com.grapevine.repository.UserRepository;
import com.grapevine.repository.VerificationTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.lang.reflect.Field;
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
    private EventRepository eventRepository;

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
        testUser.setHostedEvents(new ArrayList<>());  // Add this line
        testUser.setJoinedEvents(new ArrayList<>());  // Add this line

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

    @Test
    void getAllEvents_shouldReturnAllEvents() {
        // Arrange
        testUser.setHostedEvents(Arrays.asList(1L));
        testUser.setJoinedEvents(Arrays.asList(2L));

        Event event1 = new Event();
        event1.setEventId(1L);
        event1.setName("Hosted Event");

        Event event2 = new Event();
        event2.setEventId(2L);
        event2.setName("Joined Event");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event1));
        when(eventRepository.findById(2L)).thenReturn(Optional.of(event2));

        // Act
        List<Event> result = userService.getAllEvents("test@example.com");

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.contains(event1));
        assertTrue(result.contains(event2));
    }

    @Test
    void getAllShortEvents_shouldReturnAllShortEvents() {
        // Arrange
        testUser.setHostedEvents(Arrays.asList(1L));
        testUser.setJoinedEvents(Arrays.asList(2L));

        Event event1 = new Event();
        event1.setEventId(1L);
        event1.setName("Hosted Event");

        Event event2 = new Event();
        event2.setEventId(2L);
        event2.setName("Joined Event");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event1));
        when(eventRepository.findById(2L)).thenReturn(Optional.of(event2));

        // Act
        List<ShortEvent> result = userService.getAllShortEvents("test@example.com");

        // Assert
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getEventId());
        assertEquals("Hosted Event", result.get(0).getName());
        assertEquals(2L, result.get(1).getEventId());
        assertEquals("Joined Event", result.get(1).getName());
    }

    @Test
    void getHostedEvents_shouldReturnOnlyHostedEvents() {
        // Arrange
        testUser.setHostedEvents(Arrays.asList(1L));
        testUser.setJoinedEvents(Arrays.asList(2L));

        Event event1 = new Event();
        event1.setEventId(1L);
        event1.setName("Hosted Event");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event1));

        // Act
        List<Event> result = userService.getHostedEvents("test@example.com");

        // Assert
        assertEquals(1, result.size());
        assertEquals(event1, result.get(0));
    }

    @Test
    void getHostedShortEvents_shouldReturnOnlyHostedShortEvents() {
        // Arrange
        testUser.setHostedEvents(Arrays.asList(1L));
        testUser.setJoinedEvents(Arrays.asList(2L));

        Event event1 = new Event();
        event1.setEventId(1L);
        event1.setName("Hosted Event");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event1));

        // Act
        List<ShortEvent> result = userService.getHostedShortEvents("test@example.com");

        // Assert
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getEventId());
        assertEquals("Hosted Event", result.get(0).getName());
    }

    @Test
    void getJoinedEvents_shouldReturnOnlyJoinedEvents() {
        // Arrange
        testUser.setHostedEvents(Arrays.asList(1L));
        testUser.setJoinedEvents(Arrays.asList(2L));

        Event event2 = new Event();
        event2.setEventId(2L);
        event2.setName("Joined Event");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        when(eventRepository.findById(2L)).thenReturn(Optional.of(event2));

        // Act
        List<Event> result = userService.getJoinedEvents("test@example.com");

        // Assert
        assertEquals(1, result.size());
        assertEquals(event2, result.get(0));
    }

    @Test
    void getJoinedShortEvents_shouldReturnOnlyJoinedShortEvents() {
        // Arrange
        testUser.setHostedEvents(Arrays.asList(1L));
        testUser.setJoinedEvents(Arrays.asList(2L));

        Event event2 = new Event();
        event2.setEventId(2L);
        event2.setName("Joined Event");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(testUser));
        when(eventRepository.findById(2L)).thenReturn(Optional.of(event2));

        // Act
        List<ShortEvent> result = userService.getJoinedShortEvents("test@example.com");

        // Assert
        assertEquals(1, result.size());
        assertEquals(2L, result.get(0).getEventId());
        assertEquals("Joined Event", result.get(0).getName());
    }

    @Test
    void sendFriendRequest_Success() {
        // Arrange
        User sender = testUser;
        User receiver = new User();
        receiver.setUserEmail("friend@example.com");
        receiver.setName("Friend User");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(sender));
        when(userRepository.findById("friend@example.com")).thenReturn(Optional.of(receiver));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        User result = userService.sendFriendRequest("test@example.com", "friend@example.com");

        // Assert
        assertNotNull(result);
        assertTrue(result.getOutgoingFriendRequests().contains("friend@example.com"));
        verify(userRepository).findById("test@example.com");
        verify(userRepository).findById("friend@example.com");
        verify(userRepository, times(2)).save(any(User.class));
    }

    @Test
    void sendFriendRequest_ToSelf_ThrowsException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> userService.sendFriendRequest("test@example.com", "test@example.com"));

        assertEquals("Cannot send friend request to yourself", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void sendFriendRequest_AlreadyFriends_ThrowsException() {
        // Arrange
        User user = testUser;
        user.setFriends(new ArrayList<>(Arrays.asList("friend@example.com")));

        User friend = new User();
        friend.setUserEmail("friend@example.com");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.findById("friend@example.com")).thenReturn(Optional.of(friend));

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> userService.sendFriendRequest("test@example.com", "friend@example.com"));

        assertEquals("You are already friends with this user", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void sendFriendRequest_AlreadySent_ThrowsException() {
        // Arrange
        User user = testUser;
        user.setOutgoingFriendRequests(new ArrayList<>(Arrays.asList("friend@example.com")));

        User friend = new User();
        friend.setUserEmail("friend@example.com");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.findById("friend@example.com")).thenReturn(Optional.of(friend));

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> userService.sendFriendRequest("test@example.com", "friend@example.com"));

        assertEquals("Friend request already sent", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void acceptFriendRequest_Success() {
        // Arrange
        User user = testUser;
        User friend = new User();
        friend.setUserEmail("friend@example.com");
        friend.setName("Friend User");

        // Create mutable lists
        user.setIncomingFriendRequests(new ArrayList<>(Arrays.asList("friend@example.com")));
        user.setFriends(new ArrayList<>());

        friend.setOutgoingFriendRequests(new ArrayList<>(Arrays.asList("test@example.com")));
        friend.setFriends(new ArrayList<>());

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.findById("friend@example.com")).thenReturn(Optional.of(friend));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        User result = userService.acceptFriendRequest("test@example.com", "friend@example.com");

        // Assert
        assertNotNull(result);
        assertTrue(result.getFriends().contains("friend@example.com"));
        assertFalse(result.getIncomingFriendRequests().contains("friend@example.com"));
        verify(userRepository, times(2)).save(any(User.class));
    }

    @Test
    void acceptFriendRequest_NoRequest_ThrowsException() {
        // Arrange
        User user = testUser;
        user.setIncomingFriendRequests(new ArrayList<>()); // Empty mutable list

        User friend = new User();
        friend.setUserEmail("friend@example.com");
        friend.setName("Friend User");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.findById("friend@example.com")).thenReturn(Optional.of(friend));

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> userService.acceptFriendRequest("test@example.com", "friend@example.com"));

        assertEquals("No friend request from this user", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void denyFriendRequest_Success() {
        // Arrange
        User user = testUser;
        User requester = new User();
        requester.setUserEmail("friend@example.com");
        requester.setName("Friend User");

        // Create mutable lists
        user.setIncomingFriendRequests(new ArrayList<>(Arrays.asList("friend@example.com")));
        requester.setOutgoingFriendRequests(new ArrayList<>(Arrays.asList("test@example.com")));

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.findById("friend@example.com")).thenReturn(Optional.of(requester));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        User result = userService.denyFriendRequest("test@example.com", "friend@example.com");

        // Assert
        assertNotNull(result);
        assertFalse(result.getIncomingFriendRequests().contains("friend@example.com"));
        verify(userRepository, times(2)).save(any(User.class));
    }

    @Test
    void getIncomingFriendRequests_Success() {
        // Arrange
        User user = testUser;
        user.setIncomingFriendRequests(List.of("friend1@example.com", "friend2@example.com"));

        User friend1 = new User();
        friend1.setUserEmail("friend1@example.com");
        friend1.setName("Friend One");

        User friend2 = new User();
        friend2.setUserEmail("friend2@example.com");
        friend2.setName("Friend Two");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.findById("friend1@example.com")).thenReturn(Optional.of(friend1));
        when(userRepository.findById("friend2@example.com")).thenReturn(Optional.of(friend2));

        // Act
        List<User> results = userService.getIncomingFriendRequests("test@example.com");

        // Assert
        assertEquals(2, results.size());
        assertEquals("Friend One", results.get(0).getName());
        assertEquals("Friend Two", results.get(1).getName());
        verify(userRepository).findById("test@example.com");
        verify(userRepository).findById("friend1@example.com");
        verify(userRepository).findById("friend2@example.com");
    }

    @Test
    void getOutgoingFriendRequests_Success() {
        // Arrange
        User user = testUser;
        user.setOutgoingFriendRequests(List.of("friend1@example.com", "friend2@example.com"));

        User friend1 = new User();
        friend1.setUserEmail("friend1@example.com");
        friend1.setName("Friend One");

        User friend2 = new User();
        friend2.setUserEmail("friend2@example.com");
        friend2.setName("Friend Two");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.findById("friend1@example.com")).thenReturn(Optional.of(friend1));
        when(userRepository.findById("friend2@example.com")).thenReturn(Optional.of(friend2));

        // Act
        List<User> results = userService.getOutgoingFriendRequests("test@example.com");

        // Assert
        assertEquals(2, results.size());
        assertEquals("Friend One", results.get(0).getName());
        assertEquals("Friend Two", results.get(1).getName());
        verify(userRepository).findById("test@example.com");
        verify(userRepository).findById("friend1@example.com");
        verify(userRepository).findById("friend2@example.com");
    }

    @Test
    void getUserFriends_Success() {
        // Arrange
        User user = testUser;
        user.setFriends(List.of("friend1@example.com", "friend2@example.com"));

        User friend1 = new User();
        friend1.setUserEmail("friend1@example.com");
        friend1.setName("Friend One");

        User friend2 = new User();
        friend2.setUserEmail("friend2@example.com");
        friend2.setName("Friend Two");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.findById("friend1@example.com")).thenReturn(Optional.of(friend1));
        when(userRepository.findById("friend2@example.com")).thenReturn(Optional.of(friend2));

        // Act
        List<User> results = userService.getUserFriends("test@example.com");

        // Assert
        assertEquals(2, results.size());
        assertEquals("Friend One", results.get(0).getName());
        assertEquals("Friend Two", results.get(1).getName());
        verify(userRepository).findById("test@example.com");
        verify(userRepository).findById("friend1@example.com");
        verify(userRepository).findById("friend2@example.com");
    }

    @Test
    void removeFriend_Success() {
        // Arrange
        User user = testUser;
        user.setFriends(new ArrayList<>(List.of("friend@example.com")));

        User friend = new User();
        friend.setUserEmail("friend@example.com");
        friend.setName("Friend User");
        friend.setFriends(new ArrayList<>(List.of("test@example.com")));

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.findById("friend@example.com")).thenReturn(Optional.of(friend));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        User result = userService.removeFriend("test@example.com", "friend@example.com");

        // Assert
        assertNotNull(result);
        assertFalse(result.getFriends().contains("friend@example.com"));
        verify(userRepository).findById("test@example.com");
        verify(userRepository).findById("friend@example.com");
        verify(userRepository, times(2)).save(any(User.class));
    }

    @Test
    void removeFriend_NotFriends_ThrowsException() {
        // Arrange
        User user = testUser;
        user.setFriends(new ArrayList<>()); // Empty mutable list

        User friend = new User();
        friend.setUserEmail("friend@example.com");

        when(userRepository.findById("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.findById("friend@example.com")).thenReturn(Optional.of(friend));

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> userService.removeFriend("test@example.com", "friend@example.com"));

        assertEquals("This user is not in your friends list", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }
}