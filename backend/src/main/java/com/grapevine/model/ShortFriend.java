package com.grapevine.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@AllArgsConstructor
public class ShortFriend {
    private String userEmail;
    private String name;
    private String profilePicUrl;
}