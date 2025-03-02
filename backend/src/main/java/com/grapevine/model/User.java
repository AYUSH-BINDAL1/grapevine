package com.grapevine.model;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
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
    @NotNull
    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @NotNull
    @Column(name = "password", nullable = false)
    private String password;

    @NotNull
    @Column(name = "name", nullable = false)
    private String name;

    @NotNull
    @Column(name = "birthday", nullable = false)
    private LocalDate birthday;

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

    @ElementCollection
    @Column(name = "hosted_group_ids")
    private List<Long> hostedGroups;

    @ElementCollection
    @Column(name = "joined_group_ids")
    private List <Long> joinedGroups;

    //@ElementCollection
    //@Column(name = "friend_emails")
    //private List<String> friends;

    //@ElementCollection
    //@Column(name = "instructor_emails")
    //private List<String> instructors;

    //Additional Attributes: Account Creation Date, Last Online Date, Profile Picture
}