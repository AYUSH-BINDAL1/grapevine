package com.grapevine.service;

import com.grapevine.exception.ConversationNotFoundException;
import com.grapevine.model.*;
import com.grapevine.repository.ConversationRepository;
import com.grapevine.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserService userService;

    @Transactional
    public List<ConversationPreview> getUserConversations(String userEmail) {
        List<Conversation> conversations = conversationRepository.findByParticipantEmailOrderByLastMessageTimeDesc(userEmail);

        return conversations.stream().map(conversation -> {
            // Find the friend's email (the other participant)
            String friendEmail = conversation.getParticipantEmails().stream()
                    .filter(email -> !email.equals(userEmail))
                    .findFirst()
                    .orElse("");

            // Get friend's user details
            User friend = userService.getUserByEmail(friendEmail);

            // Count messages that are specifically unseen by this user
            int unreadCount = messageRepository.countByConversationIdAndSenderEmailNotAndSeenFalse(
                    conversation.getConversationId(), userEmail);

            return new ConversationPreview(
                    conversation.getConversationId(),
                    friendEmail,
                    friend.getName(),
                    friend.getProfilePictureUrl(),
                    conversation.getLastMessage(),
                    conversation.getLastMessageTime(),
                    unreadCount > 0
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public Conversation getConversationById(Long conversationId, String userEmail) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ConversationNotFoundException("Conversation not found with id: " + conversationId));

        // Verify user has access to this conversation
        if (!conversation.hasParticipant(userEmail)) {
            throw new ConversationNotFoundException("Conversation not found or you don't have access");
        }

        // Mark messages as seen only if the user is online
        if (userService.isUserOnline(userEmail)) {
            messageRepository.markMessagesAsSeen(conversationId, userEmail);
        }

        return conversation;
    }

    @Transactional
    public Conversation getOrCreateConversation(String userEmail, String friendEmail) {
        // First check if users are friends
        User currentUser = userService.getUserByEmail(userEmail);

        if (currentUser.getFriends() == null || !currentUser.getFriends().contains(friendEmail)) {
            throw new IllegalArgumentException("You can only start conversations with your friends");
        }

        // Check if conversation already exists
        Optional<Conversation> existingConversation = conversationRepository.findByParticipantEmails(userEmail, friendEmail);

        if (existingConversation.isPresent()) {
            return existingConversation.get();
        }

        // Create new conversation
        Conversation newConversation = new Conversation();
        newConversation.setParticipantEmails(List.of(userEmail, friendEmail));
        newConversation.setMessageIds(new ArrayList<>());

        return conversationRepository.save(newConversation);
    }

    @Transactional
    public List<ShortFriend> searchFriends(String userEmail, String searchQuery) {
        // Get the current user
        User currentUser = userService.getUserByEmail(userEmail);

        if (currentUser.getFriends() == null || currentUser.getFriends().isEmpty()) {
            return new ArrayList<>();
        }

        // Get all friends
        List<ShortFriend> friends = currentUser.getFriends().stream()
                .map(userService::getUserByEmail)
                .filter(friend -> friend.getName().toLowerCase().contains(searchQuery.toLowerCase()))
                .map(friend -> new ShortFriend(
                        friend.getUserEmail(),
                        friend.getName(),
                        friend.getProfilePictureUrl()
                ))
                .collect(Collectors.toList());

        return friends;
    }

    @Transactional
    public void updateConversationLastMessage(Long conversationId, String lastMessage, LocalDateTime timestamp) {
        conversationRepository.findById(conversationId).ifPresent(conversation -> {
            conversation.setLastMessage(lastMessage);
            conversation.setLastMessageTime(timestamp);
            conversationRepository.save(conversation);
        });
    }

}