package com.grapevine.controller;

import com.grapevine.model.*;
import com.grapevine.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import com.grapevine.model.login.LoginRequest;
import com.grapevine.model.login.LoginResponse;
import com.grapevine.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {
    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            String token = userService.initiateUserRegistration(user);
            return ResponseEntity.ok(token);
        } catch (UserAlreadyExistsException e) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse(HttpStatus.CONFLICT.value(), e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public User verifyUser(@RequestParam String token, @RequestBody User user) {
        return userService.verifyAndCreateUser(token, user);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        String sessionId = userService.login(loginRequest.getEmail(), loginRequest.getPassword());
        User user = userService.getUserByEmail(loginRequest.getEmail());
        return ResponseEntity.ok(new LoginResponse(sessionId, user));
    }

    @DeleteMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(name = "Session-Id", required = false) String sessionId) {
        userService.logout(sessionId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userEmail}")
    public User getUser(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {
        // validate session first (will throw exception if invalid)
        userService.validateSession(sessionId);
        return userService.getUserByEmail(userEmail);
    }

    @PutMapping("/{userEmail}")
    public User updateUserProfile(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId,
            @RequestBody User updatedUser
    ) {

        //Validate the session
        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own profile");
        }
        //Update the user profile
        return userService.updateUser(userEmail, updatedUser);
    }

    @GetMapping("/{userEmail}/all-groups")
    public List<Group> getAllGroups(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId
    ) {

        //Validate session
        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view groups you are a part of");
        }
        //Return all groups the user is a part of (Hosted and Joined)
        return userService.getAllGroups(userEmail);
    }

    @GetMapping("/{userEmail}/all-groups-short")
    public List<ShortGroup> getAllShortGroups(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId
    ) {
        //Validate session
        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view groups you are a part of");
        }
        //Return all groups the user is a part of (Hosted and Joined) in short form
        return userService.getAllShortGroups(userEmail);
    }

    @GetMapping("/{userEmail}/hosted-groups")
    public List<Group> getHostedGroups(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId
    ) {

        //Validate session
        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view groups you host");
        }
        //Return all groups the user is a host of
        return userService.getHostedGroups(userEmail);
    }

    @GetMapping("/{userEmail}/hosted-groups-short")
    public List<ShortGroup> getHostedShortGroups(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId
    ) {
        //Validate session
        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view groups you host");
        }
        //Return all groups the user is a host of in short form
        return userService.getHostedShortGroups(userEmail);
    }

    @GetMapping("/{userEmail}/joined-groups")
    public List<Group> getJoinedGroups(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId
    ) {

        //Validate session
        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view groups you participate in");
        }
        //Return all groups the user is a participant of
        return userService.getJoinedGroups(userEmail);
    }

    @GetMapping("/{userEmail}/joined-groups-short")
    public List<ShortGroup> getJoinedShortGroups(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId
    ) {
        //Validate session
        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view groups you participate in");
        }
        //Return all groups the user is a participant of in short form
        return userService.getJoinedShortGroups(userEmail);
    }

    @GetMapping("/{userEmail}/all-events")
    public List<Event> getAllEvents(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId
    ) {
        //Validate session
        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view events you are a part of");
        }
        //Return all events the user is a part of (Hosted and Joined)
        return userService.getAllEvents(userEmail);
    }

    @GetMapping("/{userEmail}/all-events-short")
    public List<ShortEvent> getAllShortEvents(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId
    ) {
        //Validate session
        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view events you are a part of");
        }
        //Return all events the user is a part of in short form
        return userService.getAllShortEvents(userEmail);
    }

    @GetMapping("/{userEmail}/hosted-events")
    public List<Event> getHostedEvents(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId
    ) {
        //Validate session
        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view events you host");
        }
        //Return all events the user is hosting
        return userService.getHostedEvents(userEmail);
    }

    @GetMapping("/{userEmail}/hosted-events-short")
    public List<ShortEvent> getHostedShortEvents(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId
    ) {
        //Validate session
        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view events you host");
        }
        //Return all events the user is hosting in short form
        return userService.getHostedShortEvents(userEmail);
    }

    @GetMapping("/{userEmail}/joined-events")
    public List<Event> getJoinedEvents(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId
    ) {
        //Validate session
        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view events you participate in");
        }
        //Return all events the user is participating in
        return userService.getJoinedEvents(userEmail);
    }

    @GetMapping("/{userEmail}/joined-events-short")
    public List<ShortEvent> getJoinedShortEvents(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId
    ) {
        //Validate session
        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view events you participate in");
        }
        //Return all events the user is participating in, in short form
        return userService.getJoinedShortEvents(userEmail);
    }

    @GetMapping("/{userEmail}/preferred-locations")
    public List<Location> getPreferredLocations(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId
    ) {
        // Validate session
        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view your own preferred locations");
        }

        // Return all preferred locations for the user
        return userService.getPreferredLocations(currentUser);
    }

    @DeleteMapping("/{userEmail}")
    public ResponseEntity<?> deleteUser(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId,
            @RequestBody Map<String, String> deleteRequest
    ) {
        try {
            // Validate session
            User currentUser = userService.validateSession(sessionId);

            // Check if the user is trying to delete their own account
            if (!currentUser.getUserEmail().equals(userEmail)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own account");
            }

            // Verify password before proceeding with deletion
            String password = deleteRequest.get("password");
            if (password == null || !password.equals(currentUser.getPassword())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password");
            }

            // Delete the user
            userService.deleteUser(userEmail);

            // Also logout the session
            userService.logout(sessionId);

            return ResponseEntity.noContent().build();
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(new ErrorResponse(e.getStatusCode().value(), e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "An unexpected error occurred"));
        }
    }

    @PostMapping("/{userEmail}/courses")
    public ResponseEntity<User> addCourse(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId,
            @RequestBody String courseKey) {

        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only modify your own courses");
        }

        User updatedUser = userService.addCourse(userEmail, courseKey);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{userEmail}/courses/{courseKey}")
    public ResponseEntity<User> removeCourse(
            @PathVariable String userEmail,
            @PathVariable String courseKey,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only modify your own courses");
        }

        User updatedUser = userService.removeCourse(userEmail, courseKey);
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/{userEmail}/courses")
    public ResponseEntity<List<String>> getUserCourses(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        userService.validateSession(sessionId);
        List<String> courses = userService.getUserCourses(userEmail);
        return ResponseEntity.ok(courses);
    }

    // sample of how other endpoints would use the session
    // i.e. any request made to an endpoint that requires a user be logged in
    // must have a session id in the **header** (NOT the body)
    @GetMapping("/me")
    public User getCurrentUser(@RequestHeader(name = "Session-Id", required = false) String sessionId) {
        return userService.validateSession(sessionId);
    }

    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsers(
            @RequestParam String query,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        userService.validateSession(sessionId);
        List<User> users = userService.searchUsersByName(query);
        return ResponseEntity.ok(users);
    }

    @PostMapping("/{userEmail}/friend-requests/send")
    public ResponseEntity<User> sendFriendRequest(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId,
            @RequestBody Map<String, String> requestBody) {

        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only send friend requests from your own account");
        }

        String receiverEmail = requestBody.get("receiverEmail");
        if (receiverEmail == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receiver email is required");
        }

        try {
            User updatedUser = userService.sendFriendRequest(userEmail, receiverEmail);
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException | IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping("/{userEmail}/friend-requests/incoming")
    public ResponseEntity<List<User>> getIncomingFriendRequests(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view your own friend requests");
        }

        List<User> incomingRequests = userService.getIncomingFriendRequests(userEmail);
        return ResponseEntity.ok(incomingRequests);
    }

    @GetMapping("/{userEmail}/friend-requests/outgoing")
    public ResponseEntity<List<User>> getOutgoingFriendRequests(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view your own friend requests");
        }

        List<User> outgoingRequests = userService.getOutgoingFriendRequests(userEmail);
        return ResponseEntity.ok(outgoingRequests);
    }

    @PostMapping("/{userEmail}/friend-requests/accept")
    public ResponseEntity<User> acceptFriendRequest(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId,
            @RequestBody Map<String, String> requestBody) {

        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only accept your own friend requests");
        }

        String requesterEmail = requestBody.get("requesterEmail");
        if (requesterEmail == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requester email is required");
        }

        try {
            User updatedUser = userService.acceptFriendRequest(userEmail, requesterEmail);
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/{userEmail}/friend-requests/deny")
    public ResponseEntity<User> denyFriendRequest(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId,
            @RequestBody Map<String, String> requestBody) {

        User currentUser = userService.validateSession(sessionId);
        if (!currentUser.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only deny your own friend requests");
        }

        String requesterEmail = requestBody.get("requesterEmail");
        if (requesterEmail == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requester email is required");
        }

        try {
            User updatedUser = userService.denyFriendRequest(userEmail, requesterEmail);
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping("/{userEmail}/friends")
    public ResponseEntity<List<User>> getUserFriends(
            @PathVariable String userEmail,
            @RequestHeader(name = "Session-Id", required = true) String sessionId) {

        // Validate session
        userService.validateSession(sessionId);

        // Return the list of friends
        List<User> friends = userService.getUserFriends(userEmail);
        return ResponseEntity.ok(friends);
    }
}