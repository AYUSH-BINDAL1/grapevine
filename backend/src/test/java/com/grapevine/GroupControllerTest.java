package com.grapevine;

import com.grapevine.controller.GroupController;
import com.grapevine.exception.InvalidSessionException;
import com.grapevine.model.Event;
import com.grapevine.model.Group;
import com.grapevine.model.ShortEvent;
import com.grapevine.model.ShortGroup;
import com.grapevine.model.User;
import com.grapevine.service.EventService;
import com.grapevine.service.GroupService;
import com.grapevine.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class GroupControllerTest {

    @Mock
    private GroupService groupService;

    @Mock
    private UserService userService;

    @Mock
    private EventService eventService;

    @InjectMocks
    private GroupController groupController;

    private final String testSessionId = "test-session-id";
    private User testUser;
    private Group testGroup;
    private Event testEvent;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        testUser = new User();
        testUser.setUserEmail("test@example.com");

        testGroup = new Group();
        testGroup.setGroupId(1L);
        testGroup.setName("Test Group");
        testGroup.setPublic(true);

        testEvent = new Event();
        testEvent.setEventId(1L);
        testEvent.setName("Test Event");
    }

    @Test
    void getAllGroups_Success() {
        // Arrange
        Group group1 = new Group();
        group1.setGroupId(1L);
        group1.setName("Group 1");
        group1.setPublic(true);

        Group group2 = new Group();
        group2.setGroupId(2L);
        group2.setName("Group 2");
        group2.setPublic(false);

        when(groupService.getAllGroups()).thenReturn(Arrays.asList(group1, group2));

        // Act
        List<Group> result = groupController.getAllGroups(testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Group 1", result.get(0).getName());
        assertTrue(result.get(0).isPublic());
        assertEquals("Group 2", result.get(1).getName());
        assertFalse(result.get(1).isPublic());
        verify(groupService).getAllGroups();
    }

    @Test
    void getAllShortGroups_Success() {
        // Arrange
        ShortGroup group1 = new ShortGroup(1L, "Group 1", true);
        ShortGroup group2 = new ShortGroup(2L, "Group 2", false);

        when(groupService.getAllShortGroups()).thenReturn(Arrays.asList(group1, group2));

        // Act
        List<ShortGroup> result = groupController.getAllShortGroups(testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getGroupId());
        assertEquals("Group 1", result.get(0).getName());
        assertTrue(result.get(0).isPublic());
        assertEquals(2L, result.get(1).getGroupId());
        assertEquals("Group 2", result.get(1).getName());
        assertFalse(result.get(1).isPublic());
        verify(groupService).getAllShortGroups();
    }

    @Test
    void createGroup_Success() {
        // Arrange
        Group newGroup = new Group();
        newGroup.setName("New Group");
        newGroup.setPublic(true);

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(groupService.createGroup(newGroup, testUser)).thenReturn(testGroup);

        // Act
        Group result = groupController.createGroup(testSessionId, newGroup);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getGroupId());
        assertEquals("Test Group", result.getName());
        assertTrue(result.isPublic());
        verify(userService).validateSession(testSessionId);
        verify(groupService).createGroup(newGroup, testUser);
    }

    @Test
    void createGroup_InvalidSession() {
        // Arrange
        Group newGroup = new Group();
        newGroup.setName("New Group");
        newGroup.setPublic(true);

        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        // Act & Assert
        assertThrows(InvalidSessionException.class,
                () -> groupController.createGroup(testSessionId, newGroup));
        verify(userService).validateSession(testSessionId);
        verifyNoInteractions(groupService);
    }

    @Test
    void getGroup_Success() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(groupService.getGroupById(1L)).thenReturn(testGroup);

        // Act
        Group result = groupController.getGroup(1L, testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getGroupId());
        assertEquals("Test Group", result.getName());
        assertTrue(result.isPublic());
        verify(userService).validateSession(testSessionId);
        verify(groupService).getGroupById(1L);
    }

    @Test
    void getGroup_InvalidSession() {
        // Arrange
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        // Act & Assert
        assertThrows(InvalidSessionException.class,
                () -> groupController.getGroup(1L, testSessionId));
        verify(userService).validateSession(testSessionId);
        verifyNoInteractions(groupService);
    }

    @Test
    void createEvent_Success() {
        // Arrange
        Event newEvent = new Event();
        newEvent.setName("New Event");

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.createEvent(newEvent, 1L, testUser)).thenReturn(testEvent);

        // Act
        Event result = groupController.createEvent(1L, newEvent, testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getEventId());
        assertEquals("Test Event", result.getName());
        verify(userService).validateSession(testSessionId);
        verify(eventService).createEvent(newEvent, 1L, testUser);
    }

    @Test
    void createEvent_InvalidSession() {
        // Arrange
        Event newEvent = new Event();
        newEvent.setName("New Event");

        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        // Act & Assert
        assertThrows(InvalidSessionException.class,
                () -> groupController.createEvent(1L, newEvent, testSessionId));
        verify(userService).validateSession(testSessionId);
        verifyNoInteractions(eventService);
    }

}