package com.grapevine.service;

import com.grapevine.exception.EventNotFoundException;
import com.grapevine.model.Event;
import com.grapevine.model.EventReminder;
import com.grapevine.model.Notification;
import com.grapevine.repository.EventReminderRepository;
import com.grapevine.repository.EventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

public class EventReminderServiceTest {

    @Mock
    private EventReminderRepository eventReminderRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserService userService;

    @InjectMocks
    private EventReminderService eventReminderService;

    private Event testEvent;
    private EventReminder testReminder;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        testEvent = new Event();
        testEvent.setEventId(1L);
        testEvent.setName("Test Event");
        testEvent.setHosts(Arrays.asList("host@example.com"));
        testEvent.setParticipants(Arrays.asList("user@example.com"));
        testEvent.setEventTime(LocalDateTime.now().plusDays(1));

        testReminder = new EventReminder();
        testReminder.setReminderId(1L);
        testReminder.setEventId(1L);
        testReminder.setUserEmail("user@example.com");
        testReminder.setReminderTime(LocalDateTime.now().plusHours(22));

        testNotification = new Notification();
        testNotification.setNotificationId(1L);
        testNotification.setType(Notification.NotificationType.EVENT_REMINDER);
    }

    // STORY3.16 As a user I would like to be able to set reminders about my upcoming events (Ayush)
    @Test
    void createReminder_CreatesReminder_ForFutureEvent() {
        // Arrange
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(eventReminderRepository.save(any(EventReminder.class))).thenReturn(testReminder);

        // Act
        EventReminder result = eventReminderService.createReminder(1L, "user@example.com", 60);

        // Assert
        assertEquals(testReminder, result);
        verify(eventRepository).findById(1L);
        verify(eventReminderRepository).save(any(EventReminder.class));
    }

    // STORY3.16 As a user I would like to be able to set reminders about my upcoming events (Ayush)
    @Test
    void processDueReminders_ProcessesReminders_AndSendsNotifications() {
        // Arrange
        List<EventReminder> dueReminders = Arrays.asList(testReminder);
        when(eventReminderRepository.findDueReminders(any(LocalDateTime.class))).thenReturn(dueReminders);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(testEvent));
        when(userService.isUserOnline("user@example.com")).thenReturn(true);
        when(notificationService.createNotification(
                eq("user@example.com"),
                eq("N/A"),
                eq(Notification.NotificationType.EVENT_REMINDER),
                anyString(),
                eq(1L))).thenReturn(testNotification);

        // Act
        eventReminderService.processDueReminders();

        // Assert
        verify(eventReminderRepository).findDueReminders(any(LocalDateTime.class));
        verify(eventRepository).findById(1L);
        verify(notificationService).createNotification(
                eq("user@example.com"),
                eq("N/A"),
                eq(Notification.NotificationType.EVENT_REMINDER),
                anyString(),
                eq(1L));
        verify(notificationService).sendNotificationToUser(testNotification);
        verify(notificationService).markAsRead(anyLong(), eq("user@example.com"));
        verify(eventReminderRepository).markAsSent(1L);
    }
}