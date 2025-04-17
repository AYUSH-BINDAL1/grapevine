package com.grapevine.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

@Getter
@Setter
@ToString
@AllArgsConstructor
public class ConversationPreview {
    private Long conversationId;
    private String friendEmail;
    private String friendName;
    private String friendProfilePicUrl;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private boolean unread;
}