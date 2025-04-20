package com.grapevine.repository;

import com.grapevine.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientEmailAndReadOrderByCreatedAtDesc(String recipientEmail, boolean read);

    List<Notification> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipientEmail = :email")
    void markAllAsRead(@Param("email") String recipientEmail);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.notificationId = :id AND n.recipientEmail = :email")
    void markAsRead(@Param("id") Long notificationId, @Param("email") String recipientEmail);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipientEmail = :userEmail AND n.referenceId = :conversationId AND n.type = 'MESSAGE'")
    void markAsReadByConversationId(Long conversationId, String userEmail);
}