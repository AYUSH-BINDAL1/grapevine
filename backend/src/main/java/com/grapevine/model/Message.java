package com.grapevine.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    private Long messageId;

    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Column(name = "sender_email", nullable = false)
    private String senderEmail;

    @Column(name = "content", nullable = false, length = 500)
    private String content;

    @Column(name = "seen")
    private boolean seen = false;

    @CreationTimestamp
    @Column(name = "sent_at")
    private LocalDateTime sentAt;
}