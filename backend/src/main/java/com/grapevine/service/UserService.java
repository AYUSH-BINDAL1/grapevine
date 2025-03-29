package com.grapevine.service;

import com.grapevine.exception.UserNotFoundException;
import com.grapevine.model.*;
import com.grapevine.repository.*;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.grapevine.exception.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final VerificationTokenRepository tokenRepository;
    private final EmailService emailService;
    private final GroupRepository groupRepository;
    private final EventRepository eventRepository;
    private final LocationRepository locationRepository;

    // session storage: sessionId -> SessionInfo
    private final Map<String, SessionInfo> activeSessions = new HashMap<>();

    public String initiateUserRegistration(User user) {
        // Check if user already exists
        if (userRepository.findById(user.getUserEmail()).isPresent()) {
            throw new UserAlreadyExistsException("A user with email " + user.getUserEmail() + " already exists");
        }

        String verificationToken = generateVerificationToken();
        VerificationToken token = new VerificationToken(verificationToken, user.getUserEmail());
        tokenRepository.save(token);
        emailService.sendVerificationEmail(user.getUserEmail(), verificationToken);
        return verificationToken;
    }

    public User verifyAndCreateUser(String token, User user) {
        VerificationToken verificationToken = tokenRepository.findByToken(token);
        if (verificationToken == null || !verificationToken.getUserEmail().equals(user.getUserEmail())) {
            throw new InvalidVerificationTokenException("Invalid verification token");
        }
        tokenRepository.delete(verificationToken);
        return userRepository.save(user);
    }

    private String generateVerificationToken() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder token = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 6; i++) {
            token.append(chars.charAt(random.nextInt(chars.length())));
        }
        return token.toString();
    }

    public User getUserByEmail(String userEmail) {
        return userRepository.findById(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + userEmail));
    }

    public String login(String email, String password) {
        User user = userRepository.findById(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));

        if (!user.getPassword().equals(password)) {
            throw new InvalidCredentialsException("Invalid credentials");
        }

        // create new session
        String sessionId = UUID.randomUUID().toString();
        SessionInfo sessionInfo = new SessionInfo(email, LocalDateTime.now().plusHours(1));
        activeSessions.put(sessionId, sessionInfo);

        return sessionId;
    }

    public void logout(String sessionId) {
        if (sessionId != null && activeSessions.containsKey(sessionId)) {
            activeSessions.remove(sessionId);
        }
    }

    public User validateSession(String sessionId) {
        if (sessionId == null || !activeSessions.containsKey(sessionId)) {
            throw new InvalidSessionException("Invalid or missing session");
        }

        SessionInfo sessionInfo = activeSessions.get(sessionId);

        // check if session expired
        if (LocalDateTime.now().isAfter(sessionInfo.expiryTime)) {
            activeSessions.remove(sessionId);
            throw new InvalidSessionException("Session expired");
        }

        // refresh session
        sessionInfo.expiryTime = LocalDateTime.now().plusHours(1);

        // return the user
        return getUserByEmail(sessionInfo.userEmail);
    }

    // inner class for session information
    private static class SessionInfo {
        String userEmail;
        LocalDateTime expiryTime;

        public SessionInfo(String userEmail, LocalDateTime expiryTime) {
            this.userEmail = userEmail;
            this.expiryTime = expiryTime;
        }
    }

    public User updateUser(String userEmail, User updatedUser) {
        User existingUser = getUserByEmail(userEmail);

        // Update the fields that can be modified
        if (updatedUser.getName() != null) {
            existingUser.setName(updatedUser.getName());
        }
        if (updatedUser.getBiography() != null) {
            existingUser.setBiography(updatedUser.getBiography());
        }
        if (updatedUser.getYear() != null) {
            existingUser.setYear(updatedUser.getYear());
        }
        if (updatedUser.getMajors() != null) {
            existingUser.setMajors(updatedUser.getMajors());
        }
        if (updatedUser.getMinors() != null) {
            existingUser.setMinors(updatedUser.getMinors());
        }
        if (updatedUser.getCourses() != null) {
            existingUser.setCourses(updatedUser.getCourses());
        }
        if (updatedUser.getPreferredLocations() != null) {
            existingUser.setPreferredLocations(updatedUser.getPreferredLocations());
        }

        /*
        Weird Put Request body validation issue:

        Whenever you have attributes that are initialized for a model (User.java in this case),
        the PutMapping for that model will overwrite these attributes to the defaults when the request
        body doesn't contain them. The following is an ugly workaround for the weeklyAvailability and
        role attributes. Any other models that have a PutMapping in their controller and has initialized
        attributes will have the same issue. Bad practice for now but we prolly won't get around to
        refactoring all our PutMappings for a cleaner method
         */
        StringBuilder defaultAvail = new StringBuilder();
        for (int day = 0; day < 7; day++) {
            for (int hour = 0; hour < 24; hour++) {
                defaultAvail.append('0');
            }
        }
        if (updatedUser.getWeeklyAvailability() != null &&
                !updatedUser.getWeeklyAvailability().equals(defaultAvail.toString())) {
            existingUser.setWeeklyAvailability(updatedUser.getWeeklyAvailability());
        }
        if (updatedUser.getRole() != null &&
                updatedUser.getRole() != User.Role.STUDENT) {
            existingUser.setRole(updatedUser.getRole());
        }

        return userRepository.save(existingUser);
    }

    public void deleteUser(String userEmail) {
        // First check if the user exists
        User user = getUserByEmail(userEmail);

        // Perform any cleanup operations before deleting
        // For example, you might want to handle the groups or events the user is part of

        // Remove the user from all groups they joined but don't host
        if (user.getJoinedGroups() != null && !user.getJoinedGroups().isEmpty()) {
            for (Long groupId : user.getJoinedGroups()) {
                groupRepository.findById(groupId).ifPresent(group -> {
                    group.getParticipants().remove(userEmail);
                    groupRepository.save(group);
                });
            }
        }

        // For events the user joined but doesn't host
        if (user.getJoinedEvents() != null && !user.getJoinedEvents().isEmpty()) {
            for (Long eventId : user.getJoinedEvents()) {
                eventRepository.findById(eventId).ifPresent(event -> {
                    event.getParticipants().remove(userEmail);
                    eventRepository.save(event);
                });
            }
        }

        // Delete any hosted groups
        if (user.getHostedGroups() != null && !user.getHostedGroups().isEmpty()) {
            for (Long groupId : user.getHostedGroups()) {
                groupRepository.deleteById(groupId);
            }
        }

        // Delete any hosted events
        if (user.getHostedEvents() != null && !user.getHostedEvents().isEmpty()) {
            for (Long eventId : user.getHostedEvents()) {
                eventRepository.deleteById(eventId);
            }
        }

        // Finally, delete the user from the repository
        userRepository.deleteById(userEmail);
    }

    public List<Group> getAllGroups(String userEmail) {
        User currentUser = getUserByEmail(userEmail);
        List<Group> allGroups = new ArrayList<>();

        // Get the groups the user hosts
        if (currentUser.getHostedGroups() != null && !currentUser.getHostedGroups().isEmpty()) {
            for (Long groupId : currentUser.getHostedGroups()) {
                groupRepository.findById(groupId).ifPresent(allGroups::add);
            }
        }

        // Get the groups the user participates in
        if (currentUser.getJoinedGroups() != null && !currentUser.getJoinedGroups().isEmpty()) {
            for (Long groupId : currentUser.getJoinedGroups()) {
                groupRepository.findById(groupId).ifPresent(allGroups::add);
            }
        }

        return allGroups;
    }

    public List<ShortGroup> getAllShortGroups(String userEmail) {
        User currentUser = getUserByEmail(userEmail);
        List<ShortGroup> allShortGroups = new ArrayList<>();

        // Get ShortGroup objects for the groups the user hosts
        if (currentUser.getHostedGroups() != null && !currentUser.getHostedGroups().isEmpty()) {
            for (Long groupId : currentUser.getHostedGroups()) {
                groupRepository.findById(groupId)
                        .ifPresent(group -> allShortGroups.add(new ShortGroup(group.getGroupId(), group.getName(), group.isPublic())));
            }
        }

        // Get ShortGroup objects for the groups the user participates in
        if (currentUser.getJoinedGroups() != null && !currentUser.getJoinedGroups().isEmpty()) {
            for (Long groupId : currentUser.getJoinedGroups()) {
                groupRepository.findById(groupId)
                        .ifPresent(group -> allShortGroups.add(new ShortGroup(group.getGroupId(), group.getName(), group.isPublic())));
            }
        }

        return allShortGroups;
    }

    public List<Group> getHostedGroups(String userEmail) {
        User currentUser = getUserByEmail(userEmail);
        List<Group> hostedGroups = new ArrayList<>();

        // Get the groups the user hosts using the hostedGroups IDs
        if (currentUser.getHostedGroups() != null && !currentUser.getHostedGroups().isEmpty()) {
            for (Long groupId : currentUser.getHostedGroups()) {
                groupRepository.findById(groupId).ifPresent(hostedGroups::add);
            }
        }

        return hostedGroups;
    }

    public List<ShortGroup> getHostedShortGroups(String userEmail) {
        User currentUser = getUserByEmail(userEmail);
        List<ShortGroup> hostedShortGroups = new ArrayList<>();

        if (currentUser.getHostedGroups() != null && !currentUser.getHostedGroups().isEmpty()) {
            for (Long groupId : currentUser.getHostedGroups()) {
                groupRepository.findById(groupId)
                        .ifPresent(group -> hostedShortGroups.add(new ShortGroup(group.getGroupId(), group.getName(), group.isPublic())));
            }
        }

        return hostedShortGroups;
    }


    public List<Group> getJoinedGroups(String userEmail) {
        User currentUser = getUserByEmail(userEmail);
        List<Group> joinedGroups = new ArrayList<>();

        // Get the groups the user participates in using the joinedGroups IDs
        if (currentUser.getJoinedGroups() != null && !currentUser.getJoinedGroups().isEmpty()) {
            for (Long groupId : currentUser.getJoinedGroups()) {
                groupRepository.findById(groupId).ifPresent(joinedGroups::add);
            }
        }

        return joinedGroups;
    }

    public List<ShortGroup> getJoinedShortGroups(String userEmail) {
        User currentUser = getUserByEmail(userEmail);
        List<ShortGroup> joinedShortGroups = new ArrayList<>();

        if (currentUser.getJoinedGroups() != null && !currentUser.getJoinedGroups().isEmpty()) {
            for (Long groupId : currentUser.getJoinedGroups()) {
                groupRepository.findById(groupId)
                        .ifPresent(group -> joinedShortGroups.add(new ShortGroup(group.getGroupId(), group.getName(), group.isPublic())));
            }
        }

        return joinedShortGroups;
    }

    public List<Event> getAllEvents(String userEmail) {
        User currentUser = getUserByEmail(userEmail);
        List<Event> allEvents = new ArrayList<>();

        // Get the events the user hosts
        if (currentUser.getHostedEvents() != null && !currentUser.getHostedEvents().isEmpty()) {
            for (Long eventId : currentUser.getHostedEvents()) {
                eventRepository.findById(eventId).ifPresent(allEvents::add);
            }
        }

        // Get the events the user participates in
        if (currentUser.getJoinedEvents() != null && !currentUser.getJoinedEvents().isEmpty()) {
            for (Long eventId : currentUser.getJoinedEvents()) {
                eventRepository.findById(eventId).ifPresent(allEvents::add);
            }
        }

        return allEvents;
    }

    public List<ShortEvent> getAllShortEvents(String userEmail) {
        User currentUser = getUserByEmail(userEmail);
        List<ShortEvent> allShortEvents = new ArrayList<>();

        // Get ShortEvent objects for the events the user hosts
        if (currentUser.getHostedEvents() != null && !currentUser.getHostedEvents().isEmpty()) {
            for (Long eventId : currentUser.getHostedEvents()) {
                eventRepository.findById(eventId)
                        .ifPresent(event -> allShortEvents.add(new ShortEvent(event.getEventId(), event.getName())));
            }
        }

        // Get ShortEvent objects for the events the user participates in
        if (currentUser.getJoinedEvents() != null && !currentUser.getJoinedEvents().isEmpty()) {
            for (Long eventId : currentUser.getJoinedEvents()) {
                eventRepository.findById(eventId)
                        .ifPresent(event -> allShortEvents.add(new ShortEvent(event.getEventId(), event.getName())));
            }
        }

        return allShortEvents;
    }

    public List<Event> getHostedEvents(String userEmail) {
        User currentUser = getUserByEmail(userEmail);
        List<Event> hostedEvents = new ArrayList<>();

        // Get the events the user hosts
        if (currentUser.getHostedEvents() != null && !currentUser.getHostedEvents().isEmpty()) {
            for (Long eventId : currentUser.getHostedEvents()) {
                eventRepository.findById(eventId).ifPresent(hostedEvents::add);
            }
        }

        return hostedEvents;
    }

    public List<ShortEvent> getHostedShortEvents(String userEmail) {
        User currentUser = getUserByEmail(userEmail);
        List<ShortEvent> hostedShortEvents = new ArrayList<>();

        if (currentUser.getHostedEvents() != null && !currentUser.getHostedEvents().isEmpty()) {
            for (Long eventId : currentUser.getHostedEvents()) {
                eventRepository.findById(eventId)
                        .ifPresent(event -> hostedShortEvents.add(new ShortEvent(event.getEventId(), event.getName())));
            }
        }

        return hostedShortEvents;
    }

    public List<Event> getJoinedEvents(String userEmail) {
        User currentUser = getUserByEmail(userEmail);
        List<Event> joinedEvents = new ArrayList<>();

        // Get the events the user participates in
        if (currentUser.getJoinedEvents() != null && !currentUser.getJoinedEvents().isEmpty()) {
            for (Long eventId : currentUser.getJoinedEvents()) {
                eventRepository.findById(eventId).ifPresent(joinedEvents::add);
            }
        }

        return joinedEvents;
    }

    public List<ShortEvent> getJoinedShortEvents(String userEmail) {
        User currentUser = getUserByEmail(userEmail);
        List<ShortEvent> joinedShortEvents = new ArrayList<>();

        if (currentUser.getJoinedEvents() != null && !currentUser.getJoinedEvents().isEmpty()) {
            for (Long eventId : currentUser.getJoinedEvents()) {
                eventRepository.findById(eventId)
                        .ifPresent(event -> joinedShortEvents.add(new ShortEvent(event.getEventId(), event.getName())));
            }
        }

        return joinedShortEvents;
    }

    public List<Location> getPreferredLocations(User currentUser) {
        List<Location> preferredLocations = new ArrayList<>();

        if (currentUser.getPreferredLocations() != null && !currentUser.getPreferredLocations().isEmpty()) {
            for (Long locationId : currentUser.getPreferredLocations()) {
                locationRepository.findById(locationId).ifPresent(preferredLocations::add);
            }
        }
        return preferredLocations;
    }

    public User addCourse(String userEmail, String courseKey) {
        User user = getUserByEmail(userEmail);

        // Initialize the courses list if it's null
        if (user.getCourses() == null) {
            user.setCourses(new ArrayList<>());
        }

        // Add the course if it's not already in the list
        if (!user.getCourses().contains(courseKey)) {
            user.getCourses().add(courseKey);
        }

        return userRepository.save(user);
    }

    public User removeCourse(String userEmail, String courseKey) {
        User user = getUserByEmail(userEmail);

        // Remove the course if the list exists
        if (user.getCourses() != null) {
            user.getCourses().remove(courseKey);
        }

        return userRepository.save(user);
    }

    public List<String> getUserCourses(String userEmail) {
        User user = getUserByEmail(userEmail);

        if (user.getCourses() == null) {
            return new ArrayList<>();
        }

        return user.getCourses();
    }

    // Add to UserService.java
    public List<User> searchUsersByName(String query) {
        return userRepository.findByNameContainingIgnoreCase(query);
    }

    public User sendFriendRequest(String senderEmail, String receiverEmail) {
        if (senderEmail.equals(receiverEmail)) {
            throw new IllegalArgumentException("Cannot send friend request to yourself");
        }

        User sender = getUserByEmail(senderEmail);
        User receiver = getUserByEmail(receiverEmail);

        // Check if they are already friends
        if (sender.getFriends() != null && sender.getFriends().contains(receiverEmail)) {
            throw new IllegalStateException("You are already friends with this user");
        }

        // Check if a request is already pending
        if (sender.getOutgoingFriendRequests() != null &&
                sender.getOutgoingFriendRequests().contains(receiverEmail)) {
            throw new IllegalStateException("Friend request already sent");
        }

        // Initialize lists if null
        if (sender.getOutgoingFriendRequests() == null) {
            sender.setOutgoingFriendRequests(new ArrayList<>());
        }
        if (receiver.getIncomingFriendRequests() == null) {
            receiver.setIncomingFriendRequests(new ArrayList<>());
        }

        // Add to outgoing requests for sender
        sender.getOutgoingFriendRequests().add(receiverEmail);

        // Add to incoming requests for receiver
        receiver.getIncomingFriendRequests().add(senderEmail);

        userRepository.save(receiver);
        return userRepository.save(sender);
    }

    public User acceptFriendRequest(String userEmail, String requesterEmail) {
        User user = getUserByEmail(userEmail);
        User requester = getUserByEmail(requesterEmail);

        // Check if there is a pending request
        if (user.getIncomingFriendRequests() == null ||
                !user.getIncomingFriendRequests().contains(requesterEmail)) {
            throw new IllegalStateException("No friend request from this user");
        }

        // Initialize friends lists if needed
        if (user.getFriends() == null) {
            user.setFriends(new ArrayList<>());
        }
        if (requester.getFriends() == null) {
            requester.setFriends(new ArrayList<>());
        }

        // Add each other as friends
        user.getFriends().add(requesterEmail);
        requester.getFriends().add(userEmail);

        // Remove from request lists
        user.getIncomingFriendRequests().remove(requesterEmail);
        requester.getOutgoingFriendRequests().remove(userEmail);

        userRepository.save(requester);
        return userRepository.save(user);
    }

    public User denyFriendRequest(String userEmail, String requesterEmail) {
        User user = getUserByEmail(userEmail);
        User requester = getUserByEmail(requesterEmail);

        // Check if there is a pending request
        if (user.getIncomingFriendRequests() == null ||
                !user.getIncomingFriendRequests().contains(requesterEmail)) {
            throw new IllegalStateException("No friend request from this user");
        }

        // Remove from request lists
        user.getIncomingFriendRequests().remove(requesterEmail);
        if (requester.getOutgoingFriendRequests() != null) {
            requester.getOutgoingFriendRequests().remove(userEmail);
        }

        userRepository.save(requester);
        return userRepository.save(user);
    }

    public List<User> getIncomingFriendRequests(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<User> requesters = new ArrayList<>();

        if (user.getIncomingFriendRequests() != null) {
            for (String requesterEmail : user.getIncomingFriendRequests()) {
                userRepository.findById(requesterEmail).ifPresent(requesters::add);
            }
        }

        return requesters;
    }

    public List<User> getOutgoingFriendRequests(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<User> receivers = new ArrayList<>();

        if (user.getOutgoingFriendRequests() != null) {
            for (String receiverEmail : user.getOutgoingFriendRequests()) {
                userRepository.findById(receiverEmail).ifPresent(receivers::add);
            }
        }

        return receivers;
    }
}