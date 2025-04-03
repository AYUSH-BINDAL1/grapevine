package com.grapevine.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@AllArgsConstructor
public class ShortEvent {
    private Long eventId;
    private String name;
    private Long locationId;
}