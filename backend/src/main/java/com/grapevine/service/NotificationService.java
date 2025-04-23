package com.grapevine.service;

import com.grapevine.model.Notification;
import com.grapevine.model.User;
import com.grapevine.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

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

        // For system notifications (like reminders), we use a special indicator
        String senderName = "SYSTEM";
        if ("N/A".equals(senderEmail)) {
            senderName = "SYSTEM";
        } else {
            User sender = userService.getUserByEmail(senderEmail);
            senderName = sender.getName();
        }

        Notification notification = new Notification();
        notification.setRecipientEmail(recipientEmail);
        notification.setSenderEmail(senderEmail);
        notification.setSenderName(senderName);
        notification.setType(type);
        notification.setContent(content);
        notification.setReferenceId(referenceId);
        notification.setRead(false);

        return notificationRepository.save(notification);
    }

    // Method to send notification via WebSocket
    public void sendNotificationToUser(Notification notification) {
        messagingTemplate.convertAndSendToUser(
                notification.getRecipientEmail(),
                "/queue/notifications",
                Map.of(
                        "notificationId", notification.getNotificationId(),
                        "type", notification.getType(),
                        "content", notification.getContent(),
                        "senderName", notification.getSenderName(),
                            "senderEmail", notification.getSenderEmail(),
                        "referenceId", notification.getReferenceId(),
                        "createdAt", notification.getCreatedAt()
                )
        );
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

    @Transactional
    public void createAndSendThreadCommentNotification(String recipientEmail, String commenterEmail,
                                                       String threadTitle, Long threadId) {
        // Create notification in database
        Notification notification = createNotification(
                recipientEmail,
                commenterEmail,
                Notification.NotificationType.MESSAGE,
                "New comment on your thread: " + threadTitle,
                threadId
        );

        // Send real-time notification via WebSocket
        sendNotificationToUser(notification);
    }
}