package com.grapevine.service;

import com.grapevine.model.Notification;
import com.grapevine.model.User;
import com.grapevine.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

public class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserService userService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationService notificationService;

    private User testUser;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        testUser = new User();
        testUser.setUserEmail("user@example.com");
        testUser.setName("Test User");

        testNotification = new Notification();
        testNotification.setNotificationId(1L);
        testNotification.setRecipientEmail("user@example.com");
        testNotification.setSenderEmail("sender@example.com");
        testNotification.setSenderName("Sender User");
        testNotification.setType(Notification.NotificationType.MESSAGE);
        testNotification.setContent("New message");
        testNotification.setReferenceId(1L);
        testNotification.setRead(false);
    }

    // STORY3.4 As a user, I would to receive notifications about messages (Ayush)
    @Test
    void createNotification_CreatesAndSavesNotification() {
        // Arrange
        when(userService.getUserByEmail("sender@example.com")).thenReturn(testUser);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        Notification result = notificationService.createNotification(
                "user@example.com",
                "sender@example.com",
                Notification.NotificationType.MESSAGE,
                "New message",
                1L);

        // Assert
        assertEquals(testNotification, result);
        verify(notificationRepository).save(any(Notification.class));
    }

    // STORY3.4 As a user, I would to receive notifications about messages (Ayush)
    @Test
    void sendNotificationToUser_SendsNotificationThroughWebSocket() {
        // Initialize missing fields to prevent NullPointerException
        testNotification.setCreatedAt(LocalDateTime.now());

        // Use a mock map to avoid Map.of() null value issues
        doNothing().when(messagingTemplate).convertAndSendToUser(
                anyString(),
                anyString(),
                any(Map.class)
        );

        // Act
        notificationService.sendNotificationToUser(testNotification);

        // Assert
        verify(messagingTemplate).convertAndSendToUser(
                eq("user@example.com"),
                eq("/queue/notifications"),
                any(Map.class)
        );
    }

    // STORY3.4 As a user, I would to receive notifications about messages (Ayush)
    @Test
    void getAllNotifications_ReturnsUserNotifications() {
        // Arrange
        List<Notification> notifications = Arrays.asList(testNotification);
        when(notificationRepository.findByRecipientEmailAndReadOrderByCreatedAtDesc("user@example.com", false))
                .thenReturn(notifications);

        // Act
        List<Notification> result = notificationService.getAllNotifications("user@example.com");

        // Assert
        assertEquals(1, result.size());
        assertEquals(testNotification, result.get(0));
        verify(notificationRepository).findByRecipientEmailAndReadOrderByCreatedAtDesc("user@example.com", false);
    }
}