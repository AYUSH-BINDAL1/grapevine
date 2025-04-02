package com.grapevine.controller;

import com.grapevine.exception.InvalidSessionException;
import com.grapevine.model.*;
import com.grapevine.service.EventService;
import com.grapevine.service.GroupService;
import com.grapevine.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

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
    void getAllShortGroups_FilterPublic() {
        // Arrange
        ShortGroup group1 = new ShortGroup(1L, "Group 1", true);
        List<ShortGroup> publicGroups = Arrays.asList(group1);

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(groupService.getShortGroupsByPublicStatus(true)).thenReturn(publicGroups);

        // Act
        List<ShortGroup> result = groupController.getAllShortGroups(testSessionId, true);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getGroupId());
        assertEquals("Group 1", result.get(0).getName());
        assertTrue(result.get(0).isPublic());
        verify(groupService).getShortGroupsByPublicStatus(true);
        verify(userService).validateSession(testSessionId);
    }

    @Test
    void getAllShortGroups_FilterPrivate() {
        // Arrange
        ShortGroup group2 = new ShortGroup(2L, "Group 2", false);
        List<ShortGroup> privateGroups = Arrays.asList(group2);

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(groupService.getShortGroupsByPublicStatus(false)).thenReturn(privateGroups);

        // Act
        List<ShortGroup> result = groupController.getAllShortGroups(testSessionId, false);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(2L, result.get(0).getGroupId());
        assertEquals("Group 2", result.get(0).getName());
        assertFalse(result.get(0).isPublic());
        verify(groupService).getShortGroupsByPublicStatus(false);
        verify(userService).validateSession(testSessionId);
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

    @Test
    void getAllShortGroups_NoFilterParameter_ReturnsAllGroups() {
        // Arrange
        List<ShortGroup> allGroups = List.of(
            new ShortGroup(1L, "Public Group", true),
            new ShortGroup(2L, "Private Group", false)
        );

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(groupService.getAllShortGroups()).thenReturn(allGroups);

        // Act
        List<ShortGroup> result = groupController.getAllShortGroups(testSessionId, null);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(userService).validateSession(testSessionId);
        verify(groupService).getAllShortGroups();
        verifyNoMoreInteractions(groupService);
    }

    @Test
    void getAllShortGroups_InvalidSession_ThrowsException() {
        // Arrange
        when(userService.validateSession(testSessionId))
            .thenThrow(new InvalidSessionException("Invalid session"));

        // Act & Assert
        assertThrows(InvalidSessionException.class,
            () -> groupController.getAllShortGroups(testSessionId, null));
        verify(userService).validateSession(testSessionId);
        verifyNoInteractions(groupService);
    }

    @Test
    void getAllShortGroups_EmptyResult_ReturnsEmptyList() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(groupService.getAllShortGroups()).thenReturn(List.of());

        // Act
        List<ShortGroup> result = groupController.getAllShortGroups(testSessionId, null);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(userService).validateSession(testSessionId);
        verify(groupService).getAllShortGroups();
    }

    @Test
    void getAllShortEvents_NoFilters_ReturnsEventsInChronologicalOrder() {
        // Arrange
        Long groupId = 1L;
        List<ShortEvent> events = List.of(
                new ShortEvent(1L, "Upcoming Event"),
                new ShortEvent(2L, "Another Event")
        );

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.getShortEventsByGroupId(groupId)).thenReturn(events);

        // Act
        List<ShortEvent> result = groupController.getGroupShortEvents(groupId, testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(userService).validateSession(testSessionId);
        verify(eventService).getShortEventsByGroupId(groupId);
    }

    @Test
    void getAllShortEvents_WithSearchFilter_FiltersCorrectly() {
        // Arrange
        Long groupId = 1L;
        String searchTerm = "Party";
        List<ShortEvent> filteredEvents = List.of(new ShortEvent(3L, "Party Event"));

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.getShortEventsByGroupId(groupId)).thenReturn(filteredEvents);

        // Act
        List<ShortEvent> result = groupController.getGroupShortEvents(groupId, testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Party Event", result.get(0).getName());
        verify(eventService).getShortEventsByGroupId(groupId);
    }

    @Test
    void getAllShortEvents_WithDateRangeFilters_FiltersCorrectly() {
        // Arrange
        Long groupId = 1L;
        Long startTime = 1701388800L; // 2023-12-01T00:00:00
        Long endTime = 1704067199L; // 2023-12-31T23:59:59

        List<ShortEvent> filteredEvents = List.of(
                new ShortEvent(1L, "Event in December 1"),
                new ShortEvent(2L, "Event in December 2")
        );

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.getShortEventsByGroupId(groupId)).thenReturn(filteredEvents);

        // Act
        List<ShortEvent> result = groupController.getGroupShortEvents(groupId, testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(userService).validateSession(testSessionId);
        verify(eventService).getShortEventsByGroupId(groupId);
    }

    @Test
    void getAllShortEvents_WithPublicFilter_FiltersCorrectly() {
        // Arrange
        Long groupId = 1L;
        List<ShortEvent> filteredEvents = List.of(
                new ShortEvent(1L, "Public Event 1"),
                new ShortEvent(3L, "Public Event 2")
        );

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.getShortEventsByGroupId(groupId)).thenReturn(filteredEvents);

        // Act
        List<ShortEvent> result = groupController.getGroupShortEvents(groupId, testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(userService).validateSession(testSessionId);
        verify(eventService).getShortEventsByGroupId(groupId);
    }

    @Test
    void getAllShortEvents_IncludePastEvents_IncludesCorrectly() {
        // Arrange
        Long groupId = 1L;
        List<ShortEvent> allEvents = List.of(
                new ShortEvent(1L, "Past Event"),
                new ShortEvent(2L, "Current Event"),
                new ShortEvent(3L, "Future Event")
        );

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.getShortEventsByGroupId(groupId)).thenReturn(allEvents);

        // Act
        List<ShortEvent> result = groupController.getGroupShortEvents(groupId, testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
        verify(userService).validateSession(testSessionId);
        verify(eventService).getShortEventsByGroupId(groupId);
    }

    @Test
    void getAllShortEvents_WithCombinedFilters_FiltersCorrectly() {
        // Arrange
        Long groupId = 1L;
        List<ShortEvent> filteredEvents = List.of(
                new ShortEvent(5L, "Event with combined filters")
        );

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.getShortEventsByGroupId(groupId)).thenReturn(filteredEvents);

        // Act
        List<ShortEvent> result = groupController.getGroupShortEvents(groupId, testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Event with combined filters", result.get(0).getName());
        verify(userService).validateSession(testSessionId);
        verify(eventService).getShortEventsByGroupId(groupId);
    }

    @Test
    void getAllShortEvents_InvalidSession_ThrowsException() {
        // Arrange
        when(userService.validateSession(testSessionId))
            .thenThrow(new InvalidSessionException("Invalid session"));

        // Act & Assert
        assertThrows(InvalidSessionException.class, () ->
                groupController.getGroupShortEvents(
                        1L, testSessionId));

        verify(userService).validateSession(testSessionId);
        verifyNoInteractions(eventService);
    }

    @Test
    void requestGroupAccess_Success() {
        // Arrange
        Long groupId = 1L;
        Group mockGroup = new Group();
        mockGroup.setPublic(false);
        mockGroup.setParticipants(List.of()); // Initialize empty list to avoid NPE
        mockGroup.setHosts(List.of());        // Initialize empty list to avoid NPE

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(groupService.getGroupById(groupId)).thenReturn(mockGroup);
        doNothing().when(groupService).sendGroupAccessRequests(groupId, testUser);

        // Act
        ResponseEntity<?> response = groupController.requestGroupAccess(groupId, testSessionId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userService).validateSession(testSessionId);
        verify(groupService).getGroupById(groupId);
        verify(groupService).sendGroupAccessRequests(groupId, testUser);
    }

    @Test
    void requestGroupAccess_InvalidSession() {
        // Arrange
        Long groupId = 1L;

        when(userService.validateSession(testSessionId))
            .thenThrow(new InvalidSessionException("Invalid session"));

        // Act & Assert
        assertThrows(InvalidSessionException.class,
            () -> groupController.requestGroupAccess(groupId, testSessionId));
        verify(userService).validateSession(testSessionId);
        verifyNoInteractions(groupService);
    }

    @Test
    void respondToAccessRequest_Success() {
        // Arrange
        String requestId = "abc-123";
        String action = "accept";
        Long groupId = 1L;
        String userEmail = "requester@example.com";
        String expectedResponse = "Request Accepted";

        when(groupService.processAccessResponse(requestId, action, groupId, userEmail))
                .thenReturn(expectedResponse);

        // Act
        ResponseEntity<String> response = groupController.respondToAccessRequest(
                requestId, action, groupId, userEmail);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedResponse, response.getBody());
        verify(groupService).processAccessResponse(requestId, action, groupId, userEmail);
    }

    @Test
    void respondToAccessRequest_InvalidAction() {
        // Arrange
        String requestId = "abc-123";
        String action = "invalid";
        Long groupId = 1L;
        String userEmail = "requester@example.com";

        when(groupService.processAccessResponse(requestId, action, groupId, userEmail))
                .thenThrow(new IllegalArgumentException("Invalid action: invalid"));

        // Act & Assert
        ResponseEntity<String> response = groupController.respondToAccessRequest(
                requestId, action, groupId, userEmail);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertTrue(response.getBody().contains("Invalid action: invalid"));
        verify(groupService).processAccessResponse(requestId, action, groupId, userEmail);
    }

}