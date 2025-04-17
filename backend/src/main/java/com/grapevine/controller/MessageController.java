//TODO: Delete whole class after frontend messaging is implemented
package com.grapevine.controller;

import com.grapevine.exception.InvalidMessageException;
import com.grapevine.model.*;
import com.grapevine.service.ConversationService;
import com.grapevine.service.MessageService;
import com.grapevine.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final UserService userService;
    private final MessageService messageService;

    //Will likely go unused
    @PostMapping("/{conversationId}/send")
    public ResponseEntity<?> sendMessage(
            @PathVariable Long conversationId,
            @RequestBody Map<String, String> request,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);

        String content = request.get("content");

        try {
            // Send message
            Message message = messageService.sendMessage(
                    conversationId,
                    currentUser.getUserEmail(),
                    content
            );

            return ResponseEntity.ok(message);
        } catch (InvalidMessageException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to send message");
        }
    }

}