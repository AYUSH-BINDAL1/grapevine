package com.grapevine.repository;

import com.grapevine.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("SELECT c FROM Conversation c WHERE :userEmail MEMBER OF c.participantEmails ORDER BY c.lastMessageTime DESC")
    List<Conversation> findByParticipantEmailOrderByLastMessageTimeDesc(@Param("userEmail") String userEmail);

    @Query("SELECT c FROM Conversation c WHERE :email1 MEMBER OF c.participantEmails AND :email2 MEMBER OF c.participantEmails")
    Optional<Conversation> findByParticipantEmails(@Param("email1") String email1, @Param("email2") String email2);
}