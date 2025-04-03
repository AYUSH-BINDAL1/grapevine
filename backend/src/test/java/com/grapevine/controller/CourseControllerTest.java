package com.grapevine.controller;

import com.grapevine.exception.InvalidSessionException;
import com.grapevine.exception.ResourceNotFoundException;
import com.grapevine.model.Course;
import com.grapevine.model.User;
import com.grapevine.repository.CourseRepository;
import com.grapevine.repository.UserRepository;
import com.grapevine.service.CourseService;
import com.grapevine.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CourseControllerTest {

    @Mock
    private CourseService courseService;

    @Mock
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CourseController courseController;

    private String testSessionId;
    private User testUser;
    private User instructorUser;
    private Course testCourse;
    private CourseRepository.ShortCourse testShortCourse;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        testSessionId = "test-session-id";

        testUser = new User();
        testUser.setUserEmail("test@example.com");
        testUser.setRole(User.Role.STUDENT);

        instructorUser = new User();
        instructorUser.setUserEmail("instructor@example.com");
        instructorUser.setRole(User.Role.INSTRUCTOR);

        testCourse = new Course();
        testCourse.setCourseKey("CS101");
        testCourse.setSubject("CS");
        testCourse.setCourseNumber("101");
        testCourse.setTitle("Introduction to Computer Science");

        testShortCourse = new CourseRepository.ShortCourse() {
            @Override
            public String getCourseKey() {
                return "CS101";
            }

            @Override
            public String getTitle() {
                return "Introduction to Computer Science";
            }
        };
    }

    @Test
    void getAllCourses_Success() {
        // Arrange
        List<Course> courses = Arrays.asList(testCourse);
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(courseService.getAllCourses()).thenReturn(courses);

        // Act
        List<Course> result = courseController.getAllCourses(testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testCourse, result.get(0));
        verify(userService).validateSession(testSessionId);
        verify(courseService).getAllCourses();
    }

    @Test
    void getAllCourses_InvalidSession() {
        // Arrange
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        // Act & Assert
        assertThrows(InvalidSessionException.class, () -> courseController.getAllCourses(testSessionId));
        verify(userService).validateSession(testSessionId);
        verifyNoInteractions(courseService);
    }

    @Test
    void getAllShortCourses_Success() {
        // Arrange
        List<CourseRepository.ShortCourse> shortCourses = Arrays.asList(testShortCourse);
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(courseService.getAllShortCourses()).thenReturn(shortCourses);

        // Act
        List<CourseRepository.ShortCourse> result = courseController.getAllShortCourses(testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("CS101", result.get(0).getCourseKey());
        assertEquals("Introduction to Computer Science", result.get(0).getTitle());
        verify(userService).validateSession(testSessionId);
        verify(courseService).getAllShortCourses();
    }

    @Test
    void getCourse_Success() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(courseService.getCourseByKey("CS101")).thenReturn(Optional.of(testCourse));

        // Act
        ResponseEntity<Course> response = courseController.getCourse("CS101", testSessionId);

        // Assert
        assertEquals(200, response.getStatusCodeValue());
        assertEquals(testCourse, response.getBody());
        verify(userService).validateSession(testSessionId);
        verify(courseService).getCourseByKey("CS101");
    }

    @Test
    void getCourse_NotFound() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(courseService.getCourseByKey("CS999")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () ->
                courseController.getCourse("CS999", testSessionId)
        );
        verify(userService).validateSession(testSessionId);
        verify(courseService).getCourseByKey("CS999");
    }

    @Test
    void getEnrolledStudents_AsInstructor_Success() {
        // Arrange
        List<User> enrolledStudents = Arrays.asList(testUser);
        when(userService.validateSession(testSessionId)).thenReturn(instructorUser);
        when(courseService.getCourseByKey("CS101")).thenReturn(Optional.of(testCourse));
        when(userRepository.findAllByCourses("CS101")).thenReturn(enrolledStudents);

        // Act
        ResponseEntity<List<User>> response = courseController.getEnrolledStudents("CS101", testSessionId);

        // Assert
        assertEquals(200, response.getStatusCodeValue());
        assertEquals(1, response.getBody().size());
        assertEquals(testUser, response.getBody().get(0));
        verify(userService).validateSession(testSessionId);
        verify(courseService).getCourseByKey("CS101");
        verify(userRepository).findAllByCourses("CS101");
    }

    @Test
    void getEnrolledStudents_AsStudent_Forbidden() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser); // Student role

        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
                courseController.getEnrolledStudents("CS101", testSessionId)
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        assertEquals("Only instructors can view their enrolled students", exception.getReason());
        verify(userService).validateSession(testSessionId);
        verifyNoInteractions(userRepository);
    }

    @Test
    void getEnrolledStudents_CourseNotFound() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(instructorUser);
        when(courseService.getCourseByKey("CS999")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () ->
                courseController.getEnrolledStudents("CS999", testSessionId)
        );

        verify(userService).validateSession(testSessionId);
        verify(courseService).getCourseByKey("CS999");
        verifyNoInteractions(userRepository);
    }

    @Test
    void getEnrolledStudents_NoStudentsEnrolled() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(instructorUser);
        when(courseService.getCourseByKey("CS101")).thenReturn(Optional.of(testCourse));
        when(userRepository.findAllByCourses("CS101")).thenReturn(Collections.emptyList());

        // Act
        ResponseEntity<List<User>> response = courseController.getEnrolledStudents("CS101", testSessionId);

        // Assert
        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().isEmpty());
        verify(userService).validateSession(testSessionId);
        verify(courseService).getCourseByKey("CS101");
        verify(userRepository).findAllByCourses("CS101");
    }
}