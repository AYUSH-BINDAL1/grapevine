package com.grapevine.service;

import com.grapevine.exception.InvalidMessageException;
import com.grapevine.model.Conversation;
import com.grapevine.model.Message;
import com.grapevine.model.Notification;
import com.grapevine.model.User;
import com.grapevine.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationService conversationService;
    private final UserService userService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public List<Message> getConversationMessages(Long conversationId, String userEmail) {
        // Verify conversation exists and user has access
        Conversation conversation = conversationService.getConversationById(conversationId, userEmail);

        // Get all messages for the conversation
        return messageRepository.findByConversationIdOrderBySentAtAsc(conversationId);
    }

    @Transactional
    public Message sendMessage(Long conversationId, String senderEmail, String content) {
        // Validate message content
        if (content == null || content.trim().isEmpty()) {
            throw new InvalidMessageException("Message content cannot be empty");
        }

        if (content.length() > 500) {
            throw new InvalidMessageException("Message content cannot exceed 500 characters");
        }

        // Verify conversation exists and user has access
        Conversation conversation = conversationService.getConversationById(conversationId, senderEmail);

        // Get recipient
        String recipientEmail = conversation.getParticipantEmails().stream()
                .filter(email -> !email.equals(senderEmail))
                .findFirst()
                .orElse(null);

        // Create and save the message
        Message message = new Message();
        message.setConversationId(conversationId);
        message.setSenderEmail(senderEmail);
        message.setContent(content);

        // Default to false (unseen)
        // Only set to true if recipient is confirmed online
        message.setSeen(false);

        // Check if recipient is online
        boolean recipientOnline = recipientEmail != null && userService.isUserOnline(recipientEmail);

        // Only mark as seen if recipient is online
        if (recipientOnline) {
            message.setSeen(true);
        }

        Message savedMessage = messageRepository.save(message);

        // Update the conversation's messageIds list
        conversation.getMessageIds().add(savedMessage.getMessageId());

        // Update the conversation's last message info
        conversationService.updateConversationLastMessage(
                conversationId, content, LocalDateTime.now());

        if (recipientEmail != null) {
            // If recipient is online, send message via WebSocket (no notification in notifications tab)
            if (recipientOnline) {
                messagingTemplate.convertAndSendToUser(
                        recipientEmail,
                        "/queue/messages",
                        savedMessage
                );
            } else {
                // If recipient is offline, create notification (will show in tab when they log in)
                User sender = userService.getUserByEmail(senderEmail);
                String notificationContent = sender.getName() + ": " +
                        (content.length() > 50 ? content.substring(0, 47) + "..." : content);

                notificationService.createNotification(
                        recipientEmail,
                        senderEmail,
                        Notification.NotificationType.MESSAGE,
                        notificationContent,
                        conversationId
                );
            }
        }

        return savedMessage;
    }

    @Transactional
    public Message createFirstMessage(String senderEmail, String receiverEmail, String content) {
        // Validate users are friends
        User sender = userService.getUserByEmail(senderEmail);
        User receiver = userService.getUserByEmail(receiverEmail);

        if (sender.getFriends() == null || !sender.getFriends().contains(receiverEmail)) {
            throw new InvalidMessageException("You can only send messages to friends");
        }

        // Create or get conversation
        Conversation conversation = conversationService.getOrCreateConversation(senderEmail, receiverEmail);

        // Send the message
        return sendMessage(conversation.getConversationId(), senderEmail, content);
    }
}