package com.grapevine.controller;

import com.grapevine.exception.ResourceNotFoundException;
import com.grapevine.model.Course;
import com.grapevine.model.User;
import com.grapevine.repository.CourseRepository;
import com.grapevine.service.CourseService;
import com.grapevine.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CourseController {
    private final CourseService courseService;
    private final UserService userService;

    @GetMapping("/all")
    public List<Course> getAllCourses(@RequestHeader(name = "Session-Id", required = true) String sessionId) {
        userService.validateSession(sessionId);

        return courseService.getAllCourses();
    }

    @GetMapping("/short")
    public List<CourseRepository.ShortCourse> getAllShortCourses(@RequestHeader(name = "Session-Id", required = true) String sessionId) {
        userService.validateSession(sessionId);

        return courseService.getAllShortCourses();
    }

    @GetMapping("/{courseKey}")
    public ResponseEntity<Course> getCourse(
            @PathVariable String courseKey,
            @RequestHeader(name = "Session-Id", required = true) String sessionId
    ) {
        userService.validateSession(sessionId);

        return courseService.getCourseByKey(courseKey)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with key: " + courseKey));
    }

    @GetMapping("/short/{courseKey}")
    public ResponseEntity<CourseRepository.ShortCourse> getShortCourse(
            @PathVariable String courseKey,
            @RequestHeader(name = "Session-Id", required = true) String sessionId
    ) {
        userService.validateSession(sessionId);

        return courseService.getShortCourse(courseKey)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with key: " + courseKey));
    }

    @GetMapping("/search")
    public List<Course> searchCourses(
            @RequestParam String query,
            @RequestHeader(name = "Session-Id", required = true) String sessionId
    ) {
        // Validate session and check if user is an instructor
        User currentUser = userService.validateSession(sessionId);
        if (currentUser.getRole() != User.Role.INSTRUCTOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only instructors can search courses");
        }

        return courseService.searchCoursesByRegex(query);
    }

    @GetMapping("/search/short")
    public List<CourseRepository.ShortCourse> searchShortCourses(
            @RequestParam String query,
            @RequestHeader(name = "Session-Id", required = true) String sessionId
    ) {
        // Validate session and check if user is an instructor
        User currentUser = userService.validateSession(sessionId);
        if (currentUser.getRole() != User.Role.INSTRUCTOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only instructors can search courses");
        }

        return courseService.searchShortCoursesByRegex(query);
    }
}