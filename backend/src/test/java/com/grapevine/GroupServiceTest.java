package com.grapevine;

import com.grapevine.exception.GroupNotFoundException;
import com.grapevine.model.Group;
import com.grapevine.model.ShortGroup;
import com.grapevine.model.User;
import com.grapevine.repository.GroupRepository;
import com.grapevine.repository.UserRepository;
import com.grapevine.service.GroupService;
import com.grapevine.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class GroupServiceTest {

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GroupService groupService;

    private Group testGroup;
    private User testUser;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Set up test group using no-args constructor
        testGroup = new Group();
        testGroup.setGroupId(1L);
        testGroup.setName("Test Group");
        testGroup.setDescription("Group for testing");
        testGroup.setMaxUsers(10);
        testGroup.setPublic(true); // Set isPublic attribute
        testGroup.setHosts(new ArrayList<>());
        testGroup.setParticipants(new ArrayList<>());

        // Set up test user using no-args constructor
        testUser = new User();
        testUser.setUserEmail("test@example.com");
        testUser.setName("Test User");
        testUser.setHostedGroups(new ArrayList<>());
        testUser.setJoinedGroups(new ArrayList<>());
    }

    @Test
    void getAllGroups_ShouldReturnAllGroups() {
        // Arrange
        List<Group> expectedGroups = new ArrayList<>();
        expectedGroups.add(testGroup);

        Group secondGroup = new Group();
        secondGroup.setGroupId(2L);
        secondGroup.setName("Second Group");
        secondGroup.setDescription("Another group");
        secondGroup.setMaxUsers(15);
        secondGroup.setPublic(false); // Set isPublic attribute
        secondGroup.setHosts(new ArrayList<>());
        secondGroup.setParticipants(new ArrayList<>());
        expectedGroups.add(secondGroup);

        when(groupRepository.findAll()).thenReturn(expectedGroups);

        // Act
        List<Group> result = groupService.getAllGroups();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Test Group", result.get(0).getName());
        assertTrue(result.get(0).isPublic());
        assertEquals("Second Group", result.get(1).getName());
        assertFalse(result.get(1).isPublic());
        verify(groupRepository).findAll();
    }

    @Test
    void getAllGroups_ShouldReturnEmptyList_WhenNoGroupsExist() {
        // Arrange
        when(groupRepository.findAll()).thenReturn(new ArrayList<>());

        // Act
        List<Group> result = groupService.getAllGroups();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(groupRepository).findAll();
    }

    @Test
    void getAllShortGroups_ShouldReturnAllGroupsInShortForm() {
        // Arrange
        List<Group> groups = new ArrayList<>();
        groups.add(testGroup);

        Group secondGroup = new Group();
        secondGroup.setGroupId(2L);
        secondGroup.setName("Second Group");
        secondGroup.setPublic(false); // Set isPublic attribute
        groups.add(secondGroup);

        when(groupRepository.findAll()).thenReturn(groups);

        // Act
        List<ShortGroup> result = groupService.getAllShortGroups();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getGroupId());
        assertEquals("Test Group", result.get(0).getName());
        assertTrue(result.get(0).isPublic());
        assertEquals(2L, result.get(1).getGroupId());
        assertEquals("Second Group", result.get(1).getName());
        assertFalse(result.get(1).isPublic());
        verify(groupRepository).findAll();
    }

    @Test
    void getAllShortGroups_ShouldReturnEmptyList_WhenNoGroupsExist() {
        // Arrange
        when(groupRepository.findAll()).thenReturn(new ArrayList<>());

        // Act
        List<ShortGroup> result = groupService.getAllShortGroups();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(groupRepository).findAll();
    }

    @Test
    void createGroup_ShouldCreateGroupAndAddCurrentUserAsHost() {
        // Arrange
        Group groupToCreate = new Group();
        groupToCreate.setName("New Group");
        groupToCreate.setDescription("New group for testing");
        groupToCreate.setMaxUsers(10);
        groupToCreate.setPublic(true); // Set isPublic attribute
        // Hosts and participants are null

        when(groupRepository.save(any(Group.class))).thenReturn(testGroup);

        // Act
        Group result = groupService.createGroup(groupToCreate, testUser);

        // Assert
        assertNotNull(result);
        assertEquals(testGroup.getGroupId(), result.getGroupId());
        assertEquals(testGroup.getName(), result.getName());
        assertEquals(testGroup.isPublic(), result.isPublic());

        // Verify the group was initialized correctly
        verify(groupRepository).save(any(Group.class));
        verify(userRepository).save(testUser);

        // Check that the current user was added as host and user's hosted groups updated
        assertTrue(testUser.getHostedGroups().contains(testGroup.getGroupId()));
    }

    @Test
    void createGroup_ShouldInitializeListsIfNull() {
        // Arrange
        Group groupToCreate = new Group();
        groupToCreate.setName("New Group");
        groupToCreate.setPublic(true); // Set isPublic attribute
        // Hosts and participants are null

        when(groupRepository.save(any(Group.class))).thenAnswer(invocation -> {
            Group savedGroup = invocation.getArgument(0);
            savedGroup.setGroupId(1L);
            return savedGroup;
        });

        // Act
        Group result = groupService.createGroup(groupToCreate, testUser);

        // Assert
        assertNotNull(result.getHosts());
        assertNotNull(result.getParticipants());
        assertTrue(result.getHosts().contains(testUser.getUserEmail()));
        assertTrue(result.isPublic());
        verify(groupRepository).save(any(Group.class));
    }

    @Test
    void getGroupById_ShouldReturnGroup_WhenGroupExists() {
        // Arrange
        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

        // Act
        Group result = groupService.getGroupById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getGroupId());
        assertEquals("Test Group", result.getName());
        assertTrue(result.isPublic());
        verify(groupRepository).findById(1L);
    }

    @Test
    void getGroupById_ShouldThrowException_WhenGroupNotFound() {
        // Arrange
        when(groupRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        GroupNotFoundException exception = assertThrows(GroupNotFoundException.class,
                () -> groupService.getGroupById(999L));

        assertEquals("Group not found with id: 999", exception.getMessage());
        verify(groupRepository).findById(999L);
    }
}