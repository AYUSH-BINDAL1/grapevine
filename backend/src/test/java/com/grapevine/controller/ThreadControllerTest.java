package com.grapevine.controller;

import com.grapevine.exception.InvalidSessionException;
import com.grapevine.exception.ResourceNotFoundException;
import com.grapevine.model.Comment;
import com.grapevine.model.Thread;
import com.grapevine.model.User;
import com.grapevine.service.NotificationService;
import com.grapevine.service.ThreadService;
import com.grapevine.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ThreadControllerTest {

    @Mock
    private ThreadService threadService;

    @Mock
    private UserService userService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ThreadController threadController;

    private String testSessionId;
    private User testUser;
    private User otherUser;
    private Thread testThread;
    private Comment testComment;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        testSessionId = "test-session-id";

        testUser = new User();
        testUser.setUserEmail("test@example.com");
        testUser.setName("Test User");
        testUser.setRole(User.Role.STUDENT);

        otherUser = new User();
        otherUser.setUserEmail("other@example.com");
        otherUser.setName("Other User");
        otherUser.setRole(User.Role.STUDENT);

        testThread = new Thread();
        testThread.setThreadId(1L);
        testThread.setTitle("Test Thread");
        testThread.setDescription("Test Description");
        testThread.setAuthorEmail("test@example.com");
        testThread.setAuthorName("Test User");
        testThread.setCreatedAt(ZonedDateTime.now());
        testThread.setUpvotes(0);
        testThread.setDownvotes(0);
        testThread.setVotes(Collections.emptyMap());
        testThread.setComments(Collections.emptyList());
        testThread.setNotificationsEnabled(true);

        testComment = new Comment();
        testComment.setCommentId(1L);
        testComment.setContent("Test comment");
        testComment.setAuthorEmail("other@example.com");
        testComment.setAuthorName("Other User");
    }

    @Test
    void getAllThreads_Success() {
        // Arrange
        List<Thread> threads = Arrays.asList(testThread);
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(threadService.getAllThreads()).thenReturn(threads);

        // Act
        List<Thread> result = (List<Thread>) threadController.getAllThreads(testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testThread, result.get(0));
        verify(userService).validateSession(testSessionId);
        verify(threadService).getAllThreads();
    }

    @Test
    void getAllThreads_InvalidSession() {
        // Arrange
        when(userService.validateSession(testSessionId))
                .thenThrow(new InvalidSessionException("Invalid session"));

        // Act & Assert
        assertThrows(InvalidSessionException.class, () -> threadController.getAllThreads(testSessionId));
        verify(userService).validateSession(testSessionId);
        verifyNoInteractions(threadService);
    }

    @Test
    void getThreadById_Success() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(threadService.getThreadById(1L)).thenReturn(testThread);

        // Act
        ResponseEntity<Thread> response = threadController.getThreadById(1L, testSessionId);

        // Assert
        assertEquals(200, response.getStatusCodeValue());
        assertEquals(testThread, response.getBody());
        verify(userService).validateSession(testSessionId);
        verify(threadService).getThreadById(1L);
    }

    @Test
    void getThreadById_NotFound() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(threadService.getThreadById(999L)).thenThrow(new IllegalArgumentException("Thread not found"));

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () ->
                threadController.getThreadById(999L, testSessionId)
        );
        verify(userService).validateSession(testSessionId);
        verify(threadService).getThreadById(999L);
    }

    @Test
    void createThread_Success() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(threadService.createThread(any(Thread.class))).thenReturn(testThread);

        // Act
        ResponseEntity<Thread> response = threadController.createThread(testThread, testSessionId);

        // Assert
        assertEquals(201, response.getStatusCodeValue());
        assertEquals(testThread, response.getBody());
        verify(userService).validateSession(testSessionId);
        verify(threadService).createThread(any(Thread.class));
    }

    @Test
    void addComment_Success_WithNotifications() {
        // Arrange
        testThread.setNotificationsEnabled(true);
        when(userService.validateSession(testSessionId)).thenReturn(otherUser);
        when(threadService.addComment(eq(1L), any(Comment.class))).thenReturn(testThread);

        // Act
        ResponseEntity<Thread> response = threadController.addComment(1L, testComment, testSessionId);

        // Assert
        assertEquals(200, response.getStatusCodeValue());
        assertEquals(testThread, response.getBody());
        verify(userService).validateSession(testSessionId);
        verify(threadService).addComment(eq(1L), any(Comment.class));
    }

    @Test
    void addComment_Success_WithoutNotifications() {
        // Arrange
        testThread.setNotificationsEnabled(false);
        when(userService.validateSession(testSessionId)).thenReturn(otherUser);
        when(threadService.addComment(eq(1L), any(Comment.class))).thenReturn(testThread);

        // Act
        ResponseEntity<Thread> response = threadController.addComment(1L, testComment, testSessionId);

        // Assert
        assertEquals(200, response.getStatusCodeValue());
        assertEquals(testThread, response.getBody());
        verify(userService).validateSession(testSessionId);
        verify(threadService).addComment(eq(1L), any(Comment.class));
    }

    @Test
    void updateThread_Success() {
        // Arrange
        Thread updatedThread = new Thread();
        updatedThread.setThreadId(1L);
        updatedThread.setTitle("Updated Title");
        updatedThread.setDescription("Updated Description");
        updatedThread.setAuthorEmail("test@example.com");
        updatedThread.setNotificationsEnabled(false);

        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(threadService.getThreadById(1L)).thenReturn(testThread);
        when(threadService.updateThread(eq(1L), any(Thread.class))).thenReturn(updatedThread);

        // Act
        ResponseEntity<Thread> response = threadController.updateThread(1L, updatedThread, testSessionId);

        // Assert
        assertEquals(200, response.getStatusCodeValue());
        assertEquals(updatedThread, response.getBody());
        verify(userService).validateSession(testSessionId);
        verify(threadService).getThreadById(1L);
        verify(threadService).updateThread(eq(1L), any(Thread.class));
    }

    @Test
    void updateThread_NotAuthor() {
        // Arrange
        Thread updatedThread = new Thread();
        updatedThread.setThreadId(1L);
        updatedThread.setTitle("Updated Title");
        updatedThread.setAuthorEmail("other@example.com");

        when(userService.validateSession(testSessionId)).thenReturn(otherUser);
        when(threadService.getThreadById(1L)).thenReturn(testThread);

        // Act & Assert
        assertThrows(IllegalStateException.class, () ->
                threadController.updateThread(1L, updatedThread, testSessionId)
        );
        verify(userService).validateSession(testSessionId);
        verify(threadService).getThreadById(1L);
        verify(threadService, never()).updateThread(anyLong(), any(Thread.class));
    }

    @Test
    void deleteThread_Success() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(threadService.getThreadById(1L)).thenReturn(testThread);
        doNothing().when(threadService).deleteThread(1L);

        // Act
        ResponseEntity<Void> response = threadController.deleteThread(1L, testSessionId);

        // Assert
        assertEquals(204, response.getStatusCodeValue());
        verify(userService).validateSession(testSessionId);
        verify(threadService).getThreadById(1L);
        verify(threadService).deleteThread(1L);
    }

    @Test
    void deleteThread_NotAuthor() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(otherUser);
        when(threadService.getThreadById(1L)).thenReturn(testThread);

        // Act & Assert
        assertThrows(IllegalStateException.class, () ->
                threadController.deleteThread(1L, testSessionId)
        );
        verify(userService).validateSession(testSessionId);
        verify(threadService).getThreadById(1L);
        verify(threadService, never()).deleteThread(anyLong());
    }

    @Test
    void upvoteThread_Success() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(threadService.upvoteThread(1L, testUser.getUserEmail())).thenReturn(testThread);

        // Act
        ResponseEntity<Thread> response = threadController.upvoteThread(1L, testSessionId);

        // Assert
        assertEquals(200, response.getStatusCodeValue());
        assertEquals(testThread, response.getBody());
        verify(userService).validateSession(testSessionId);
        verify(threadService).upvoteThread(1L, testUser.getUserEmail());
    }

    @Test
    void downvoteThread_Success() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(threadService.downvoteThread(1L, testUser.getUserEmail())).thenReturn(testThread);

        // Act
        ResponseEntity<Thread> response = threadController.downvoteThread(1L, testSessionId);

        // Assert
        assertEquals(200, response.getStatusCodeValue());
        assertEquals(testThread, response.getBody());
        verify(userService).validateSession(testSessionId);
        verify(threadService).downvoteThread(1L, testUser.getUserEmail());
    }

    @Test
    void searchThreads_Success() {
        // Arrange
        when(userService.validateSession(testSessionId)).thenReturn(testUser);
        when(threadService.searchThreads("CS", "101", User.Role.INSTRUCTOR)).thenReturn(Arrays.asList(testThread));

        // Act
        ResponseEntity<List<Thread>> response = threadController.searchThreads(
                "CS", "101", User.Role.INSTRUCTOR, testSessionId);

        // Assert
        assertEquals(200, response.getStatusCodeValue());
        assertEquals(1, response.getBody().size());
        assertEquals(testThread, response.getBody().get(0));
        verify(userService).validateSession(testSessionId);
        verify(threadService).searchThreads("CS", "101", User.Role.INSTRUCTOR);
    }
}