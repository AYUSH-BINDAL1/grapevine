package com.grapevine.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;

@Getter
@Setter
public class EventFilter {
    private String search;
    private Integer minUsers;
    private Integer maxUsers;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long locationId;
    private Boolean includePastEvents;
    private Boolean onlyFullEvents;

    public EventFilter(String search, Integer minUsers, Integer maxUsers,
                       String startTime, String endTime, Long locationId, Boolean includePastEvents, Boolean onlyFullEvents) {
        this.search = search;
        this.minUsers = minUsers;
        this.maxUsers = maxUsers;
        this.locationId = locationId;
        this.includePastEvents = includePastEvents;
        this.onlyFullEvents = onlyFullEvents;

        // Parse date strings if provided
        if (startTime != null && !startTime.isEmpty()) {
            try {
                this.startTime = LocalDateTime.parse(startTime);
            } catch (DateTimeParseException e) {
                throw new IllegalArgumentException("Invalid startTime format. Use ISO format (yyyy-MM-ddTHH:mm:ss)");
            }
        }

        if (endTime != null && !endTime.isEmpty()) {
            try {
                this.endTime = LocalDateTime.parse(endTime);
            } catch (DateTimeParseException e) {
                throw new IllegalArgumentException("Invalid endTime format. Use ISO format (yyyy-MM-ddTHH:mm:ss)");
            }
        }
    }
}