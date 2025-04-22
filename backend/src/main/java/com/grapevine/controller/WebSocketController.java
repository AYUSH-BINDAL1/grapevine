package com.grapevine.controller;

import com.grapevine.model.Message;
import com.grapevine.service.MessageService;
import com.grapevine.service.NotificationService;
import com.grapevine.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final MessageService messageService;
    private final UserService userService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload Map<String, String> connectRequest,
                        SimpMessageHeaderAccessor headerAccessor) {
        // User is already identified via Principal
        String userEmail = headerAccessor.getUser().getName();

        messagingTemplate.convertAndSendToUser(
                userEmail,
                "/queue/connect",
                Map.of("status", "connected")
        );

    }

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload Map<String, String> messageRequest,
                            SimpMessageHeaderAccessor headerAccessor) {
        // Get user from principal
        String senderEmail = headerAccessor.getUser().getName();

        Long conversationId = Long.parseLong(messageRequest.get("conversationId"));
        String content = messageRequest.get("content");

        // Process and send the message
        Message message = messageService.sendMessage(conversationId, senderEmail, content);
    }

    @MessageMapping("/notification.markRead")
    public void markNotificationAsRead(@Payload Map<String, String> markReadRequest,
                                       SimpMessageHeaderAccessor headerAccessor) {
        String userEmail = headerAccessor.getUser().getName();
        Long notificationId = Long.parseLong(markReadRequest.get("notificationId"));

        notificationService.markAsRead(notificationId, userEmail);
    }
}