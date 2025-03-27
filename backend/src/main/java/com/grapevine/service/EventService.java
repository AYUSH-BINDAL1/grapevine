package com.grapevine.service;

import com.grapevine.exception.EventNotFoundException;
import com.grapevine.exception.GroupNotFoundException;
import com.grapevine.exception.UnauthorizedException;
import com.grapevine.model.Event;
import com.grapevine.model.Group;
import com.grapevine.model.ShortEvent;
import com.grapevine.model.User;
import com.grapevine.repository.EventRepository;
import com.grapevine.repository.GroupRepository;
import com.grapevine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {
    private final EventRepository eventRepository;
    private final UserService userService;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;

    public List<Event> getAllEvents() {
        List<Event> events = eventRepository.findAll();
        // Sort events by time - upcoming events first
        events.sort(Comparator.comparing(Event::getEventTime,
                Comparator.nullsLast(Comparator.naturalOrder())));
        return events;
    }


    public List<ShortEvent> getAllShortEvents() {
        List<Event> events = eventRepository.findAll();
        // Sort events by time - upcoming events first
        events.sort(Comparator.comparing(Event::getEventTime,
                Comparator.nullsLast(Comparator.naturalOrder())));

        List<ShortEvent> shortEvents = new ArrayList<>();
        for (Event event : events) {
            shortEvents.add(new ShortEvent(event.getEventId(), event.getName()));
        }
        return shortEvents;
    }

    public Event createEvent(Event event, Long groupId, User currentUser) {
        // Get the group
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Group not found with id: " + groupId));

        // Validate that the user is a host of the group
        if (!group.getHosts().contains(currentUser.getUserEmail())) {
            throw new UnauthorizedException("Only group hosts can create events");
        }

        // Validate event time - must be in the future
        if (event.getEventTime() != null && event.getEventTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Event time must be in the future");
        }

        // Initialize lists if null
        if (event.getHosts() == null) {
            event.setHosts(new ArrayList<>());
        }
        if (event.getParticipants() == null) {
            event.setParticipants(new ArrayList<>());
        }

        // Set the group ID
        event.setGroupId(groupId);

        // Add current user as host
        event.getHosts().add(currentUser.getUserEmail());

        // Save the event first to get the ID
        Event savedEvent = eventRepository.save(event);

        // Update user's hostedEvents list
        if (currentUser.getHostedEvents() == null) {
            currentUser.setHostedEvents(new ArrayList<>());
        }
        currentUser.getHostedEvents().add(savedEvent.getEventId());
        userRepository.save(currentUser);

        // Update group's events list
        if (group.getEvents() == null) {
            group.setEvents(new ArrayList<>());
        }
        group.getEvents().add(savedEvent.getEventId());
        groupRepository.save(group);

        return savedEvent;
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

        if (updatedEvent.getLocation() != null) {
            existingEvent.setLocation(updatedEvent.getLocation());
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
                        .ifPresent(event -> shortEvents.add(new ShortEvent(event.getEventId(), event.getName())));
            }
        }

        return shortEvents;
    }
}