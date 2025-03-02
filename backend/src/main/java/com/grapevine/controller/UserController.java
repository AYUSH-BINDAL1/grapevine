package com.grapevine.controller;

import com.grapevine.model.Group;
import com.grapevine.model.ShortGroup;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import com.grapevine.model.User;
import com.grapevine.model.login.LoginRequest;
import com.grapevine.model.login.LoginResponse;
import com.grapevine.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {
    private final UserService userService;

    @PostMapping("/register")
    public String registerUser(@RequestBody User user) {
        return userService.initiateUserRegistration(user);
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

    // sample of how other endpoints would use the session
    // i.e. any request made to an endpoint that requires a user be logged in
    // must have a session id in the **header** (NOT the body)
    @GetMapping("/me")
    public User getCurrentUser(@RequestHeader(name = "Session-Id", required = false) String sessionId) {
        return userService.validateSession(sessionId);
    }

}