package com.grapevine.controller;

import com.grapevine.model.*;
import com.grapevine.service.ConversationService;
import com.grapevine.service.MessageService;
import com.grapevine.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final UserService userService;
    private final ConversationService conversationService;
    private final MessageService messageService;

    @GetMapping("/search-friends")
    public ResponseEntity<?> searchFriends(
            @RequestParam String query,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);

        // Search friends
        List<ShortFriend> friends = conversationService.searchFriends(currentUser.getUserEmail(), query);

        return ResponseEntity.ok(friends);
    }

    @PostMapping("/create/{friendEmail}")
    public ResponseEntity<?> createConversation(
            @PathVariable String friendEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);

        try {
            Conversation conversation = conversationService.getOrCreateConversation(
                    currentUser.getUserEmail(), friendEmail);

            // Get messages
            List<Message> messages =
                    messageService.getConversationMessages(conversation.getConversationId(), currentUser.getUserEmail());

            // Prepare response
            Map<String, Object> response = Map.of(
                    "conversation", conversation,
                    "messages", messages
            );

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserConversations(
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);

        // Get user conversations
        List<ConversationPreview> conversations =
                conversationService.getUserConversations(currentUser.getUserEmail());

        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<?> getConversation(
            @PathVariable Long conversationId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);

        try {
            // Get conversation
            Conversation conversation =
                    conversationService.getConversationById(conversationId, currentUser.getUserEmail());

            // Get messages
            List<Message> messages =
                    messageService.getConversationMessages(conversationId, currentUser.getUserEmail());

            // Prepare response
            Map<String, Object> response = Map.of(
                    "conversation", conversation,
                    "messages", messages
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Conversation not found or you don't have access");
        }
    }

}