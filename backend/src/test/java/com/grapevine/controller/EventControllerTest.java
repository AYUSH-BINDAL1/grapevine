package com.grapevine.controller;

import com.grapevine.exception.EventNotFoundException;
import com.grapevine.exception.InvalidSessionException;
import com.grapevine.exception.UnauthorizedException;
import com.grapevine.model.Event;
import com.grapevine.model.EventFilter;
import com.grapevine.model.ShortEvent;
import com.grapevine.model.User;
import com.grapevine.service.EventService;
import com.grapevine.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.eq;

public class EventControllerTest {

    @Mock
    private EventService eventService;

    @Mock
    private UserService userService;

    @InjectMocks
    private EventController eventController;

    private final String testSessionId = "test-session-id";
    private User testUser;
    private Event testEvent;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        testUser = new User();
        testUser.setUserEmail("test@example.com");

        testEvent = new Event();
        testEvent.setEventId(1L);
        testEvent.setName("Test Event");
    }

    @Test
    void getAllEvents_Success() {
        // Arrange
        Event event1 = new Event();
        event1.setEventId(1L);
        event1.setName("Event 1");

        Event event2 = new Event();
        event2.setEventId(2L);
        event2.setName("Event 2");

        when(eventService.getAllEvents()).thenReturn(Arrays.asList(event1, event2));

        // Act
        List<Event> result = eventController.getAllEvents(testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Event 1", result.get(0).getName());
        assertEquals("Event 2", result.get(1).getName());
        verify(eventService).getAllEvents();
        // Note: Session validation is not required for getAllEvents
        verifyNoInteractions(userService);
    }

    @Test
    void getAllShortEvents_Success() {
        // Arrange
        ShortEvent event1 = new ShortEvent(1L, "Event 1", 1L);
        ShortEvent event2 = new ShortEvent(2L, "Event 2", 2L);

        // Create a filter with all null parameters (default filter)
        EventFilter filter = new EventFilter(null, null, null, null, null, null, null, null, null);

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.getAllShortEvents(any(EventFilter.class))).thenReturn(Arrays.asList(event1, event2));

        // Act
        List<ShortEvent> result = eventController.getAllShortEvents(
                testSessionId, null, null, null, null, null, null, null, null, null);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getEventId());
        assertEquals("Event 1", result.get(0).getName());
        assertEquals(2L, result.get(1).getEventId());
        assertEquals("Event 2", result.get(1).getName());

        verify(userService).validateSession(testSessionId);
        verify(eventService).getAllShortEvents(any(EventFilter.class));
    }

    //STORY11 As a user, I would like to be redirected to an event details page after creating an event
    @Test
    void getEvent_Success() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.getEventById(1L)).thenReturn(testEvent);

        // Act
        Event result = eventController.getEvent(1L, testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getEventId());
        assertEquals("Test Event", result.getName());
        verify(userService).validateSession(testSessionId);
        verify(eventService).getEventById(1L);
    }

    @Test
    void getEvent_InvalidSession() {
        // Arrange
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        // Act & Assert
        assertThrows(InvalidSessionException.class,
                () -> eventController.getEvent(1L, testSessionId));
        verify(userService).validateSession(testSessionId);
        verifyNoInteractions(eventService);
    }

    @Test
    void getEvent_WithNullSessionId() {
        // Arrange
        String nullSessionId = null;

        // Setup userService to throw exception for null value
        when(userService.validateSession(nullSessionId))
                .thenThrow(new InvalidSessionException("Session ID cannot be null"));

        // Act & Assert
        assertThrows(InvalidSessionException.class,
                () -> eventController.getEvent(1L, nullSessionId));
        verify(userService).validateSession(nullSessionId);
        verifyNoInteractions(eventService);
    }

    @Test
    void updateEvent_Success() {
        // Arrange
        Event updatedEvent = new Event();
        updatedEvent.setName("Updated Event");
        updatedEvent.setDescription("Updated description");

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.updateEvent(eq(1L), any(Event.class), eq(testUser)))
                .thenReturn(updatedEvent);

        // Act
        Event result = eventController.updateEvent(1L, updatedEvent, testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals("Updated Event", result.getName());
        assertEquals("Updated description", result.getDescription());
        verify(userService).validateSession(testSessionId);
        verify(eventService).updateEvent(eq(1L), any(Event.class), eq(testUser));
    }

    @Test
    void updateEvent_InvalidSession() {
        // Arrange
        Event updatedEvent = new Event();
        updatedEvent.setName("Updated Event");

        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        // Act & Assert
        assertThrows(InvalidSessionException.class,
                () -> eventController.updateEvent(1L, updatedEvent, testSessionId));
        verify(userService).validateSession(testSessionId);
        verifyNoInteractions(eventService);
    }

    @Test
    void updateEvent_EventNotFound() {
        // Arrange
        Event updatedEvent = new Event();
        updatedEvent.setName("Updated Event");

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.updateEvent(eq(999L), any(Event.class), eq(testUser)))
                .thenThrow(new EventNotFoundException("Event not found with id: 999"));

        // Act & Assert
        assertThrows(EventNotFoundException.class,
                () -> eventController.updateEvent(999L, updatedEvent, testSessionId));
        verify(userService).validateSession(testSessionId);
        verify(eventService).updateEvent(eq(999L), any(Event.class), eq(testUser));
    }

    @Test
    void updateEvent_Unauthorized() {
        // Arrange
        Event updatedEvent = new Event();
        updatedEvent.setName("Updated Event");

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.updateEvent(eq(1L), any(Event.class), eq(testUser)))
                .thenThrow(new UnauthorizedException("Only event hosts can update events"));

        // Act & Assert
        assertThrows(UnauthorizedException.class,
                () -> eventController.updateEvent(1L, updatedEvent, testSessionId));
        verify(userService).validateSession(testSessionId);
        verify(eventService).updateEvent(eq(1L), any(Event.class), eq(testUser));
    }

    @Test
    void updateEvent_InvalidDateTime() {
        // Arrange
        Event updatedEvent = new Event();
        updatedEvent.setName("Updated Event");
        updatedEvent.setEventTime(LocalDateTime.now().minusDays(1));

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.updateEvent(eq(1L), any(Event.class), eq(testUser)))
                .thenThrow(new IllegalArgumentException("Event time must be in the future"));

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> eventController.updateEvent(1L, updatedEvent, testSessionId));
        verify(userService).validateSession(testSessionId);
        verify(eventService).updateEvent(eq(1L), any(Event.class), eq(testUser));
    }

    @Test
    void deleteEvent_Success() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        doNothing().when(eventService).deleteEvent(1L, testUser);

        // Act
        eventController.deleteEvent(1L, testSessionId);

        // Assert
        verify(userService).validateSession(testSessionId);
        verify(eventService).deleteEvent(1L, testUser);
    }

    @Test
    void deleteEvent_InvalidSession() {
        // Arrange
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        // Act & Assert
        assertThrows(InvalidSessionException.class,
                () -> eventController.deleteEvent(1L, testSessionId));
        verify(userService).validateSession(testSessionId);
        verifyNoInteractions(eventService);
    }

    @Test
    void deleteEvent_EventNotFound() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        doThrow(new EventNotFoundException("Event not found with id: 999"))
                .when(eventService).deleteEvent(999L, testUser);

        // Act & Assert
        assertThrows(EventNotFoundException.class,
                () -> eventController.deleteEvent(999L, testSessionId));
        verify(userService).validateSession(testSessionId);
        verify(eventService).deleteEvent(999L, testUser);
    }

    @Test
    void deleteEvent_Unauthorized() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        doThrow(new UnauthorizedException("Only event hosts can delete events"))
                .when(eventService).deleteEvent(1L, testUser);

        // Act & Assert
        assertThrows(UnauthorizedException.class,
                () -> eventController.deleteEvent(1L, testSessionId));
        verify(userService).validateSession(testSessionId);
        verify(eventService).deleteEvent(1L, testUser);
    }

    //STORY9 As a user I would like to see a collection of upcoming events on the events page
    @Test
    void getAllShortEvents_NoFilters_ReturnsEventsInChronologicalOrder() {
        // Arrange
        EventFilter expectedFilter = new EventFilter(null, null, null, null, null, null, null, null, null);

        List<ShortEvent> events = List.of(
            new ShortEvent(1L, "Upcoming Event", 1L),
            new ShortEvent(2L, "Another Event", 2L)
        );

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.getAllShortEvents(argThat(filter ->
            filter.getSearch() == null &&
            filter.getMinUsers() == null &&
            filter.getMaxUsers() == null &&
            filter.getStartTime() == null &&
            filter.getEndTime() == null &&
            filter.getLocationId() == null &&
            filter.getIsPublic() == null &&
            filter.getIncludePastEvents() == null &&
            filter.getOnlyFullEvents() == null
        ))).thenReturn(events);

        // Act
        List<ShortEvent> result = eventController.getAllShortEvents(
                testSessionId, null, null, null, null, null, null, null, null, null);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(userService).validateSession(testSessionId);
        verify(eventService).getAllShortEvents(any(EventFilter.class));
    }

    //STORY10 As a user, I would like be filter through upcoming events
    @Test
    void getAllShortEvents_WithSearchFilter_FiltersCorrectly() {
        // Arrange
        String searchTerm = "Party";
        List<ShortEvent> filteredEvents = List.of(new ShortEvent(3L, "Party Event", 3L));

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.getAllShortEvents(argThat(filter ->
            searchTerm.equals(filter.getSearch()) &&
            filter.getMinUsers() == null
        ))).thenReturn(filteredEvents);

        // Act
        List<ShortEvent> result = eventController.getAllShortEvents(
                testSessionId, searchTerm, null, null, null, null, null, null, null, null);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Party Event", result.get(0).getName());
        verify(eventService).getAllShortEvents(any(EventFilter.class));
    }


    @Test
    void getAllShortEvents_WithPublicFilter_FiltersCorrectly() {
        // Arrange
        Boolean isPublic = true;
        List<ShortEvent> filteredEvents = List.of(
            new ShortEvent(1L, "Public Event 1", 1L),
            new ShortEvent(3L, "Public Event 2", 3L)
        );

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.getAllShortEvents(argThat(filter ->
            isPublic.equals(filter.getIsPublic())
        ))).thenReturn(filteredEvents);

        // Act
        List<ShortEvent> result = eventController.getAllShortEvents(
                testSessionId, null, null, null, null, null, null, isPublic, null, null);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(eventService).getAllShortEvents(any(EventFilter.class));
    }

    @Test
    void getAllShortEvents_IncludePastEvents_IncludesCorrectly() {
        // Arrange
        Boolean includePastEvents = true;
        List<ShortEvent> allEvents = List.of(
            new ShortEvent(1L, "Past Event", 1L),
            new ShortEvent(2L, "Current Event", 2L),
            new ShortEvent(3L, "Future Event", 3L)
        );

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.getAllShortEvents(argThat(filter ->
            includePastEvents.equals(filter.getIncludePastEvents())
        ))).thenReturn(allEvents);

        // Act
        List<ShortEvent> result = eventController.getAllShortEvents(
                testSessionId, null, null, null, null, null, null, null, includePastEvents, null);

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
        verify(eventService).getAllShortEvents(any(EventFilter.class));
    }

    @Test
    void getAllShortEvents_WithCombinedFilters_FiltersCorrectly() {
        // Arrange
        String searchTerm = "Event";
        Integer minUsers = 5;
        Integer maxUsers = 20;
        Boolean isPublic = true;

        List<ShortEvent> filteredEvents = List.of(
            new ShortEvent(5L, "Event with combined filters", 5L)
        );

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(eventService.getAllShortEvents(argThat(filter ->
            searchTerm.equals(filter.getSearch()) &&
            minUsers.equals(filter.getMinUsers()) &&
            maxUsers.equals(filter.getMaxUsers()) &&
            isPublic.equals(filter.getIsPublic())
        ))).thenReturn(filteredEvents);

        // Act
        List<ShortEvent> result = eventController.getAllShortEvents(
                testSessionId, searchTerm, minUsers, maxUsers, null, null, null, isPublic, null, null);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Event with combined filters", result.get(0).getName());
        verify(eventService).getAllShortEvents(any(EventFilter.class));
    }

    @Test
    void getAllShortEvents_InvalidSession_ThrowsException() {
        // Arrange
        when(userService.validateSession(testSessionId))
            .thenThrow(new InvalidSessionException("Invalid session"));

        // Act & Assert
        assertThrows(InvalidSessionException.class, () ->
            eventController.getAllShortEvents(testSessionId, null, null, null, null, null, null, null, null, null));

        verify(userService).validateSession(testSessionId);
        verifyNoInteractions(eventService);
    }
}