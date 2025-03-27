package com.grapevine.repository;

import com.grapevine.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, String> {
    interface ShortCourse {
        String getCourseKey();
        String getTitle();
    }

    // all short courses (sorted) query method using a projection
    @Query("SELECT c.courseKey as courseKey, c.title as title FROM Course c ORDER BY c.subject ASC, c.courseNumber ASC")
    List<ShortCourse> findAllShortCourses();

    // single course projection
    @Query("SELECT c.courseKey as courseKey, c.title as title FROM Course c WHERE c.courseKey = :courseKey")
    Optional<ShortCourse> findShortCourseByCourseKey(String courseKey);
}