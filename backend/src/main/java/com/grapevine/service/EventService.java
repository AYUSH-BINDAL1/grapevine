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

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {
    private final EventRepository eventRepository;
    private final UserService userService;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public List<ShortEvent> getAllShortEvents() {
        List<Event> events = eventRepository.findAll();
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