package com.grapevine.service;

import com.grapevine.exception.InvalidMessageException;
import com.grapevine.model.Conversation;
import com.grapevine.model.Message;
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

        // Create and save the message
        Message message = new Message();
        message.setConversationId(conversationId);
        message.setSenderEmail(senderEmail);
        message.setContent(content);
        message.setSeen(false);

        Message savedMessage = messageRepository.save(message);

        // Update the conversation's messageIds list
        conversation.getMessageIds().add(savedMessage.getMessageId());

        // Update the conversation's last message info
        conversationService.updateConversationLastMessage(
                conversationId, content, LocalDateTime.now());

        // Send WebSocket message to recipient
        String recipientEmail = conversation.getParticipantEmails().stream()
                .filter(email -> !email.equals(senderEmail))
                .findFirst()
                .orElse(null);

        if (recipientEmail != null) {
            messagingTemplate.convertAndSendToUser(
                    recipientEmail,
                    "/queue/messages",
                    savedMessage
            );
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