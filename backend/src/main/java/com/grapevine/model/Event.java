package com.grapevine.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "events")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Long eventId;

    @NotNull
    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @NotNull
    @Column(name = "max_users", nullable = false)
    private Integer maxUsers;

    @Column(name = "is_public", nullable = false)
    private Boolean isPublic;

    @Column(name = "location_id")
    private Long locationId;

    @Column(name = "event_time")
    private LocalDateTime eventTime;

    @NotNull
    @Column(name = "group_id", nullable = false)
    private Long groupId;

    @ElementCollection
    @Column(name = "host_emails")
    private List<String> hosts;

    @ElementCollection
    @Column(name = "participant_emails")
    private List<String> participants;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}