package com.grapevine.service;

import com.grapevine.model.Comment;
import com.grapevine.model.Thread;
import com.grapevine.repository.ThreadRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ThreadServiceTest {

    @Mock
    private ThreadRepository threadRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private ThreadService threadService;

    private Thread testThread;
    private Comment testComment;

    // In ThreadServiceTest.setUp()
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        testThread = new Thread();
        testThread.setThreadId(1L);
        testThread.setTitle("Test Thread");
        testThread.setDescription("Test Description");
        testThread.setAuthorEmail("test@example.com");
        testThread.setAuthorName("Test User");
        testThread.setCreatedAt(ZonedDateTime.now());
        testThread.setUpvotes(0);
        testThread.setDownvotes(0);
        testThread.setVotes(new HashMap<>()); // Use mutable map
        testThread.setComments(new ArrayList<>()); // Use mutable list
        testThread.setNotificationsEnabled(true);

        testComment = new Comment();
        testComment.setCommentId(1L);
        testComment.setContent("Test comment");
        testComment.setAuthorEmail("other@example.com");
        testComment.setAuthorName("Other User");
    }

    // STORY 13 (sprint 3) (zhao)
    @Test
    void addComment_SendsNotification_WhenAuthorIsNotCommenter() {
        // Arrange
        when(threadRepository.findById(1L)).thenReturn(java.util.Optional.of(testThread));
        when(threadRepository.save(any(Thread.class))).thenReturn(testThread);

        // Act
        Thread result = threadService.addComment(1L, testComment);

        // Assert
        verify(notificationService).createAndSendThreadCommentNotification(
                "test@example.com",
                "other@example.com",
                "Test Thread",
                1L
        );
        assertNotNull(result);
        assertTrue(result.getComments().contains(testComment));
    }

    @Test
    void addComment_DoesNotSendNotification_WhenAuthorIsCommenter() {
        // Arrange
        testComment.setAuthorEmail("test@example.com"); // Same as thread author
        when(threadRepository.findById(1L)).thenReturn(java.util.Optional.of(testThread));
        when(threadRepository.save(any(Thread.class))).thenReturn(testThread);

        // Act
        Thread result = threadService.addComment(1L, testComment);

        // Assert
        verify(notificationService, never()).createAndSendThreadCommentNotification(
                anyString(), anyString(), anyString(), anyLong()
        );
        assertNotNull(result);
        assertTrue(result.getComments().contains(testComment));
    }

    @Test
    void addComment_DoesNotSendNotification_WhenNotificationsDisabled() {
        // Arrange
        testThread.setNotificationsEnabled(false);
        when(threadRepository.findById(1L)).thenReturn(java.util.Optional.of(testThread));
        when(threadRepository.save(any(Thread.class))).thenReturn(testThread);

        // Act
        Thread result = threadService.addComment(1L, testComment);

        // Assert
        verify(notificationService, never()).createAndSendThreadCommentNotification(
                anyString(), anyString(), anyString(), anyLong()
        );
        assertNotNull(result);
        assertTrue(result.getComments().contains(testComment));
    }
}