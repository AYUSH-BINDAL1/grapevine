package com.grapevine.service;

import com.grapevine.exception.UserNotFoundException;
import com.grapevine.model.Group;
import com.grapevine.model.ShortGroup;
import com.grapevine.repository.GroupRepository;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.grapevine.model.User;
import com.grapevine.model.VerificationToken;
import com.grapevine.repository.UserRepository;
import com.grapevine.repository.VerificationTokenRepository;
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
    private final GroupRepository groupRepository;
    private final EmailService emailService;

    // session storage: sessionId -> SessionInfo
    private final Map<String, SessionInfo> activeSessions = new HashMap<>();

    public String initiateUserRegistration(User user) {
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

    public User updateUser(String userEmail, User updatedUser) {
        User existingUser = getUserByEmail(userEmail);

        // Update the fields that can be modified
        if (updatedUser.getName() != null) existingUser.setName(updatedUser.getName());
        if (updatedUser.getBiography() != null) existingUser.setBiography(updatedUser.getBiography());
        if (updatedUser.getYear() != null) existingUser.setYear(updatedUser.getYear());
        if (updatedUser.getMajors() != null) existingUser.setMajors(updatedUser.getMajors());
        if (updatedUser.getMinors() != null) existingUser.setMinors(updatedUser.getMinors());
        if (updatedUser.getCourses() != null) existingUser.setCourses(updatedUser.getCourses());
        if (updatedUser.getAvailableTimes() != null) existingUser.setAvailableTimes(updatedUser.getAvailableTimes());
        if (updatedUser.getProfilePicturePath() != null) existingUser.setProfilePicturePath(updatedUser.getProfilePicturePath());

        // Password should be handled separately with proper validation and encryption
        // Role changes might require special authorization

        return userRepository.save(existingUser);
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

        //Update the fields that can be modified
        //TODO: Probably need to add more
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
        //Password should be handled separately with proper validation and encryption
        //Role changes might require special authorization
        return userRepository.save(existingUser);
    }

    //TODO: Fix this shit
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
                        .ifPresent(group -> allShortGroups.add(new ShortGroup(group.getGroupId(), group.getName())));
            }
        }

        // Get ShortGroup objects for the groups the user participates in
        if (currentUser.getJoinedGroups() != null && !currentUser.getJoinedGroups().isEmpty()) {
            for (Long groupId : currentUser.getJoinedGroups()) {
                groupRepository.findById(groupId)
                        .ifPresent(group -> allShortGroups.add(new ShortGroup(group.getGroupId(), group.getName())));
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
                        .ifPresent(group -> hostedShortGroups.add(new ShortGroup(group.getGroupId(), group.getName())));
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
                        .ifPresent(group -> joinedShortGroups.add(new ShortGroup(group.getGroupId(), group.getName())));
            }
        }

        return joinedShortGroups;
    }

}