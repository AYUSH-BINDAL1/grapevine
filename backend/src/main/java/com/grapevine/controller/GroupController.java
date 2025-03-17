package com.grapevine.controller;

import com.grapevine.model.Group;
import com.grapevine.model.Event;
import com.grapevine.model.ShortEvent;
import com.grapevine.model.ShortGroup;
import com.grapevine.model.User;
import com.grapevine.service.EventService;
import com.grapevine.service.GroupService;
import com.grapevine.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class GroupController {
    private final GroupService groupService;
    private final UserService userService;
    private final EventService eventService;


    @GetMapping("/all")
    public List<Group> getAllGroups(@RequestHeader(name = "Session-Id", required = true) String sessionId) {
        //Returns all the groups in our database
        return groupService.getAllGroups();
    }

    @GetMapping("/all-short")
    public List<ShortGroup> getAllShortGroups(@RequestHeader(name = "Session-Id", required = true) String sessionId) {
        //Returns all the groups in our database
        return groupService.getAllShortGroups();
    }

    @PostMapping("/create")
    public Group createGroup(
            @RequestHeader(name = "Session-Id", required = true) String sessionId,
            @RequestBody Group group
    ) {
        //Validate a user's session
        User currentUser = userService.validateSession(sessionId);
        //Returns the created group object after creating it
        return groupService.createGroup(group, currentUser);
    }

    @GetMapping("/{groupId}")
    public Group getGroup(
            @PathVariable Long groupId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        User currentUser = userService.validateSession(sessionId);
        return groupService.getGroupById(groupId);
    }


    @PostMapping("/{groupId}/events/create")
    public Event createEvent(
            @PathVariable Long groupId,
            @RequestBody Event event,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session
        User currentUser = userService.validateSession(sessionId);
        // Create event and associate with group
        return eventService.createEvent(event, groupId, currentUser);
    }

    @GetMapping("/{groupId}/events")
    public List<Event> getGroupEvents(
            @PathVariable Long groupId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session
        userService.validateSession(sessionId);
        // Get all events for this group
        return eventService.getEventsByGroupId(groupId);
    }

    @GetMapping("/{groupId}/events-short")
    public List<ShortEvent> getGroupShortEvents(
            @PathVariable Long groupId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session
        userService.validateSession(sessionId);
        // Get all events for this group in short form
        return eventService.getShortEventsByGroupId(groupId);
    }



    //TODO: Needs to be fixed
    /*
    @GetMapping("/search")
    public ResponseEntity<List<Group>> searchGroups(
            @RequestParam String keyword,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        List<Group> groups = groupService.searchGroups(keyword);
        return ResponseEntity.ok(groups);
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<Group> updateGroup(
            @PathVariable Long groupId,
            @RequestBody Group group,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        Group updatedGroup = groupService.updateGroup(groupId, group, sessionId);
        return ResponseEntity.ok(updatedGroup);
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable Long groupId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        groupService.deleteGroup(groupId, sessionId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{groupId}/join")
    public ResponseEntity<Group> joinGroup()
            @PathVariable Long groupId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        Group group = groupService.joinGroup(groupId, sessionId);
        return ResponseEntity.ok(group);
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<?> leaveGroup(
            @PathVariable Long groupId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        Group group = groupService.leaveGroup(groupId, sessionId);
        if (group == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(group);
    }

    @PostMapping("/{groupId}/rate")
    public ResponseEntity<Group> rateGroup(
            @PathVariable Long groupId,
            @RequestParam Float score,
            @RequestParam String review,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        Group group = groupService.addRating(groupId, score, review, sessionId);
        return ResponseEntity.ok(group);
    }
     */


}