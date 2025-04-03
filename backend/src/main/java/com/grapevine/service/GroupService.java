package com.grapevine.service;

import com.grapevine.exception.GroupNotFoundException;
import com.grapevine.exception.InvalidSessionException;
import com.grapevine.model.Group;
//import com.grapevine.model.Rating;
import com.grapevine.model.Rating;
import com.grapevine.model.ShortGroup;
import com.grapevine.model.User;
import com.grapevine.repository.GroupRepository;
import com.grapevine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class GroupService {
    private final GroupRepository groupRepository;
    private final UserService userService;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public List<Group> getAllGroups() {
        return groupRepository.findAll();
    }

    public List<ShortGroup> getAllShortGroups() {
        List<Group> groups = groupRepository.findAll();
        List<ShortGroup> shortGroups = new ArrayList<>();

        for (Group group : groups) {
            shortGroups.add(new ShortGroup(group.getGroupId(), group.getName(), group.isPublic()));
        }

        return shortGroups;
    }

    public List<ShortGroup> getShortGroupsByPublicStatus(Boolean isPublic) {
        List<Group> groups = groupRepository.findAll();
        List<ShortGroup> filteredGroups = new ArrayList<>();

        for (Group group : groups) {
            if (group.isPublic() == isPublic) {
                filteredGroups.add(new ShortGroup(group.getGroupId(), group.getName(), group.isPublic()));
            }
        }

        return filteredGroups;
    }

    public boolean checkUserHasGroupAccess(Long groupId, User currentUser) {
        Group group = getGroupById(groupId);

        // If group is public, or user is already a participant/host, they have access
        return group.isPublic() ||
                group.getParticipants().contains(currentUser.getUserEmail()) ||
                group.getHosts().contains(currentUser.getUserEmail());
    }

    public void sendGroupAccessRequests(Long groupId, User requestingUser) {
        Group group = getGroupById(groupId);

        // Generate a unique request ID
        String requestId = UUID.randomUUID().toString();

        // Send email to all hosts
        for (String hostEmail : group.getHosts()) {
            // Get host user to include their name in email
            User host = userService.getUserByEmail(hostEmail);

            // Create accept/reject URLs with the request ID
            String acceptUrl = "http://localhost:8080/groups/respond-access/" + requestId +
                    "/accept/" + groupId + "/" + requestingUser.getUserEmail();
            String rejectUrl = "http://localhost:8080/groups/respond-access/" + requestId +
                    "/reject/" + groupId + "/" + requestingUser.getUserEmail();

            // Create HTML message with styled buttons using table layout (more email-client friendly)
            String htmlMessage =
                    "<html><body>" +
                            "<h2>Group Access Request</h2>" +
                            "<p>" + requestingUser.getName() + " wants to join your group: <strong>" + group.getName() + "</strong></p>" +
                            "<p>Click one of the following options:</p>" +
                            "<table border='0' cellpadding='0' cellspacing='0'><tr>" +
                            "<td><a href='" + acceptUrl + "' style='background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; display: inline-block; border-radius: 4px;'>Accept</a></td>" +
                            "<td width='10'>&nbsp;</td>" +
                            "<td><a href='" + rejectUrl + "' style='background-color: #f44336; color: white; padding: 10px 15px; text-decoration: none; display: inline-block; border-radius: 4px;'>Deny</a></td>" +
                            "</tr></table>" +
                            "</body></html>";

            // Use the new HTML email method
            emailService.sendHtmlEmail(
                    hostEmail,
                    "Join Group Request: " + group.getName(),
                    htmlMessage
            );
        }
    }

    public String processAccessResponse(String requestId, String action, Long groupId, String userEmail) {
        Group group = getGroupById(groupId);
        User requestingUser = userService.getUserByEmail(userEmail);

        if ("accept".equalsIgnoreCase(action)) {
            // Add user to group participants
            if (!group.getParticipants().contains(userEmail)) {
                group.getParticipants().add(userEmail);

                // Update user's joinedGroups list
                if (requestingUser.getJoinedGroups() == null) {
                    requestingUser.setJoinedGroups(new ArrayList<>());
                }
                if (!requestingUser.getJoinedGroups().contains(groupId)) {
                    requestingUser.getJoinedGroups().add(groupId);
                }

                // Save changes
                groupRepository.save(group);
                userRepository.save(requestingUser);

                return "<html><body><h2>Request Accepted</h2>" +
                        "<p>You've accepted " + requestingUser.getName() +
                        " into the group: " + group.getName() + "</p></body></html>";
            } else {
                return "<html><body><h2>Already a Member</h2>" +
                        "<p>" + requestingUser.getName() +
                        " is already a member of the group: " + group.getName() + "</p></body></html>";
            }
        } else if ("reject".equalsIgnoreCase(action)) {
            return "<html><body><h2>Request Rejected</h2>" +
                    "<p>You've rejected " + requestingUser.getName() +
                    "'s request to join the group: " + group.getName() + "</p></body></html>";
        } else {
            throw new IllegalArgumentException("Invalid action: " + action);
        }
    }

    public Group createGroup(Group group, User currentUser) {
        // Initialize lists if null
        if (group.getHosts() == null) {
            group.setHosts(new ArrayList<>());
        }
        if (group.getParticipants() == null) {
            group.setParticipants(new ArrayList<>());
        }

        // Add current user as host only
        group.getHosts().add(currentUser.getUserEmail());

        // Set isPublic explicitly (handling the default if not specified)
        group.setPublic(group.isPublic());

        // Initialize rating
        //Rating rating = new Rating();
        //group.setRating(rating);

        // Save the group first to get the ID
        Group savedGroup = groupRepository.save(group);

        // Update user's hostedGroups list (assuming User has a hostedGroups field)
        if (currentUser.getHostedGroups() == null) {
            currentUser.setHostedGroups(new ArrayList<>());
        }
        currentUser.getHostedGroups().add(savedGroup.getGroupId());

        // Save the updated user
        userRepository.save(currentUser);

        return savedGroup;
    }

    public Group getGroupById(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Group not found with id: " + groupId));
    }

    public Map<String, Object> getGroupRatings(Long groupId) {
        Group group = getGroupById(groupId);
        Rating rating = group.getRating();

        if (rating == null) {
            // If no rating exists, return empty lists
            Map<String, Object> emptyResult = new HashMap<>();
            emptyResult.put("scores", new ArrayList<>());
            emptyResult.put("reviews", new ArrayList<>());
            emptyResult.put("userNames", new ArrayList<>());
            return emptyResult;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("scores", rating.getScores());
        result.put("reviews", rating.getReviews());
        result.put("userNames", rating.getUserNames());

        return result;
    }

    /**
     * Returns the average rating and total number of reviews for a group
     */
    public Map<String, Object> getGroupRatingSummary(Long groupId) {
        Group group = getGroupById(groupId);
        Rating rating = group.getRating();

        Map<String, Object> summary = new HashMap<>();

        if (rating == null) {
            // If no rating exists, return defaults
            summary.put("averageRating", 0.0f);
            summary.put("totalReviews", 0);
        } else {
            summary.put("averageRating", rating.getAverageRating());
            summary.put("totalReviews", rating.getScores().size());
        }

        return summary;
    }

    public Group addOrUpdateRating(Long groupId, Float score, String review, String userEmail) {
        Group group = getGroupById(groupId);
        User user = userService.getUserByEmail(userEmail);
        String userName = user.getName();

        // Initialize Rating if null
        if (group.getRating() == null) {
            group.setRating(new Rating());
        }

        Rating rating = group.getRating();

        // Initialize collections if null
        if (rating.getUserEmails() == null) {
            rating.setUserEmails(new ArrayList<>());
            rating.setScores(new ArrayList<>());
            rating.setReviews(new ArrayList<>());
            rating.setUserNames(new ArrayList<>());
        }

        // Check if user has already rated this group
        int existingIndex = rating.getUserEmails().indexOf(userEmail);

        if (existingIndex != -1) {
            // Update existing rating/review
            if (score != null) {
                // Update score if provided
                rating.getScores().set(existingIndex, score);
            }

            if (review != null) {
                // Update review if provided
                rating.getReviews().set(existingIndex, review);
            }

            // Ensure user name is up to date
            rating.getUserNames().set(existingIndex, userName);
        } else {
            // Add new rating/review
            rating.getUserEmails().add(userEmail);
            rating.getUserNames().add(userName);

            // Handle score (use neutral value if not provided)
            if (score != null) {
                rating.getScores().add(score);
            } else {
                // Use a dummy score that won't affect average
                rating.getScores().add(0.0f);
            }

            // Handle review (use empty string if not provided)
            rating.getReviews().add(review != null ? review : "");
        }

        // Recalculate average
        recalculateAverageRating(rating);

        // Save updated group
        return groupRepository.save(group);
    }

    /**
     * Helper method to recalculate average rating ignoring dummy scores
     */
    private void recalculateAverageRating(Rating rating) {
        if (rating.getScores() == null || rating.getScores().isEmpty()) {
            rating.setAverageRating(0.0f);
            return;
        }

        float sum = 0;
        int count = 0;

        for (Float score : rating.getScores()) {
            // Only include non-zero scores in the average
            if (score != null && score > 0) {
                sum += score;
                count++;
            }
        }

        rating.setAverageRating(count > 0 ? sum / count : 0.0f);
    }

    /**
     * Gets a specific user's rating for a group
     */
    public Map<String, Object> getUserRating(Long groupId, String userEmail) {
        Group group = getGroupById(groupId);
        Map<String, Object> result = new HashMap<>();

        // Default values if no rating exists
        result.put("score", null);
        result.put("review", null);
        result.put("userName", null);

        if (group.getRating() != null && group.getRating().getUserEmails() != null) {
            Rating rating = group.getRating();
            int index = rating.getUserEmails().indexOf(userEmail);

            if (index != -1) {
                result.put("score", rating.getScores().get(index));
                result.put("review", rating.getReviews().get(index));
                result.put("userName", rating.getUserNames().get(index));
            }
        }

        return result;
    }

    public Group deleteUserRating(Long groupId, String userEmail) {
        Group group = getGroupById(groupId);

        if (group.getRating() != null && group.getRating().getUserEmails() != null) {
            Rating rating = group.getRating();
            int index = rating.getUserEmails().indexOf(userEmail);

            if (index != -1) {
                // Remove user's rating, review, and name
                rating.getUserEmails().remove(index);
                rating.getScores().remove(index);
                rating.getReviews().remove(index);
                rating.getUserNames().remove(index);

                // Recalculate average rating
                recalculateAverageRating(rating);

                // Save updated group
                return groupRepository.save(group);
            }
        }

        // Return the group as is if no rating found
        return group;
    }


    //TODO: Needs to be fixed
    /*

    public Group joinGroup(Long groupId, String sessionId) {
        User currentUser = userService.validateSession(sessionId);
        Group group = getGroupById(groupId);

        if (group.getParticipants().size() >= group.getMaxUsers()) {
            throw new IllegalStateException("Group has reached maximum capacity");
        }

        if (!group.getParticipants().contains(currentUser)) {
            group.getParticipants().add(currentUser);
            groupRepository.save(group);
        }

        return group;
    }

    public Group leaveGroup(Long groupId, String sessionId) {
        User currentUser = userService.validateSession(sessionId);
        Group group = getGroupById(groupId);

        // Remove from participants
        group.getParticipants().remove(currentUser);

        // If user is a host, remove from hosts too
        group.getHosts().remove(currentUser);

        // If no hosts left, assign new host or delete group
        if (group.getHosts().isEmpty() && !group.getParticipants().isEmpty()) {
            group.getHosts().add(group.getParticipants().get(0));
        } else if (group.getParticipants().isEmpty()) {
            groupRepository.delete(group);
            return null;
        }

        return groupRepository.save(group);
    }

    public Group addRating(Long groupId, Float score, String review, String sessionId) {
        User currentUser = userService.validateSession(sessionId);
        Group group = getGroupById(groupId);

        // Check if user is a participant
        if (!group.getParticipants().contains(currentUser)) {
            throw new InvalidSessionException("Only participants can rate the group");
        }

        // Add rating
        group.getRating().addRating(score, review);

        return groupRepository.save(group);
    }

    public List<Group> getUserGroups(String userEmail, String sessionId) {
        userService.validateSession(sessionId);
        User user = userService.getUserByEmail(userEmail);
        return groupRepository.findByParticipantsContains(user);
    }

    public List<Group> getHostedGroups(String userEmail, String sessionId) {
        userService.validateSession(sessionId);
        User user = userService.getUserByEmail(userEmail);
        return groupRepository.findByHostsContains(user);
    }

     */
}