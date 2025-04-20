package com.grapevine.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_reminders")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class EventReminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reminder_id")
    private Long reminderId;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "reminder_time", nullable = false)
    private LocalDateTime reminderTime;

    @Column(name = "sent", nullable = false)
    private boolean sent = false;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}