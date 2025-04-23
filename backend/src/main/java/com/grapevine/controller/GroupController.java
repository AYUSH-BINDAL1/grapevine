package com.grapevine.controller;

import com.grapevine.exception.RatingOperationException;
import com.grapevine.model.*;
import com.grapevine.service.EventService;
import com.grapevine.service.GroupService;
import com.grapevine.service.S3Service;
import com.grapevine.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/groups")
@RequiredArgsConstructor
public class GroupController {
    private final GroupService groupService;
    private final UserService userService;
    private final EventService eventService;
    private final S3Service s3Service;


    @GetMapping("/all")
    public List<Group> getAllGroups(@RequestHeader(name = "Session-Id", required = true) String sessionId) {
        //Returns all the groups in our database
        return groupService.getAllGroups();
    }

    @GetMapping("/all-short")
    public List<ShortGroup> getAllShortGroups(
            @RequestHeader(name = "Session-Id", required = true) String sessionId,
            @RequestParam(required = false) Boolean isPublic) {

        // Validate session
        userService.validateSession(sessionId);

        // If no filter provided, return all groups
        if (isPublic == null) {
            return groupService.getAllShortGroups();
        }

        // Otherwise filter by isPublic flag
        return groupService.getShortGroupsByPublicStatus(isPublic);
    }

    @GetMapping("/{groupId}/check-access")
    public ResponseEntity<?> checkGroupAccess(
            @PathVariable Long groupId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);

        // Check access using service method
        boolean hasAccess = groupService.checkUserHasGroupAccess(groupId, currentUser);

        return ResponseEntity.ok(Map.of("hasAccess", hasAccess));
    }

    @PostMapping("/{groupId}/request-access")
    public ResponseEntity<?> requestGroupAccess(
            @PathVariable Long groupId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);
        Group group = groupService.getGroupById(groupId);

        // Check if the request is valid (group is private and user isn't already a member)
        if (group.isPublic()) {
            return ResponseEntity.badRequest().body("Group is public and doesn't require access requests");
        }

        if (group.getParticipants().contains(currentUser.getUserEmail()) ||
                group.getHosts().contains(currentUser.getUserEmail())) {
            return ResponseEntity.badRequest().body("You are already a member of this group");
        }

        // Send access requests
        groupService.sendGroupAccessRequests(groupId, currentUser);

        return ResponseEntity.ok("Access request sent to group hosts");
    }

    @GetMapping("/respond-access/{requestId}/{action}/{groupId}/{userEmail}")
    public ResponseEntity<String> respondToAccessRequest(
            @PathVariable String requestId,
            @PathVariable String action,
            @PathVariable Long groupId,
            @PathVariable String userEmail) {

        try {
            String response = groupService.processAccessResponse(requestId, action, groupId, userEmail);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred: " + e.getMessage());
        }
    }

    @PostMapping("/{groupId}/join")
    public ResponseEntity<?> joinGroup(
            @PathVariable Long groupId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        //Validate session
        User currentUser = userService.validateSession(sessionId);

        //Join the group (service will validate if it's public)
        Group joinedGroup = groupService.joinPublicGroup(groupId, currentUser);

        return ResponseEntity.ok(joinedGroup);
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

    // Add this endpoint to GroupController
    @PutMapping("/{groupId}/toggle-instructor-led")
    public ResponseEntity<?> toggleInstructorLed(
            @PathVariable Long groupId,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);

        try {
            // Toggle instructor-led status
            Group updatedGroup = groupService.toggleInstructorLedStatus(groupId, currentUser);
            return ResponseEntity.ok(updatedGroup);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @PostMapping("/{groupId}/profile-picture")
    public ResponseEntity<?> uploadGroupProfilePicture(
            @PathVariable Long groupId,
            @RequestHeader("Session-Id") String sessionId,
            @RequestParam("file") MultipartFile file) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);
        Group group = groupService.getGroupById(groupId);

        // Check if user is a host of the group
        if (!group.getHosts().contains(currentUser.getUserEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only group hosts can update the group profile picture");
        }

        // Size validation (2MB max)
        if (file.getSize() > 2 * 1024 * 1024) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body("Profile picture must be less than 2MB");
        }

        // Type validation
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                    .body("Only image files are allowed for profile pictures");
        }

        try {
            // Get S3Service from autowired service
            S3Service s3Service = userService.getS3Service();

            // Delete old profile picture if it exists
            if (group.getProfilePictureUrl() != null) {
                String oldFileName = group.getProfilePictureUrl()
                        .substring(group.getProfilePictureUrl().lastIndexOf("/") + 1);
                s3Service.deleteFile(oldFileName);
            }

            // Upload new profile picture
            String fileName = s3Service.uploadFile(file);
            String publicUrl = s3Service.getPublicUrl(fileName);

            // Update group with new picture URL
            group.setProfilePictureUrl(publicUrl);
            Group updatedGroup = groupService.updateGroupProfilePicture(groupId, publicUrl);

            return ResponseEntity.ok(Map.of(
                    "fileName", fileName,
                    "profilePictureUrl", publicUrl
            ));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload profile picture: " + e.getMessage());
        }
    }

    @GetMapping("/{groupId}/profile-picture")
    public ResponseEntity<?> getGroupProfilePicture(
            @PathVariable Long groupId,
            @RequestHeader(value = "Session-Id", required = false) String sessionId) {

        // Optionally validate session if you want to restrict profile picture access
        if (sessionId != null) {
            userService.validateSession(sessionId);
        }

        // Get group and its profile picture URL
        Group group = groupService.getGroupById(groupId);

        if (group.getProfilePictureUrl() != null) {
            return ResponseEntity.ok(Map.of("profilePictureUrl", group.getProfilePictureUrl()));
        } else {
            return ResponseEntity.noContent().build();
        }
    }

    @DeleteMapping("/{groupId}/profile-picture")
    public ResponseEntity<?> deleteGroupProfilePicture(
            @PathVariable Long groupId,
            @RequestHeader("Session-Id") String sessionId) {

        // Validate session
        User currentUser = userService.validateSession(sessionId);
        Group group = groupService.getGroupById(groupId);

        // Check if user is a host of the group
        if (!group.getHosts().contains(currentUser.getUserEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only group hosts can delete the group profile picture");
        }

        // Check if group has a profile picture
        if (group.getProfilePictureUrl() == null) {
            return ResponseEntity.noContent().build();
        }

        try {
            // Get S3Service from autowired service
            S3Service s3Service = userService.getS3Service();

            // Extract filename from URL
            String fileName = group.getProfilePictureUrl()
                    .substring(group.getProfilePictureUrl().lastIndexOf("/") + 1);

            // Delete file from S3
            s3Service.deleteFile(fileName);

            // Update group profile
            group.setProfilePictureUrl(null);
            groupService.updateGroupProfilePicture(groupId, null);

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete profile picture: " + e.getMessage());
        }
    }

}