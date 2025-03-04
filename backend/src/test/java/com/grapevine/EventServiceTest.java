package com.grapevine;

import com.grapevine.exception.EventNotFoundException;
import com.grapevine.exception.GroupNotFoundException;
import com.grapevine.exception.UnauthorizedException;
import com.grapevine.model.Event;
import com.grapevine.model.Group;
import com.grapevine.model.ShortEvent;
import com.grapevine.model.User;
import com.grapevine.repository.EventRepository;
import com.grapevine.repository.GroupRepository;
import com.grapevine.repository.UserRepository;
import com.grapevine.service.EventService;
import com.grapevine.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class EventServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GroupRepository groupRepository;

    @InjectMocks
    private EventService eventService;

    private User testUser;
    private Group testGroup;
    private Event testEvent;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Set up test user
        testUser = new User();
        testUser.setUserEmail("test@example.com");
        testUser.setName("Test User");
        testUser.setHostedGroups(new ArrayList<>());
        testUser.setJoinedGroups(new ArrayList<>());
        testUser.setHostedEvents(new ArrayList<>());
        testUser.setJoinedEvents(new ArrayList<>());

        // Set up test group
        testGroup = new Group();
        testGroup.setGroupId(1L);
        testGroup.setName("Test Group");
        testGroup.setDescription("Group for testing");
        testGroup.setMaxUsers(10);
        testGroup.setHosts(new ArrayList<>(List.of("test@example.com")));
        testGroup.setParticipants(new ArrayList<>());
        testGroup.setEvents(new ArrayList<>());

        // Set up test event
        testEvent = new Event();
        testEvent.setEventId(1L);
        testEvent.setName("Test Event");
        testEvent.setDescription("Event for testing");
        testEvent.setGroupId(1L);
        testEvent.setHosts(new ArrayList<>());
        testEvent.setParticipants(new ArrayList<>());
    }

    @Test
    void getAllEvents_ShouldReturnAllEvents() {
        // Arrange
        List<Event> expectedEvents = new ArrayList<>();
        expectedEvents.add(testEvent);

        Event secondEvent = new Event();
        secondEvent.setEventId(2L);
        secondEvent.setName("Second Event");
        secondEvent.setDescription("Another event");
        secondEvent.setGroupId(1L);
        secondEvent.setHosts(new ArrayList<>());
        secondEvent.setParticipants(new ArrayList<>());
        expectedEvents.add(secondEvent);

        when(eventRepository.findAll()).thenReturn(expectedEvents);

        // Act
        List<Event> result = eventService.getAllEvents();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Test Event", result.get(0).getName());
        assertEquals("Second Event", result.get(1).getName());
        verify(eventRepository).findAll();
    }

    @Test
    void getAllShortEvents_ShouldReturnAllEventsInShortForm() {
        // Arrange
        List<Event> events = new ArrayList<>();
        events.add(testEvent);

        Event secondEvent = new Event();
        secondEvent.setEventId(2L);
        secondEvent.setName("Second Event");
        secondEvent.setDescription("Another event");
        secondEvent.setGroupId(1L);
        secondEvent.setHosts(new ArrayList<>());
        secondEvent.setParticipants(new ArrayList<>());
        events.add(secondEvent);

        when(eventRepository.findAll()).thenReturn(events);

        // Act
        List<ShortEvent> result = eventService.getAllShortEvents();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getEventId());
        assertEquals("Test Event", result.get(0).getName());
        assertEquals(2L, result.get(1).getEventId());
        assertEquals("Second Event", result.get(1).getName());
        verify(eventRepository).findAll();
    }

    @Test
    void createEvent_Success() {
        // Arrange
        Event eventToCreate = new Event();
        eventToCreate.setName("New Event");
        eventToCreate.setDescription("New event description");
        // hosts and participants are null

        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> {
            Event savedEvent = invocation.getArgument(0);
            savedEvent.setEventId(1L);
            return savedEvent;
        });

        // Act
        Event result = eventService.createEvent(eventToCreate, 1L, testUser);

        // Assert
        assertNotNull(result);
        assertEquals("New Event", result.getName());
        assertEquals(1L, result.getGroupId());
        assertNotNull(result.getHosts());
        assertNotNull(result.getParticipants());
        assertTrue(result.getHosts().contains(testUser.getUserEmail()));

        verify(groupRepository).findById(1L);
        verify(eventRepository).save(any(Event.class));
        verify(userRepository).save(testUser);
        verify(groupRepository).save(testGroup);

        // Check that user and group were updated properly
        assertTrue(testUser.getHostedEvents().contains(1L));
        assertTrue(testGroup.getEvents().contains(1L));
    }

    @Test
    void createEvent_GroupNotFound() {
        // Arrange
        Event eventToCreate = new Event();
        eventToCreate.setName("New Event");

        when(groupRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        GroupNotFoundException exception = assertThrows(GroupNotFoundException.class,
                () -> eventService.createEvent(eventToCreate, 999L, testUser));

        assertEquals("Group not found with id: 999", exception.getMessage());
        verify(groupRepository).findById(999L);
        verifyNoInteractions(eventRepository);
        verifyNoInteractions(userRepository);
    }

    @Test
    void createEvent_UserNotGroupHost() {
        // Arrange
        Event eventToCreate = new Event();
        eventToCreate.setName("New Event");

        Group group = new Group();
        group.setGroupId(1L);
        group.setHosts(new ArrayList<>(List.of("other@example.com")));

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        // Act & Assert
        UnauthorizedException exception = assertThrows(UnauthorizedException.class,
                () -> eventService.createEvent(eventToCreate, 1L, testUser));

        assertEquals("Only group hosts can create events", exception.getMessage());
        verify(groupRepository).findById(1L);
        verifyNoInteractions(eventRepository);
        verifyNoInteractions(userRepository);
    }

    @Test
    void getEventById_Success() {
        // Arrange
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));

        // Act
        Event result = eventService.getEventById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getEventId());
        assertEquals("Test Event", result.getName());
        verify(eventRepository).findById(1L);
    }

    @Test
    void getEventById_EventNotFound() {
        // Arrange
        when(eventRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        EventNotFoundException exception = assertThrows(EventNotFoundException.class,
                () -> eventService.getEventById(999L));

        assertEquals("Event not found with id: 999", exception.getMessage());
        verify(eventRepository).findById(999L);
    }

    @Test
    void getEventsByGroupId_Success() {
        // Arrange
        testGroup.setEvents(Arrays.asList(1L, 2L));

        Event event1 = new Event();
        event1.setEventId(1L);
        event1.setName("Event 1");

        Event event2 = new Event();
        event2.setEventId(2L);
        event2.setName("Event 2");

        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event1));
        when(eventRepository.findById(2L)).thenReturn(Optional.of(event2));

        // Act
        List<Event> result = eventService.getEventsByGroupId(1L);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Event 1", result.get(0).getName());
        assertEquals("Event 2", result.get(1).getName());
        verify(groupRepository).findById(1L);
        verify(eventRepository).findById(1L);
        verify(eventRepository).findById(2L);
    }

    @Test
    void getEventsByGroupId_GroupNotFound() {
        // Arrange
        when(groupRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        GroupNotFoundException exception = assertThrows(GroupNotFoundException.class,
                () -> eventService.getEventsByGroupId(999L));

        assertEquals("Group not found with id: 999", exception.getMessage());
        verify(groupRepository).findById(999L);
        verifyNoInteractions(eventRepository);
    }

    @Test
    void getEventsByGroupId_NoEvents() {
        // Arrange
        testGroup.setEvents(new ArrayList<>());
        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

        // Act
        List<Event> result = eventService.getEventsByGroupId(1L);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(groupRepository).findById(1L);
        verifyNoInteractions(eventRepository);
    }

    @Test
    void getEventsByGroupId_NullEventsList() {
        // Arrange
        testGroup.setEvents(null);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

        // Act
        List<Event> result = eventService.getEventsByGroupId(1L);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(groupRepository).findById(1L);
        verifyNoInteractions(eventRepository);
    }

    @Test
    void getShortEventsByGroupId_Success() {
        // Arrange
        testGroup.setEvents(Arrays.asList(1L, 2L));

        Event event1 = new Event();
        event1.setEventId(1L);
        event1.setName("Event 1");

        Event event2 = new Event();
        event2.setEventId(2L);
        event2.setName("Event 2");

        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event1));
        when(eventRepository.findById(2L)).thenReturn(Optional.of(event2));

        // Act
        List<ShortEvent> result = eventService.getShortEventsByGroupId(1L);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getEventId());
        assertEquals("Event 1", result.get(0).getName());
        assertEquals(2L, result.get(1).getEventId());
        assertEquals("Event 2", result.get(1).getName());
        verify(groupRepository).findById(1L);
        verify(eventRepository).findById(1L);
        verify(eventRepository).findById(2L);
    }

    @Test
    void getShortEventsByGroupId_GroupNotFound() {
        // Arrange
        when(groupRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        GroupNotFoundException exception = assertThrows(GroupNotFoundException.class,
                () -> eventService.getShortEventsByGroupId(999L));

        assertEquals("Group not found with id: 999", exception.getMessage());
        verify(groupRepository).findById(999L);
        verifyNoInteractions(eventRepository);
    }

    @Test
    void getShortEventsByGroupId_NoEvents() {
        // Arrange
        testGroup.setEvents(new ArrayList<>());
        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

        // Act
        List<ShortEvent> result = eventService.getShortEventsByGroupId(1L);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(groupRepository).findById(1L);
        verifyNoInteractions(eventRepository);
    }

    @Test
    void getShortEventsByGroupId_NullEventsList() {
        // Arrange
        testGroup.setEvents(null);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

        // Act
        List<ShortEvent> result = eventService.getShortEventsByGroupId(1L);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(groupRepository).findById(1L);
        verifyNoInteractions(eventRepository);
    }
}