package com.grapevine.service;

import com.grapevine.model.Conversation;
import com.grapevine.model.Message;
import com.grapevine.model.Notification;
import com.grapevine.model.User;
import com.grapevine.repository.MessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class MessageServiceTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ConversationService conversationService;

    @Mock
    private UserService userService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private MessageService messageService;

    private Conversation testConversation;
    private User testUser1;
    private User testUser2;
    private Message testMessage;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        testUser1 = new User();
        testUser1.setUserEmail("user1@example.com");
        testUser1.setName("User One");

        testUser2 = new User();
        testUser2.setUserEmail("user2@example.com");
        testUser2.setName("User Two");

        testConversation = new Conversation();
        testConversation.setConversationId(1L);
        testConversation.setParticipantEmails(Arrays.asList("user1@example.com", "user2@example.com"));
        testConversation.setMessageIds(new ArrayList<>());

        testMessage = new Message();
        testMessage.setMessageId(1L);
        testMessage.setConversationId(1L);
        testMessage.setSenderEmail("user1@example.com");
        testMessage.setContent("Hello");
        testMessage.setSeen(false);
    }

    // STORY3.2 As a user I would like to send messages to other users (Ayush)
    @Test
    void sendMessage_SavesMessageAndUpdatesConversation() {
        // Arrange
        when(conversationService.getConversationById(1L, "user1@example.com")).thenReturn(testConversation);
        when(messageRepository.save(any(Message.class))).thenReturn(testMessage);
        when(userService.isUserOnline("user2@example.com")).thenReturn(false);
        when(userService.getUserByEmail("user1@example.com")).thenReturn(testUser1);

        // Act
        Message result = messageService.sendMessage(1L, "user1@example.com", "Hello");

        // Assert
        assertEquals(testMessage, result);
        verify(messageRepository).save(any(Message.class));
        verify(conversationService).updateConversationLastMessage(eq(1L), eq("Hello"), any(LocalDateTime.class));
        verify(notificationService).createNotification(
                eq("user2@example.com"),
                eq("user1@example.com"),
                eq(Notification.NotificationType.MESSAGE),
                anyString(),
                eq(1L));
    }

    // STORY3.2 As a user I would like to send messages to other users (Ayush)
    @Test
    void createFirstMessage_CreatesConversationAndSendsMessage() {
        // Arrange
        User sender = new User();
        sender.setUserEmail("user1@example.com");
        sender.setFriends(Arrays.asList("user2@example.com"));

        // Set up mocks for the initial validation
        when(userService.getUserByEmail("user1@example.com")).thenReturn(sender);
        when(userService.getUserByEmail("user2@example.com")).thenReturn(testUser2);

        // Set up the conversation mock
        when(conversationService.getOrCreateConversation("user1@example.com", "user2@example.com"))
                .thenReturn(testConversation);

        // These mocks are needed for the sendMessage method that gets called
        when(conversationService.getConversationById(1L, "user1@example.com")).thenReturn(testConversation);
        when(messageRepository.save(any(Message.class))).thenReturn(testMessage);
        when(userService.isUserOnline("user2@example.com")).thenReturn(false);

        // Act
        Message result = messageService.createFirstMessage("user1@example.com", "user2@example.com", "Hello");

        // Assert
        assertEquals(testMessage, result);
        verify(conversationService).getOrCreateConversation("user1@example.com", "user2@example.com");
        // Verify sendMessage was called
        verify(conversationService).getConversationById(1L, "user1@example.com");
    }

    // STORY3.5 As a user, I would like to be able to message one of my friends from their profile (Ayush)
    @Test
    void getConversationMessages_ReturnsMessagesForConversation() {
        // Arrange
        List<Message> messages = Arrays.asList(testMessage);
        when(conversationService.getConversationById(1L, "user1@example.com")).thenReturn(testConversation);
        when(messageRepository.findByConversationIdOrderBySentAtAsc(1L)).thenReturn(messages);

        // Act
        List<Message> result = messageService.getConversationMessages(1L, "user1@example.com");

        // Assert
        assertEquals(1, result.size());
        assertEquals(testMessage, result.get(0));
        verify(conversationService).getConversationById(1L, "user1@example.com");
        verify(messageRepository).findByConversationIdOrderBySentAtAsc(1L);
    }
}