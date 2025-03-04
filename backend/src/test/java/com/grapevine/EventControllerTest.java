package com.grapevine;

import com.grapevine.controller.EventController;
import com.grapevine.exception.InvalidSessionException;
import com.grapevine.model.Event;
import com.grapevine.model.ShortEvent;
import com.grapevine.model.User;
import com.grapevine.service.EventService;
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
        ShortEvent event1 = new ShortEvent(1L, "Event 1");
        ShortEvent event2 = new ShortEvent(2L, "Event 2");

        when(eventService.getAllShortEvents()).thenReturn(Arrays.asList(event1, event2));

        // Act
        List<ShortEvent> result = eventController.getAllShortEvents(testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getEventId());
        assertEquals("Event 1", result.get(0).getName());
        assertEquals(2L, result.get(1).getEventId());
        assertEquals("Event 2", result.get(1).getName());
        verify(eventService).getAllShortEvents();
        // Note: Session validation is not required for getAllShortEvents
        verifyNoInteractions(userService);
    }

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
}