package com.grapevine.repository;

import com.grapevine.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, String> {
    interface ShortCourse {
        String getCourseKey();
        String getTitle();
    }

    // Use property projection syntax for all courses
    @Query("SELECT c.courseKey as courseKey, c.title as title FROM Course c ORDER BY c.subject ASC, c.courseNumber ASC")
    List<ShortCourse> findAllShortCourses();

    @Query("SELECT c FROM Course c WHERE LOWER(c.courseKey) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Course> searchCourses(@Param("query") String query);

    // Use property projection syntax
    @Query("SELECT c.courseKey as courseKey, c.title as title FROM Course c WHERE LOWER(c.courseKey) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<ShortCourse> searchShortCourses(@Param("query") String query);
}
