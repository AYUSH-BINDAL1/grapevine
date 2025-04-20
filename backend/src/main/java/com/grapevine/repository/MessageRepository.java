package com.grapevine.repository;

import com.grapevine.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversationIdOrderBySentAtAsc(Long conversationId);

    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.seen = true WHERE m.conversationId = :conversationId AND m.senderEmail <> :viewerEmail AND m.seen = false")
    void markMessagesAsSeen(@Param("conversationId") Long conversationId, @Param("viewerEmail") String viewerEmail);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversationId = :conversationId AND m.senderEmail != :userEmail AND m.seen = false")
    int countUnreadMessages(@Param("conversationId") Long conversationId, @Param("userEmail") String userEmail);

    int countByConversationIdAndSenderEmailNotAndSeenFalse(Long conversationId, String userEmail);
}