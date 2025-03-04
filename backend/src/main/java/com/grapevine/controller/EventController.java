package com.grapevine.controller;

import com.grapevine.model.Event;
import com.grapevine.model.ShortEvent;
import com.grapevine.model.User;
import com.grapevine.service.EventService;
import com.grapevine.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class EventController {
    private final EventService eventService;
    private final UserService userService;

    @GetMapping("/all")
    public List<Event> getAllEvents(@RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Return all events in our database
        return eventService.getAllEvents();
    }

    @GetMapping("/all-short")
    public List<ShortEvent> getAllShortEvents(@RequestHeader(name = "Session-Id", required = true) String sessionId) {
        return eventService.getAllShortEvents();
    }

    @GetMapping("/{eventId}")
    public Event getEvent(
            @PathVariable Long eventId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session
        userService.validateSession(sessionId);
        // Return the specific event
        return eventService.getEventById(eventId);
    }
}