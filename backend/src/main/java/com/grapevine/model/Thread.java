package com.grapevine.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "threads")
@Getter
@Setter
@ToString(exclude = "comments")
@NoArgsConstructor
public class Thread {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "thread_id")
    private Long threadId;

    @NotNull
    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Column(name = "author_email", nullable = false)
    private String authorEmail;

    @NotNull
    @Column(name = "author_name", nullable = false)
    private String authorName;

    @CreationTimestamp
    @Column(name = "created_at")
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    @Column(name = "upvotes")
    private Integer upvotes = 0;

    @Column(name = "downvotes")
    private Integer downvotes = 0;

    @ElementCollection
    @CollectionTable(
            name = "thread_votes",
            joinColumns = @JoinColumn(name = "thread_id")
    )
    @MapKeyColumn(name = "user_email")
    @Column(name = "vote")
    private Map<String, Integer> votes = new HashMap<>();

    @JsonManagedReference
    @OneToMany(mappedBy = "thread", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    @Column(name = "major")
    private String major;

    @Column(name = "course")
    private String course;

    @Column(name = "author_role")
    @Enumerated(EnumType.STRING)
    private User.Role authorRole;

    @Column(name = "notifications_enabled")
    private Boolean notificationsEnabled;
}