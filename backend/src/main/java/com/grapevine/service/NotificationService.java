package com.grapevine.service;

import com.grapevine.model.Notification;
import com.grapevine.model.User;
import com.grapevine.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Notification createNotification(String recipientEmail, String senderEmail,
                                           Notification.NotificationType type,
                                           String content, Long referenceId) {

        User sender = userService.getUserByEmail(senderEmail);

        Notification notification = new Notification();
        notification.setRecipientEmail(recipientEmail);
        notification.setSenderEmail(senderEmail);
        notification.setSenderName(sender.getName());
        notification.setType(type);
        notification.setContent(content);
        notification.setReferenceId(referenceId);

        // Always set read to false for new notifications
        // It will only be marked as read when the user explicitly views it
        notification.setRead(false);

        return notificationRepository.save(notification);
    }

    // New method to mark notifications as read when viewing conversation
    @Transactional
    public void markNotificationsReadForConversation(Long conversationId, String userEmail) {
        notificationRepository.markAsReadByConversationId(conversationId, userEmail);
    }

    public List<Notification> getAllNotifications(String userEmail) {
        return notificationRepository.findByRecipientEmailAndReadOrderByCreatedAtDesc(userEmail, false);
    }

    @Transactional
    public void markAllAsRead(String userEmail) {
        notificationRepository.markAllAsRead(userEmail);
    }

    @Transactional
    public void markAsRead(Long notificationId, String userEmail) {
        notificationRepository.markAsRead(notificationId, userEmail);
    }
}