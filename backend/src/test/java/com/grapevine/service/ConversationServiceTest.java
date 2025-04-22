package com.grapevine.service;

import com.grapevine.model.Conversation;
import com.grapevine.model.ConversationPreview;
import com.grapevine.model.Message;
import com.grapevine.model.User;
import com.grapevine.repository.ConversationRepository;
import com.grapevine.repository.MessageRepository;
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
import static org.mockito.Mockito.*;

public class ConversationServiceTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private ConversationService conversationService;

    @Mock
    private MessageRepository messageRepository;

    private User testUser1;
    private User testUser2;
    private Conversation testConversation;

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
        testConversation.setLastMessage("Hello");
        testConversation.setLastMessageTime(LocalDateTime.now());
    }

    // STORY3.3 As a user I would like to be able to view my message history (Ayush)
    @Test
    void getUserConversations_ReturnsAllUserConversations() {
        // Arrange
        List<Conversation> conversations = Arrays.asList(testConversation);
        when(conversationRepository.findByParticipantEmailOrderByLastMessageTimeDesc("user1@example.com"))
                .thenReturn(conversations);

        // Set up mocks needed for ConversationPreview creation
        when(userService.getUserByEmail("user2@example.com")).thenReturn(testUser2);

        // Mock needed for unread count

        when(messageRepository.countByConversationIdAndSenderEmailNotAndSeenFalse(1L, "user1@example.com"))
                .thenReturn(0);

        // Act
        List<ConversationPreview> result = conversationService.getUserConversations("user1@example.com");

        // Assert
        assertEquals(1, result.size());

        // Check individual properties instead of comparing objects
        assertEquals(1L, result.get(0).getConversationId());
        assertEquals("user2@example.com", result.get(0).getFriendEmail());
        assertEquals("User Two", result.get(0).getFriendName());

        verify(conversationRepository).findByParticipantEmailOrderByLastMessageTimeDesc("user1@example.com");
    }

    // STORY3.3 As a user I would like to be able to view my message history (Ayush)
    @Test
    void getConversationById_ReturnsConversation_WhenUserHasAccess() {
        // Arrange
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(testConversation));

        // Act
        Conversation result = conversationService.getConversationById(1L, "user1@example.com");

        // Assert
        assertEquals(testConversation, result);
        verify(conversationRepository).findById(1L);
    }

    // STORY3.7 As a user I would like to be able to search my message threads for a user and if I do not already have one to create a message thread with them through the search feature (Ayush)
    @Test
    void getOrCreateConversation_ReturnsExistingConversation() {
        // Arrange
        when(conversationRepository.findByParticipantEmails(
                "user1@example.com", "user2@example.com")).thenReturn(Optional.of(testConversation));

        // Set up friends list to pass validation
        testUser1.setFriends(Arrays.asList("user2@example.com"));
        when(userService.getUserByEmail("user1@example.com")).thenReturn(testUser1);

        // Act
        Conversation result = conversationService.getOrCreateConversation("user1@example.com", "user2@example.com");

        // Assert
        assertEquals(testConversation, result);
        verify(conversationRepository).findByParticipantEmails(
                "user1@example.com", "user2@example.com");
        verify(conversationRepository, never()).save(any(Conversation.class));
    }

    // STORY3.7 As a user I would like to be able to search my message threads for a user and if I do not already have one to create a message thread with them through the search feature (Ayush)
    @Test
    void getOrCreateConversation_CreatesNewConversation_WhenNoneExists() {
        // Arrange
        when(conversationRepository.findByParticipantEmails(
                "user1@example.com", "user2@example.com")).thenReturn(Optional.empty());

        // Set up friends list to pass validation
        testUser1.setFriends(Arrays.asList("user2@example.com"));
        when(userService.getUserByEmail("user1@example.com")).thenReturn(testUser1);
        when(userService.getUserByEmail("user2@example.com")).thenReturn(testUser2);
        when(conversationRepository.save(any(Conversation.class))).thenReturn(testConversation);

        // Act
        Conversation result = conversationService.getOrCreateConversation("user1@example.com", "user2@example.com");

        // Assert
        assertEquals(testConversation, result);
        verify(conversationRepository).findByParticipantEmails(
                "user1@example.com", "user2@example.com");
        verify(conversationRepository).save(any(Conversation.class));
    }
}