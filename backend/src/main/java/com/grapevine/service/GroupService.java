package com.grapevine.service;

import com.grapevine.exception.GroupNotFoundException;
import com.grapevine.exception.InvalidSessionException;
import com.grapevine.model.Group;
//import com.grapevine.model.Rating;
import com.grapevine.model.ShortGroup;
import com.grapevine.model.User;
import com.grapevine.repository.GroupRepository;
import com.grapevine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupService {
    private final GroupRepository groupRepository;
    private final UserService userService;
    private final UserRepository userRepository;

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




    //TODO: Needs to be fixed
    /*
    public List<Group> searchGroups(String keyword) {
        return groupRepository.searchByKeyword(keyword);
    }

    public Group updateGroup(Long groupId, Group updatedGroup, String sessionId) {
        User currentUser = userService.validateSession(sessionId);
        Group existingGroup = getGroupById(groupId);

        // Verify the current user is a host
        if (!existingGroup.getHosts().contains(currentUser)) {
            throw new InvalidSessionException("Only hosts can update the group");
        }

        // Update fields
        if (updatedGroup.getName() != null) {
            existingGroup.setName(updatedGroup.getName());
        }
        if (updatedGroup.getDescription() != null) {
            existingGroup.setDescription(updatedGroup.getDescription());
        }
        if (updatedGroup.getMaxUsers() != null) {
            existingGroup.setMaxUsers(updatedGroup.getMaxUsers());
        }

        return groupRepository.save(existingGroup);
    }

    public void deleteGroup(Long groupId, String sessionId) {
        User currentUser = userService.validateSession(sessionId);
        Group group = getGroupById(groupId);

        // Verify the current user is a host
        if (!group.getHosts().contains(currentUser)) {
            throw new InvalidSessionException("Only hosts can delete the group");
        }

        groupRepository.deleteById(groupId);
    }

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