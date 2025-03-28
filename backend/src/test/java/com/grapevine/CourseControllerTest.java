package com.grapevine;

import com.grapevine.controller.CourseController;
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
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@SpringBootTest
public class CourseControllerTest {

    @Mock
    private CourseService courseService;

    @Mock
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CourseController courseController;

    private User testUser;
    private Course testCourse;
    private CourseRepository.ShortCourse testShortCourse;
    private String testSessionId = "test-session-id";

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setUserEmail("test@example.com");
        testUser.setName("Test User");
        testUser.setRole(User.Role.STUDENT);

        testCourse = new Course();
        testCourse.setCourseKey("CS50100");
        testCourse.setSubject("CS");
        testCourse.setCourseNumber("50100");
        testCourse.setTitle("Introduction to Programming");

        testShortCourse = new CourseRepository.ShortCourse() {
            @Override
            public String getCourseKey() {
                return "CS50100";
            }

            @Override
            public String getTitle() {
                return "Introduction to Programming";
            }
        };
    }

    @Test
    void testGetAllCourses_Success() {
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(courseService.getAllCourses()).thenReturn(List.of(testCourse));

        List<Course> result = courseController.getAllCourses(testSessionId);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("CS50100", result.get(0).getCourseKey());
        verify(userService).validateSession(testSessionId);
        verify(courseService).getAllCourses();
    }

    @Test
    void testGetAllCourses_InvalidSession() {
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        assertThrows(InvalidSessionException.class,
                () -> courseController.getAllCourses(testSessionId));
    }

    @Test
    void testGetAllShortCourses_Success() {
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(courseService.getAllShortCourses()).thenReturn(List.of(testShortCourse));

        List<CourseRepository.ShortCourse> result = courseController.getAllShortCourses(testSessionId);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("CS50100", result.get(0).getCourseKey());
        assertEquals("Introduction to Programming", result.get(0).getTitle());
        verify(userService).validateSession(testSessionId);
        verify(courseService).getAllShortCourses();
    }

    @Test
    void testGetAllShortCourses_InvalidSession() {
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        assertThrows(InvalidSessionException.class,
                () -> courseController.getAllShortCourses(testSessionId));
    }

    @Test
    void testGetCourse_Success() {
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(courseService.getCourseByKey("CS50100")).thenReturn(Optional.of(testCourse));

        ResponseEntity<Course> response = courseController.getCourse("CS50100", testSessionId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("CS50100", response.getBody().getCourseKey());
        verify(userService).validateSession(testSessionId);
        verify(courseService).getCourseByKey("CS50100");
    }

    @Test
    void testGetCourse_NotFound() {
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(courseService.getCourseByKey("NOTFOUND")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> courseController.getCourse("NOTFOUND", testSessionId));
    }

    @Test
    void testGetCourse_InvalidSession() {
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        assertThrows(InvalidSessionException.class,
                () -> courseController.getCourse("CS50100", testSessionId));
    }

    @Test
    void testGetShortCourse_Success() {
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(courseService.getShortCourse("CS50100")).thenReturn(Optional.of(testShortCourse));

        ResponseEntity<CourseRepository.ShortCourse> response = courseController.getShortCourse("CS50100", testSessionId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("CS50100", response.getBody().getCourseKey());
        assertEquals("Introduction to Programming", response.getBody().getTitle());
        verify(userService).validateSession(testSessionId);
        verify(courseService).getShortCourse("CS50100");
    }

    @Test
    void testGetShortCourse_NotFound() {
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(courseService.getShortCourse("NOTFOUND")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> courseController.getShortCourse("NOTFOUND", testSessionId));
    }

    @Test
    void testGetShortCourse_InvalidSession() {
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        assertThrows(InvalidSessionException.class,
                () -> courseController.getShortCourse("CS50100", testSessionId));
    }

    @Test
    void testSearchCourses_Success() {
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(courseService.searchCoursesByRegex("CS")).thenReturn(List.of(testCourse));

        List<Course> result = courseController.searchCourses("CS", testSessionId);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("CS50100", result.get(0).getCourseKey());
        verify(userService).validateSession(testSessionId);
        verify(courseService).searchCoursesByRegex("CS");
    }

    @Test
    void testSearchCourses_InvalidSession() {
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        assertThrows(InvalidSessionException.class,
                () -> courseController.searchCourses("CS", testSessionId));
    }

    @Test
    void testSearchShortCourses_Success() {
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(courseService.searchShortCoursesByRegex("CS")).thenReturn(List.of(testShortCourse));

        List<CourseRepository.ShortCourse> result = courseController.searchShortCourses("CS", testSessionId);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("CS50100", result.get(0).getCourseKey());
        assertEquals("Introduction to Programming", result.get(0).getTitle());
        verify(userService).validateSession(testSessionId);
        verify(courseService).searchShortCoursesByRegex("CS");
    }

    @Test
    void testSearchShortCourses_InvalidSession() {
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        assertThrows(InvalidSessionException.class,
                () -> courseController.searchShortCourses("CS", testSessionId));
    }

    @Test
    void testGetEnrolledStudents_AsInstructor_Success() {
        User instructorUser = new User();
        instructorUser.setUserEmail("instructor@example.com");
        instructorUser.setRole(User.Role.INSTRUCTOR);

        User student1 = new User();
        student1.setUserEmail("student1@example.com");
        student1.setRole(User.Role.STUDENT);

        User student2 = new User();
        student2.setUserEmail("student2@example.com");
        student2.setRole(User.Role.STUDENT);

        when(userService.validateSession(testSessionId)).thenReturn(instructorUser);
        when(courseService.getCourseByKey("CS50100")).thenReturn(Optional.of(testCourse));
        when(userRepository.findAllByCourses("CS50100")).thenReturn(Arrays.asList(student1, student2));

        ResponseEntity<List<User>> response = courseController.getEnrolledStudents("CS50100", testSessionId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());
        assertEquals("student1@example.com", response.getBody().get(0).getUserEmail());
        assertEquals("student2@example.com", response.getBody().get(1).getUserEmail());
        verify(userService).validateSession(testSessionId);
        verify(courseService).getCourseByKey("CS50100");
        verify(userRepository).findAllByCourses("CS50100");
    }

    @Test
    void testGetEnrolledStudents_AsStudent_Forbidden() {
        when(userService.validateSession(testSessionId)).thenReturn(testUser); // testUser is a STUDENT

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> courseController.getEnrolledStudents("CS50100", testSessionId));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        assertEquals("Only instructors can view enrolled students", exception.getReason());
    }

    @Test
    void testGetEnrolledStudents_CourseNotFound() {
        User instructorUser = new User();
        instructorUser.setUserEmail("instructor@example.com");
        instructorUser.setRole(User.Role.INSTRUCTOR);

        when(userService.validateSession(testSessionId)).thenReturn(instructorUser);
        when(courseService.getCourseByKey("NOTFOUND")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> courseController.getEnrolledStudents("NOTFOUND", testSessionId));
    }

    @Test
    void testGetEnrolledStudents_InvalidSession() {
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        assertThrows(InvalidSessionException.class,
                () -> courseController.getEnrolledStudents("CS50100", testSessionId));
    }
}