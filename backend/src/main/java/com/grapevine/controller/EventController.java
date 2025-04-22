package com.grapevine.controller;

import com.grapevine.exception.GroupNotFoundException;
import com.grapevine.model.*;
import com.grapevine.service.EventReminderService;
import com.grapevine.service.EventService;
import com.grapevine.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class EventController {
    private final EventService eventService;
    private final UserService userService;
    private final EventReminderService eventReminderService;

    @GetMapping("/all")
    public List<Event> getAllEvents(@RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Return all events in our database
        return eventService.getAllEvents();
    }

    @GetMapping("/all-short")
    public List<ShortEvent> getAllShortEvents(
            @RequestHeader(name = "Session-Id", required = true) String sessionId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer minUsers,
            @RequestParam(required = false) Integer maxUsers,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) Boolean isPublic,
            @RequestParam(required = false) Boolean includePastEvents,
            @RequestParam(required = false) Boolean onlyFullEvents) {

        userService.validateSession(sessionId);

        EventFilter filter = new EventFilter(
                search, minUsers, maxUsers, startTime, endTime,
                locationId, includePastEvents, onlyFullEvents);

        return eventService.getAllShortEvents(filter);
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

    @PostMapping("/create/{groupId}")
    public Event createEvent(
            @PathVariable Long groupId,
            @RequestBody Event event,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session and get current user
        User currentUser = userService.validateSession(sessionId);
        return eventService.createEvent(event, groupId, currentUser);

    }

    @PutMapping("/{eventId}")
    public Event updateEvent(
            @PathVariable Long eventId,
            @RequestBody Event updatedEvent,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session and get current user
        User currentUser = userService.validateSession(sessionId);
        return eventService.updateEvent(eventId, updatedEvent, currentUser);
    }

    @DeleteMapping("/{eventId}")
    public void deleteEvent(
            @PathVariable Long eventId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session and get current user
        User currentUser = userService.validateSession(sessionId);
        eventService.deleteEvent(eventId, currentUser);
    }

    @PostMapping("/{eventId}/join")
    public ResponseEntity<?> joinEvent(
            @PathVariable Long eventId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session
        User currentUser = userService.validateSession(sessionId);

        try {
            // Attempt to join the event
            Event updatedEvent = eventService.joinEvent(eventId, currentUser);
            return ResponseEntity.ok(updatedEvent);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/{eventId}/reminders")
    public ResponseEntity<?> createReminder(
            @PathVariable Long eventId,
            @RequestBody Map<String, Long> request,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);
        Long minutesBefore = request.get("minutesBefore");

        try {
            EventReminder reminder = eventReminderService.createReminder(
                    eventId, currentUser.getUserEmail(), minutesBefore);
            return ResponseEntity.ok(reminder);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/{eventId}/reminders")
    public ResponseEntity<?> getReminders(
            @PathVariable Long eventId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);

        try {
            List<EventReminder> reminders = eventReminderService.getRemindersForEvent(
                    eventId, currentUser.getUserEmail());
            return ResponseEntity.ok(reminders);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/reminders/{reminderId}")
    public ResponseEntity<?> deleteReminder(
            @PathVariable Long reminderId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);

        try {
            eventReminderService.deleteReminder(reminderId, currentUser.getUserEmail());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}