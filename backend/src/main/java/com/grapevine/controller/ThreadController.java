package com.grapevine.controller;

import com.grapevine.model.Comment;
import com.grapevine.model.Thread;
import com.grapevine.model.User;
import com.grapevine.service.ThreadService;
import com.grapevine.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/threads")
public class ThreadController {

    private final ThreadService threadService;
    private final UserService userService;

    @Autowired
    public ThreadController(ThreadService threadService, UserService userService) {
        this.threadService = threadService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<Thread>> getAllThreads(
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session
        userService.validateSession(sessionId);
        return ResponseEntity.ok(threadService.getAllThreads());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Thread> getThreadById(
            @PathVariable Long id,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session
        userService.validateSession(sessionId);
        return ResponseEntity.ok(threadService.getThreadById(id));
    }

    @GetMapping("/author/{email}")
    public ResponseEntity<List<Thread>> getThreadsByAuthor(
            @PathVariable String email,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session
        userService.validateSession(sessionId);
        return ResponseEntity.ok(threadService.getThreadsByAuthor(email));
    }

    @PostMapping
    public ResponseEntity<Thread> createThread(
            @RequestBody Thread thread,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session and ensure the user can only create threads as themselves
        User currentUser = userService.validateSession(sessionId);

        if (!currentUser.getUserEmail().equals(thread.getAuthorEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only create threads using your own account");
        }

        // Set the author name and role from the validated user
        thread.setAuthorName(currentUser.getName());
        thread.setAuthorRole(currentUser.getRole());
        thread.setCreatedAt(ZonedDateTime.now(ZoneId.of("US/Eastern")));
        thread.setUpdatedAt(ZonedDateTime.now(ZoneId.of("US/Eastern")));

        Thread createdThread = threadService.createThread(thread);
        return new ResponseEntity<>(createdThread, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Thread> updateThread( // NOT implemented
            @PathVariable Long id,
            @RequestBody Thread thread,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session and ensure the user can only update their own threads
        User currentUser = userService.validateSession(sessionId);
        Thread existingThread = threadService.getThreadById(id);

        if (!existingThread.getAuthorEmail().equals(currentUser.getUserEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only update your own threads");
        }

        return ResponseEntity.ok(threadService.updateThread(id, thread));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteThread(
            @PathVariable Long id,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session and ensure the user can only delete their own threads
        User currentUser = userService.validateSession(sessionId);
        Thread existingThread = threadService.getThreadById(id);

        if (!existingThread.getAuthorEmail().equals(currentUser.getUserEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only delete your own threads");
        }

        threadService.deleteThread(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{threadId}/comments")
    public ResponseEntity<Thread> addComment( // NOT FINISHED
            @PathVariable Long threadId,
            @RequestBody Comment comment,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session and ensure the user can only comment as themselves
        User currentUser = userService.validateSession(sessionId);

        if (!currentUser.getUserEmail().equals(comment.getAuthorEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only add comments using your own account");
        }

        // Set the author name from the validated user
        comment.setAuthorName(currentUser.getName());

        return ResponseEntity.ok(threadService.addComment(threadId, comment));
    }

    @PostMapping("/{id}/upvote")
    public ResponseEntity<Thread> upvoteThread(
            @PathVariable Long id,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session
        User currentUser = userService.validateSession(sessionId);
        return ResponseEntity.ok(threadService.upvoteThread(id, currentUser.getUserEmail()));
    }

    @PostMapping("/{id}/downvote")
    public ResponseEntity<Thread> downvoteThread(
            @PathVariable Long id,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session
        User currentUser = userService.validateSession(sessionId);
        return ResponseEntity.ok(threadService.downvoteThread(id, currentUser.getUserEmail()));
    }

    @GetMapping("/{id}/vote")
    public ResponseEntity<Map<String, Integer>> getUserVote(
            @PathVariable Long id,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session
        User currentUser = userService.validateSession(sessionId);
        Integer vote = threadService.getUserVote(id, currentUser.getUserEmail());
        return ResponseEntity.ok(Map.of("vote", vote));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Thread>> searchThreads(
            @RequestParam(required = false) String major,
            @RequestParam(required = false) String course,
            @RequestParam(required = false) User.Role authorRole,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session
        userService.validateSession(sessionId);

        // Convert empty strings to null for proper query handling
        major = (major != null && major.isEmpty()) ? null : major;
        course = (course != null && course.isEmpty()) ? null : course;

        List<Thread> threads = threadService.searchThreads(major, course, authorRole);
        return ResponseEntity.ok(threads);
    }


}