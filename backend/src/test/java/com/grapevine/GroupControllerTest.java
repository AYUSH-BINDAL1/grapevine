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

        Group group2 = new Group();
        group2.setGroupId(2L);
        group2.setName("Group 2");

        when(groupService.getAllGroups()).thenReturn(Arrays.asList(group1, group2));

        // Act
        List<Group> result = groupController.getAllGroups(testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Group 1", result.get(0).getName());
        assertEquals("Group 2", result.get(1).getName());
        verify(groupService).getAllGroups();
    }

    @Test
    void getAllShortGroups_Success() {
        // Arrange
        ShortGroup group1 = new ShortGroup(1L, "Group 1");
        ShortGroup group2 = new ShortGroup(2L, "Group 2");

        when(groupService.getAllShortGroups()).thenReturn(Arrays.asList(group1, group2));

        // Act
        List<ShortGroup> result = groupController.getAllShortGroups(testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getGroupId());
        assertEquals("Group 1", result.get(0).getName());
        assertEquals(2L, result.get(1).getGroupId());
        assertEquals("Group 2", result.get(1).getName());
        verify(groupService).getAllShortGroups();
    }

    @Test
    void createGroup_Success() {
        // Arrange
        Group newGroup = new Group();
        newGroup.setName("New Group");

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(groupService.createGroup(newGroup, testUser)).thenReturn(testGroup);

        // Act
        Group result = groupController.createGroup(testSessionId, newGroup);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getGroupId());
        assertEquals("Test Group", result.getName());
        verify(userService).validateSession(testSessionId);
        verify(groupService).createGroup(newGroup, testUser);
    }

    @Test
    void createGroup_InvalidSession() {
        // Arrange
        Group newGroup = new Group();
        newGroup.setName("New Group");

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

    @Test
    void getGroupEvents_Success() {
        // Arrange
        Event event1 = new Event();
        event1.setEventId(1L);
        event1.setName("Event 1");

        Event event2 = new Event();
        event2.setEventId(2L);
        event2.setName("Event 2");

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.getEventsByGroupId(1L)).thenReturn(Arrays.asList(event1, event2));

        // Act
        List<Event> result = groupController.getGroupEvents(1L, testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Event 1", result.get(0).getName());
        assertEquals("Event 2", result.get(1).getName());
        verify(userService).validateSession(testSessionId);
        verify(eventService).getEventsByGroupId(1L);
    }

    @Test
    void getGroupEvents_InvalidSession() {
        // Arrange
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        // Act & Assert
        assertThrows(InvalidSessionException.class,
                () -> groupController.getGroupEvents(1L, testSessionId));
        verify(userService).validateSession(testSessionId);
        verifyNoInteractions(eventService);
    }

    @Test
    void getGroupShortEvents_Success() {
        // Arrange
        ShortEvent event1 = new ShortEvent(1L, "Event 1");
        ShortEvent event2 = new ShortEvent(2L, "Event 2");

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.getShortEventsByGroupId(1L)).thenReturn(Arrays.asList(event1, event2));

        // Act
        List<ShortEvent> result = groupController.getGroupShortEvents(1L, testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getEventId());
        assertEquals("Event 1", result.get(0).getName());
        assertEquals(2L, result.get(1).getEventId());
        assertEquals("Event 2", result.get(1).getName());
        verify(userService).validateSession(testSessionId);
        verify(eventService).getShortEventsByGroupId(1L);
    }

    @Test
    void getGroupShortEvents_InvalidSession() {
        // Arrange
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        // Act & Assert
        assertThrows(InvalidSessionException.class,
                () -> groupController.getGroupShortEvents(1L, testSessionId));
        verify(userService).validateSession(testSessionId);
        verifyNoInteractions(eventService);
    }
}