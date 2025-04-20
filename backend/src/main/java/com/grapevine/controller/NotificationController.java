package com.grapevine.controller;

import com.grapevine.model.Notification;
import com.grapevine.model.User;
import com.grapevine.service.NotificationService;
import com.grapevine.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getNotifications(
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);

        List<Notification> notifications = notificationService.getAllNotifications(currentUser.getUserEmail());

        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/mark-read/{notificationId}")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long notificationId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);

        notificationService.markAsRead(notificationId, currentUser.getUserEmail());

        return ResponseEntity.ok().build();
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<?> markAllAsRead(
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);

        notificationService.markAllAsRead(currentUser.getUserEmail());

        return ResponseEntity.ok().build();
    }
}