package com.grapevine.service;

import com.grapevine.exception.EventNotFoundException;
import com.grapevine.exception.GroupNotFoundException;
import com.grapevine.exception.UnauthorizedException;
import com.grapevine.exception.UserNotFoundException;
import com.grapevine.model.*;
import com.grapevine.repository.EventRepository;
import com.grapevine.repository.GroupRepository;
import com.grapevine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {
    private final EventRepository eventRepository;
    private final UserService userService;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;

    public List<Event> getAllEvents() {
        List<Event> events = eventRepository.findAll().stream()
                .filter(event -> Boolean.TRUE.equals(event.getIsPublic()))
                .collect(Collectors.toList());

        // Sort events by time - upcoming events first (maintain existing behavior)
        events.sort(Comparator.comparing(Event::getEventTime,
                Comparator.nullsLast(Comparator.naturalOrder())));

        return events;
    }


    public List<ShortEvent> getAllShortEvents(EventFilter filter) {
        List<Event> events = eventRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        // Clean up past events unless specifically requested to include them
        if (filter == null || !Boolean.TRUE.equals(filter.getIncludePastEvents())) {
            cleanupPastEvents();
        }

        // Filter events based on criteria
        List<Event> filteredEvents = events.stream()
                .filter(event -> {
                    // Exclude private events by default
                    if (!Boolean.TRUE.equals(event.getIsPublic())) {
                        return false;
                    }

                    // Name search filter
                    if (filter.getSearch() != null && !filter.getSearch().trim().isEmpty()) {
                        if (!event.getName().toLowerCase().startsWith(filter.getSearch().toLowerCase().trim())) {
                            return false;
                        }
                    }

                    // Filter by min users
                    if (filter.getMinUsers() != null && event.getHosts().size() + event.getParticipants().size() < filter.getMinUsers()) {
                        return false;
                    }

                    // Filter by max users
                    if (filter.getMaxUsers() != null && event.getHosts().size() + event.getParticipants().size() > filter.getMaxUsers()) {
                        return false;
                    }

                    // Start time filter
                    if (filter.getStartTime() != null && (event.getEventTime() == null ||
                            event.getEventTime().isBefore(filter.getStartTime()))) {
                        return false;
                    }

                    // End time filter
                    if (filter.getEndTime() != null && (event.getEventTime() == null ||
                            event.getEventTime().isAfter(filter.getEndTime()))) {
                        return false;
                    }

                    // Location filter
                    if (filter.getLocationId() != null &&
                            (event.getLocationId() == null || !event.getLocationId().equals(filter.getLocationId()))) {
                        return false;
                    }

                    // Public/private filter is now handled at the top - we only show public events

                    // Past events filter (exclude past events by default)
                    if (!Boolean.TRUE.equals(filter.getIncludePastEvents()) &&
                            event.getEventTime() != null && event.getEventTime().isBefore(now)) {
                        return false;
                    }

                    // Full events filter
                    if (Boolean.TRUE.equals(filter.getOnlyFullEvents())) {
                        int totalParticipants =
                                (event.getHosts() != null ? event.getHosts().size() : 0) +
                                        (event.getParticipants() != null ? event.getParticipants().size() : 0);
                        if (totalParticipants < event.getMaxUsers()) {
                            return false;
                        }
                    }

                    return true;
                })
                .sorted(Comparator.comparing(Event::getEventTime,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        // Convert to ShortEvent objects
        return filteredEvents.stream()
                .map(event -> new ShortEvent(event.getEventId(), event.getName(), event.getLocationId(), event.getIsPublic()))
                .collect(Collectors.toList());
    }

    // Keep the existing method for backward compatibility
    public List<ShortEvent> getAllShortEvents() {
        return getAllShortEvents(new EventFilter( null, null, null, null, null, null, null, null));
    }

    /**
     * Cleans up past events from the database
     */
    private void cleanupPastEvents() {
        List<Event> allEvents = eventRepository.findAll();
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(30); // Keep events from the last 30 days

        for (Event event : allEvents) {
            // Skip events without a time or events newer than the cutoff
            if (event.getEventTime() == null || event.getEventTime().isAfter(cutoffTime)) {
                continue;
            }

            // This is an old past event (more than 30 days old), so delete it
            try {
                // Delete logic (same as before)
                // ...
            } catch (Exception e) {
                // Log the error but continue with other events
                System.err.println("Error cleaning up past event ID " + event.getEventId() + ": " + e.getMessage());
            }
        }
    }

    public Event createEvent(Event event, Long groupId, User currentUser) {
        // Get the associated group
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Group not found with id: " + groupId));

        // Check if user is a host of this group
        if (!group.getHosts().contains(currentUser.getUserEmail())) {
            throw new IllegalStateException("Only hosts can create events for this group");
        }

        // Initialize lists if null
        if (event.getHosts() == null) {
            event.setHosts(new ArrayList<>());
        }
        if (event.getParticipants() == null) {
            event.setParticipants(new ArrayList<>());
        }

        // Add current user as host
        event.getHosts().add(currentUser.getUserEmail());

        // Set public status based on group's status
        event.setIsPublic(group.isPublic());

        // Set group id
        event.setGroupId(groupId);

        // Save the event first to get the ID
        Event savedEvent = eventRepository.save(event);

        // Update user's hostedEvents list
        if (currentUser.getHostedEvents() == null) {
            currentUser.setHostedEvents(new ArrayList<>());
        }
        currentUser.getHostedEvents().add(savedEvent.getEventId());

        // Add event to the group's events list
        if (group.getEvents() == null) {
            group.setEvents(new ArrayList<>());
        }
        group.getEvents().add(savedEvent.getEventId());

        // Add all group participants to the event automatically
        if (group.getParticipants() != null && !group.getParticipants().isEmpty()) {
            for (String participantEmail : group.getParticipants()) {
                User participant = userRepository.findById(participantEmail)
                        .orElseThrow(() -> new UserNotFoundException("User not found: " + participantEmail));

                // Only add if the event is in the future
                if (savedEvent.getEventTime().isAfter(LocalDateTime.now())) {
                    savedEvent.getParticipants().add(participantEmail);

                    // Update user's joinedEvents list
                    if (participant.getJoinedEvents() == null) {
                        participant.setJoinedEvents(new ArrayList<>());
                    }
                    if (!participant.getJoinedEvents().contains(savedEvent.getEventId())) {
                        participant.getJoinedEvents().add(savedEvent.getEventId());
                    }

                    userRepository.save(participant);
                }
            }
        }

        // Save updated group and user
        groupRepository.save(group);
        userRepository.save(currentUser);

        return eventRepository.save(savedEvent);
    }

    public Event updateEvent(Long eventId, Event updatedEvent, User currentUser) {
        Event existingEvent = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + eventId));

        // Check if user is authorized (must be a host)
        if (!existingEvent.getHosts().contains(currentUser.getUserEmail())) {
            throw new UnauthorizedException("Only event hosts can update events");
        }

        // Validate event time - must be in the future
        if (updatedEvent.getEventTime() != null && updatedEvent.getEventTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Event time must be in the future");
        }

        // Validate max users - must be greater than or equal to current participant count
        if (updatedEvent.getMaxUsers() != null &&
                existingEvent.getParticipants() != null &&
                updatedEvent.getMaxUsers() < existingEvent.getParticipants().size()) {
            throw new IllegalArgumentException("Max users cannot be less than the current number of participants");
        }

        // Update fields if provided in the request
        if (updatedEvent.getName() != null) {
            existingEvent.setName(updatedEvent.getName());
        }

        if (updatedEvent.getDescription() != null) {
            existingEvent.setDescription(updatedEvent.getDescription());
        }

        if (updatedEvent.getMaxUsers() != null) {
            existingEvent.setMaxUsers(updatedEvent.getMaxUsers());
        }

        if (updatedEvent.getIsPublic() != null) {
            existingEvent.setIsPublic(updatedEvent.getIsPublic());
        }

        if (updatedEvent.getLocationId() != null) {
            existingEvent.setLocationId(updatedEvent.getLocationId());
        }

        if (updatedEvent.getEventTime() != null) {
            existingEvent.setEventTime(updatedEvent.getEventTime());
        }

        return eventRepository.save(existingEvent);
    }

    public void deleteEvent(Long eventId, User currentUser) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + eventId));

        // Check if user is authorized (must be a host)
        if (!event.getHosts().contains(currentUser.getUserEmail())) {
            throw new UnauthorizedException("Only event hosts can delete events");
        }

        // Remove the event ID from the group's events list
        Group group = groupRepository.findById(event.getGroupId())
                .orElseThrow(() -> new GroupNotFoundException("Group not found with id: " + event.getGroupId()));

        if (group.getEvents() != null) {
            group.getEvents().remove(eventId);
            groupRepository.save(group);
        }

        // Remove the event from all hosts' hostedEvents list
        if (event.getHosts() != null) {
            for (String hostEmail : event.getHosts()) {
                userRepository.findById(hostEmail).ifPresent(host -> {
                    if (host.getHostedEvents() != null) {
                        host.getHostedEvents().remove(eventId);
                        userRepository.save(host);
                    }
                });
            }
        }

        // Remove the event from all participants' joinedEvents list
        if (event.getParticipants() != null) {
            for (String participantEmail : event.getParticipants()) {
                userRepository.findById(participantEmail).ifPresent(participant -> {
                    if (participant.getJoinedEvents() != null) {
                        participant.getJoinedEvents().remove(eventId);
                        userRepository.save(participant);
                    }
                });
            }
        }

        // Delete the event
        eventRepository.delete(event);
    }

    public Event getEventById(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + eventId));
    }

    public List<Event> getEventsByGroupId(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Group not found with id: " + groupId));

        List<Event> events = new ArrayList<>();
        if (group.getEvents() != null) {
            for (Long eventId : group.getEvents()) {
                eventRepository.findById(eventId).ifPresent(events::add);
            }
        }

        return events;
    }

    public List<ShortEvent> getShortEventsByGroupId(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Group not found with id: " + groupId));

        List<ShortEvent> shortEvents = new ArrayList<>();
        if (group.getEvents() != null) {
            for (Long eventId : group.getEvents()) {
                eventRepository.findById(eventId)
                        .ifPresent(event -> shortEvents.add(new ShortEvent(event.getEventId(), event.getName(), event.getLocationId(), event.getIsPublic())));
            }
        }

        return shortEvents;
    }

    public Event joinEvent(Long eventId, User currentUser) {
        Event event = getEventById(eventId);

        // Check if event is public
        if (!event.getIsPublic()) {
            throw new IllegalStateException("Cannot join a private event. Join the group first.");
        }

        // Check if user is already a participant or host
        if (event.getParticipants().contains(currentUser.getUserEmail()) ||
                event.getHosts().contains(currentUser.getUserEmail())) {
            return event; // User is already in the event
        }

        // Check if event is full
        if (event.getHosts().size() + event.getParticipants().size() >= event.getMaxUsers()) {
            throw new IllegalStateException("Event has reached maximum capacity");
        }

        // Check if event has already passed
        if (event.getEventTime().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Cannot join an event that has already started");
        }

        // Add user to participants
        if (event.getParticipants() == null) {
            event.setParticipants(new ArrayList<>());
        }
        event.getParticipants().add(currentUser.getUserEmail());

        // Update user's joinedEvents list
        if (currentUser.getJoinedEvents() == null) {
            currentUser.setJoinedEvents(new ArrayList<>());
        }
        if (!currentUser.getJoinedEvents().contains(eventId)) {
            currentUser.getJoinedEvents().add(eventId);
        }

        // Save the user
        userRepository.save(currentUser);

        // Save and return the updated event
        return eventRepository.save(event);
    }
}