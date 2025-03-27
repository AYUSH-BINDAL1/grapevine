package com.grapevine.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import java.util.List;

@Entity
@Table(name = "courses")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Course {

    @Id
    @Column(name = "course_key", nullable = false)
    private String courseKey; // concatenated subject + courseNumber (e.g. AAE20000)

    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "subject_desc")
    private String subjectDesc;

    @Column(name = "course_number", nullable = false)
    private String courseNumber;

    @Column(name = "title")
    private String title;

    /*
     the following not used since course registration isn't a feature
     but it's included just to keep csv reading consistent
     */

    @Column(name = "academic_period")
    private String academicPeriod;

    @ElementCollection
    @CollectionTable(name = "crn_courses", joinColumns = @JoinColumn(name = "course_key"))
    @Column(name = "crn")
    private List<String> crns;
}