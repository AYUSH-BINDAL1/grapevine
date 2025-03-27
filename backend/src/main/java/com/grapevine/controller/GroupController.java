package com.grapevine.controller;

import com.grapevine.exception.RatingOperationException;
import com.grapevine.model.*;
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

    @GetMapping("/{groupId}/ratings-reviews")
    public ResponseEntity<?> getGroupRatings(
            @PathVariable Long groupId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session
        User currentUser = userService.validateSession(sessionId);

        // Get the group and check access permissions
        Group group = groupService.getGroupById(groupId);

        // Check if user has access to ratings for a private group
        if (!group.isPublic() &&
                !group.getHosts().contains(currentUser.getUserEmail()) &&
                !group.getParticipants().contains(currentUser.getUserEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You don't have permission to view ratings for this private group");
        }

        // Get all ratings for this group
        return ResponseEntity.ok(groupService.getGroupRatings(groupId));
    }

    @GetMapping("/{groupId}/average-rating")
    public ResponseEntity<?> getGroupRatingSummary(
            @PathVariable Long groupId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session
        User currentUser = userService.validateSession(sessionId);

        // Get the group and check access permissions
        Group group = groupService.getGroupById(groupId);

        // Check if user has access to rating summary for a private group
        if (!group.isPublic() &&
                !group.getHosts().contains(currentUser.getUserEmail()) &&
                !group.getParticipants().contains(currentUser.getUserEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You don't have permission to view rating summary for this private group");
        }

        // Get rating summary for this group
        return ResponseEntity.ok(groupService.getGroupRatingSummary(groupId));
    }

    @PostMapping("/{groupId}/add-rating")
    public ResponseEntity<?> addRating(
            @PathVariable Long groupId,
            @RequestBody RatingRequest ratingRequest,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session
        User currentUser = userService.validateSession(sessionId);

        // Check if user is a member or host of the group
        Group group = groupService.getGroupById(groupId);
        if (!group.getHosts().contains(currentUser.getUserEmail()) &&
                !group.getParticipants().contains(currentUser.getUserEmail())) {
            throw new RatingOperationException("Only members or hosts can rate a group");
        }

        // Add or update rating
        group = groupService.addOrUpdateRating(
                groupId,
                ratingRequest.getScore(),
                ratingRequest.getReview(),
                currentUser.getUserEmail());

        return ResponseEntity.ok(group);
    }

    @GetMapping("/{groupId}/my-rating")
    public ResponseEntity<?> getUserRating(
            @PathVariable Long groupId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session
        User currentUser = userService.validateSession(sessionId);
        Group group = groupService.getGroupById(groupId);
        if (!group.getHosts().contains(currentUser.getUserEmail()) &&
                !group.getParticipants().contains(currentUser.getUserEmail())) {
            throw new RatingOperationException("Only members or hosts can have ratings");
        }
        // Get user's rating for this group
        return ResponseEntity.ok(groupService.getUserRating(groupId, currentUser.getUserEmail()));
    }

    @PutMapping("/{groupId}/update-rating")
    public ResponseEntity<?> updateRating(
            @PathVariable Long groupId,
            @RequestBody RatingRequest ratingRequest,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session
        User currentUser = userService.validateSession(sessionId);

        // Check if user is a member or host of the group
        Group group = groupService.getGroupById(groupId);
        if (!group.getHosts().contains(currentUser.getUserEmail()) &&
                !group.getParticipants().contains(currentUser.getUserEmail())) {
            throw new RatingOperationException("Only members or hosts can update ratings");
        }

        // Update existing rating
        group = groupService.addOrUpdateRating(
                groupId,
                ratingRequest.getScore(),
                ratingRequest.getReview(),
                currentUser.getUserEmail());

        return ResponseEntity.ok(group);
    }

    @DeleteMapping("/{groupId}/delete-rating")
    public ResponseEntity<?> deleteRating(
            @PathVariable Long groupId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // Validate session
        User currentUser = userService.validateSession(sessionId);

        // Check if user is a member or host of the group
        Group group = groupService.getGroupById(groupId);
        if (!group.getHosts().contains(currentUser.getUserEmail()) &&
                !group.getParticipants().contains(currentUser.getUserEmail())) {
            throw new RatingOperationException("Only members or hosts can delete their ratings");
        }

        // Delete the user's rating
        group = groupService.deleteUserRating(groupId, currentUser.getUserEmail());

        return ResponseEntity.ok(group);
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

     */


}