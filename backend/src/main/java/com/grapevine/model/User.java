package com.grapevine.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class User {

    @Id
    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "birthday", nullable = false)
    private LocalDate birthday;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = true)
    private Role role;

    public enum Role {
        STUDENT,
        UTA,
        GTA,
        PROFESSOR
    }

    @Column(name = "biography")
    private String biography;

    @Column(name = "year")
    private Integer year;

    @ElementCollection
    @Column(name = "majors")
    private List<String> majors;

    @ElementCollection
    @Column(name = "minors")
    private List<String> minors;

    @ElementCollection
    @Column(name = "courses")
    private List<String> courses;

    @ManyToMany
    @JoinTable(name = "user_friends", joinColumns = @JoinColumn(name = "user_email"), inverseJoinColumns =
    @JoinColumn(name = "friend_email"))
    private List<User> friends;

    @ManyToMany
    @JoinTable(name = "user_instructors", joinColumns = @JoinColumn(name = "user_email"), inverseJoinColumns =
    @JoinColumn(name = "instructor_email"))
    private List<User> instructors;

    @ElementCollection
    @Column(name = "times")
    private List<ZonedDateTime> availableTimes;

    @Column(name = "profile_picture")
    private String profilePicturePath;

    @Column(name = "email_confirmed")
    private boolean emailConfirmed = false;

    //Other Fields?: Contact Information, Account Creation Date, Last Online, Privacy Settings

}