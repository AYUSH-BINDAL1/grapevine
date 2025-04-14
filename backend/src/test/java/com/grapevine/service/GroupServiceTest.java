package com.grapevine.service;

import com.grapevine.exception.GroupNotFoundException;
import com.grapevine.model.Group;
import com.grapevine.model.Rating;
import com.grapevine.model.ShortGroup;
import com.grapevine.model.User;
import com.grapevine.repository.GroupRepository;
import com.grapevine.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.*;

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

    @Mock
    private EmailService emailService;

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

    @Test
    void getShortGroupsByPublicStatus_Public_ReturnsOnlyPublicGroups() {
        // Arrange
        List<Group> allGroups = new ArrayList<>();

        // Add public test group
        testGroup.setPublic(true);
        allGroups.add(testGroup);

        // Add private group
        Group privateGroup = new Group();
        privateGroup.setGroupId(2L);
        privateGroup.setName("Private Group");
        privateGroup.setPublic(false);
        allGroups.add(privateGroup);

        // Add another public group
        Group anotherPublicGroup = new Group();
        anotherPublicGroup.setGroupId(3L);
        anotherPublicGroup.setName("Another Public Group");
        anotherPublicGroup.setPublic(true);
        allGroups.add(anotherPublicGroup);

        when(groupRepository.findAll()).thenReturn(allGroups);

        // Act
        List<ShortGroup> result = groupService.getShortGroupsByPublicStatus(true);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getGroupId());
        assertEquals("Test Group", result.get(0).getName());
        assertTrue(result.get(0).isPublic());
        assertEquals(3L, result.get(1).getGroupId());
        assertEquals("Another Public Group", result.get(1).getName());
        assertTrue(result.get(1).isPublic());
        verify(groupRepository).findAll();
    }

    @Test
    void getShortGroupsByPublicStatus_Private_ReturnsOnlyPrivateGroups() {
        // Arrange
        List<Group> allGroups = new ArrayList<>();

        // Add public test group
        testGroup.setPublic(true);
        allGroups.add(testGroup);

        // Add private group
        Group privateGroup = new Group();
        privateGroup.setGroupId(2L);
        privateGroup.setName("Private Group");
        privateGroup.setPublic(false);
        allGroups.add(privateGroup);

        // Add another private group
        Group anotherPrivateGroup = new Group();
        anotherPrivateGroup.setGroupId(3L);
        anotherPrivateGroup.setName("Another Private Group");
        anotherPrivateGroup.setPublic(false);
        allGroups.add(anotherPrivateGroup);

        when(groupRepository.findAll()).thenReturn(allGroups);

        // Act
        List<ShortGroup> result = groupService.getShortGroupsByPublicStatus(false);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(2L, result.get(0).getGroupId());
        assertEquals("Private Group", result.get(0).getName());
        assertFalse(result.get(0).isPublic());
        assertEquals(3L, result.get(1).getGroupId());
        assertEquals("Another Private Group", result.get(1).getName());
        assertFalse(result.get(1).isPublic());
        verify(groupRepository).findAll();
    }

    @Test
    void getShortGroupsByPublicStatus_NoMatchingGroups_ReturnsEmptyList() {
        // Arrange
        List<Group> allGroups = new ArrayList<>();

        // Add only public groups
        testGroup.setPublic(true);
        allGroups.add(testGroup);

        Group anotherPublicGroup = new Group();
        anotherPublicGroup.setGroupId(2L);
        anotherPublicGroup.setName("Another Public Group");
        anotherPublicGroup.setPublic(true);
        allGroups.add(anotherPublicGroup);

        when(groupRepository.findAll()).thenReturn(allGroups);

        // Act
        List<ShortGroup> result = groupService.getShortGroupsByPublicStatus(false);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(groupRepository).findAll();
    }

    @Test
    void getShortGroupsByPublicStatus_EmptyRepository_ReturnsEmptyList() {
        // Arrange
        when(groupRepository.findAll()).thenReturn(new ArrayList<>());

        // Act
        List<ShortGroup> result = groupService.getShortGroupsByPublicStatus(true);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(groupRepository).findAll();
    }

    //STORY12 As a user, I would like to rate groups I am in. AND STORY13 As a user, I would like to provide a written review for groups I am in.
    @Test
    void getGroupRatings_WithExistingRatings_ReturnsRatingsData() {
        // Arrange
        testGroup.setRating(new Rating());
        testGroup.getRating().setScores(new ArrayList<>(List.of(4.5f, 3.0f, 5.0f)));
        testGroup.getRating().setReviews(new ArrayList<>(List.of("Great group", "Decent", "Excellent!")));
        testGroup.getRating().setUserEmails(new ArrayList<>(List.of(
            "user1@example.com", "user2@example.com", "user3@example.com"
        )));

        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

        // Act
        Map<String, Object> result = groupService.getGroupRatings(1L);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("scores"));
        assertTrue(result.containsKey("reviews"));

        List<Float> scores = (List<Float>) result.get("scores");
        List<String> reviews = (List<String>) result.get("reviews");

        assertEquals(3, scores.size());
        assertEquals(3, reviews.size());
        assertEquals(4.5f, scores.get(0));
        assertEquals("Great group", reviews.get(0));

        verify(groupRepository).findById(1L);
    }

    @Test
    void getGroupRatings_WithNoRatings_ReturnsEmptyLists() {
        // Arrange
        testGroup.setRating(null);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

        // Act
        Map<String, Object> result = groupService.getGroupRatings(1L);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("scores"));
        assertTrue(result.containsKey("reviews"));

        List<Float> scores = (List<Float>) result.get("scores");
        List<String> reviews = (List<String>) result.get("reviews");

        assertTrue(scores.isEmpty());
        assertTrue(reviews.isEmpty());

        verify(groupRepository).findById(1L);
    }

    @Test
    void getGroupRatingSummary_WithExistingRatings_ReturnsCorrectSummary() {
        // Arrange
        Rating rating = new Rating();
        rating.setScores(new ArrayList<>(List.of(4.0f, 5.0f, 3.0f)));
        rating.setAverageRating(4.0f);
        testGroup.setRating(rating);

        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

        // Act
        Map<String, Object> result = groupService.getGroupRatingSummary(1L);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("averageRating"));
        assertTrue(result.containsKey("totalReviews"));
        assertEquals(4.0f, result.get("averageRating"));
        assertEquals(3, result.get("totalReviews"));

        verify(groupRepository).findById(1L);
    }

    @Test
    void getGroupRatingSummary_WithNoRatings_ReturnsZeroValues() {
        // Arrange
        testGroup.setRating(null);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

        // Act
        Map<String, Object> result = groupService.getGroupRatingSummary(1L);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("averageRating"));
        assertTrue(result.containsKey("totalReviews"));
        assertEquals(0.0f, result.get("averageRating"));
        assertEquals(0, result.get("totalReviews"));

        verify(groupRepository).findById(1L);
    }

    @Test
    void addOrUpdateRating_NewRating_AddsRatingCorrectly() {
        // Arrange
        Group group = new Group();
        User user = new User();
        user.setName("Test User"); // Add name

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(groupRepository.save(any(Group.class))).thenReturn(group);

        // Act
        Group result = groupService.addOrUpdateRating(1L, 4.5f, "Great group!", "test@example.com");

        // Assert
        assertNotNull(result);
        assertNotNull(result.getRating());
        assertEquals(1, result.getRating().getScores().size());
        assertEquals(4.5f, result.getRating().getScores().get(0));
        assertEquals("Great group!", result.getRating().getReviews().get(0));
        assertEquals("test@example.com", result.getRating().getUserEmails().get(0));
        assertEquals("Test User", result.getRating().getUserNames().get(0));
        assertEquals(4.5f, result.getRating().getAverageRating());
    }

    @Test
    void addOrUpdateRating_ExistingRating_UpdatesRatingCorrectly() {
        // Arrange
        Group group = new Group();
        Rating rating = new Rating();
        rating.setScores(new ArrayList<>(Arrays.asList(3.0f)));
        rating.setReviews(new ArrayList<>(Arrays.asList("Original review")));
        rating.setUserEmails(new ArrayList<>(Arrays.asList("test@example.com")));
        rating.setUserNames(new ArrayList<>(Arrays.asList("Test User"))); // Add name
        rating.setAverageRating(3.0f);
        group.setRating(rating);

        User user = new User();
        user.setName("Test User"); // Add name

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(groupRepository.save(any(Group.class))).thenReturn(group);

        // Act
        Group result = groupService.addOrUpdateRating(1L, 5.0f, "Updated review!", "test@example.com");

        // Assert
        assertNotNull(result);
        assertNotNull(result.getRating());
        assertEquals(1, result.getRating().getScores().size());
        assertEquals(5.0f, result.getRating().getScores().get(0));
        assertEquals("Updated review!", result.getRating().getReviews().get(0));
        assertEquals("test@example.com", result.getRating().getUserEmails().get(0));
        assertEquals("Test User", result.getRating().getUserNames().get(0));
        assertEquals(5.0f, result.getRating().getAverageRating());
    }

    @Test
    void addOrUpdateRating_MultipleRatings_CalculatesAverageCorrectly() {
        // Arrange
        Group group = new Group();
        Rating rating = new Rating();
        rating.setScores(new ArrayList<>(Arrays.asList(4.0f)));
        rating.setReviews(new ArrayList<>(Arrays.asList("First review")));
        rating.setUserEmails(new ArrayList<>(Arrays.asList("user1@example.com")));
        rating.setUserNames(new ArrayList<>(Arrays.asList("User One"))); // Add name
        rating.setAverageRating(4.0f);
        group.setRating(rating);

        User user = new User();
        user.setName("User Two"); // Add name

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(userService.getUserByEmail("user2@example.com")).thenReturn(user);
        when(groupRepository.save(any(Group.class))).thenReturn(group);

        // Act
        Group result = groupService.addOrUpdateRating(1L, 2.0f, "Second review", "user2@example.com");

        // Assert
        assertNotNull(result);
        assertNotNull(result.getRating());
        assertEquals(2, result.getRating().getScores().size());
        assertEquals(3.0f, result.getRating().getAverageRating());
        assertEquals("User Two", result.getRating().getUserNames().get(1)); // Check name
    }

    @Test
    void addOrUpdateRating_PartialUpdate_OnlyUpdatesSpecifiedFields() {
        // Arrange
        Group group = new Group();
        Rating rating = new Rating();
        rating.setScores(new ArrayList<>(Arrays.asList(3.0f)));
        rating.setReviews(new ArrayList<>(Arrays.asList("Original review")));
        rating.setUserEmails(new ArrayList<>(Arrays.asList("test@example.com")));
        rating.setUserNames(new ArrayList<>(Arrays.asList("Test User"))); // Add name
        rating.setAverageRating(3.0f);
        group.setRating(rating);

        User user = new User();
        user.setName("Test User"); // Add name

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(groupRepository.save(any(Group.class))).thenReturn(group);

        // Act - update only the review, leaving score as is
        Group result = groupService.addOrUpdateRating(1L, null, "Updated review only!", "test@example.com");

        // Assert
        assertNotNull(result);
        assertNotNull(result.getRating());
        assertEquals(1, result.getRating().getScores().size());
        assertEquals(3.0f, result.getRating().getScores().get(0)); // Score unchanged
        assertEquals("Updated review only!", result.getRating().getReviews().get(0)); // Review updated
        assertEquals("Test User", result.getRating().getUserNames().get(0)); // Name unchanged
    }

    @Test
    void getUserRating_ExistingRating_ReturnsUserRating() {
        // Arrange
        Group group = new Group();
        Rating rating = new Rating();
        rating.setScores(new ArrayList<>(Arrays.asList(4.5f)));
        rating.setReviews(new ArrayList<>(Arrays.asList("Great group!")));
        rating.setUserEmails(new ArrayList<>(Arrays.asList("test@example.com")));
        rating.setUserNames(new ArrayList<>(Arrays.asList("Test User"))); // Add name
        group.setRating(rating);

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        // Act
        Map<String, Object> result = groupService.getUserRating(1L, "test@example.com");

        // Assert
        assertNotNull(result);
        assertEquals(4.5f, result.get("score"));
        assertEquals("Great group!", result.get("review"));
        assertEquals("Test User", result.get("userName")); // Check name
    }

    @Test
    void getUserRating_NoRatingExists_ReturnsNullValues() {
        // Arrange
        testGroup.setRating(null);
        String userEmail = "user@example.com";

        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

        // Act
        Map<String, Object> result = groupService.getUserRating(1L, userEmail);

        // Assert
        assertNotNull(result);
        assertNull(result.get("score"));
        assertNull(result.get("review"));

        verify(groupRepository).findById(1L);
    }

    @Test
    void getUserRating_UserHasNoRating_ReturnsNullValues() {
        // Arrange
        Rating rating = new Rating();
        String userEmail = "user@example.com";

        rating.setUserEmails(new ArrayList<>(List.of("other1@example.com", "other2@example.com")));
        rating.setScores(new ArrayList<>(List.of(4.0f, 3.0f)));
        rating.setReviews(new ArrayList<>(List.of("Good", "Okay")));

        testGroup.setRating(rating);

        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

        // Act
        Map<String, Object> result = groupService.getUserRating(1L, userEmail);

        // Assert
        assertNotNull(result);
        assertNull(result.get("score"));
        assertNull(result.get("review"));

        verify(groupRepository).findById(1L);
    }

    @Test
    void deleteUserRating_ExistingRating_RemovesAndRecalculatesAverage() {
        // Arrange
        Group group = new Group();
        Rating rating = new Rating();
        rating.setScores(new ArrayList<>(Arrays.asList(3.0f, 5.0f)));
        rating.setReviews(new ArrayList<>(Arrays.asList("Average", "Excellent")));
        rating.setUserEmails(new ArrayList<>(Arrays.asList("user1@example.com", "user2@example.com")));
        rating.setUserNames(new ArrayList<>(Arrays.asList("User One", "User Two"))); // Add names
        rating.setAverageRating(4.0f);
        group.setRating(rating);

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupRepository.save(any(Group.class))).thenReturn(group);

        // Act
        Group result = groupService.deleteUserRating(1L, "user2@example.com");

        // Assert
        assertNotNull(result);
        assertNotNull(result.getRating());
        assertEquals(1, result.getRating().getScores().size());
        assertEquals(3.0f, result.getRating().getScores().get(0));
        assertEquals("Average", result.getRating().getReviews().get(0));
        assertEquals("user1@example.com", result.getRating().getUserEmails().get(0));
        assertEquals("User One", result.getRating().getUserNames().get(0)); // Check remaining name
        assertEquals(3.0f, result.getRating().getAverageRating());
    }

    @Test
    void deleteUserRating_NoRatingExists_ReturnsGroupUnchanged() {
        // Arrange
        testGroup.setRating(null);
        String userEmail = "user@example.com";

        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

        // Act
        Group result = groupService.deleteUserRating(1L, userEmail);

        // Assert
        assertNotNull(result);
        assertNull(result.getRating());

        verify(groupRepository).findById(1L);
        verifyNoMoreInteractions(groupRepository); // Should not save as no changes made
    }

    @Test
    void deleteUserRating_UserHasNoRating_ReturnsGroupUnchanged() {
        // Arrange
        Rating rating = new Rating();
        String userEmail = "nonexistent@example.com";

        rating.setUserEmails(new ArrayList<>(List.of("user1@example.com", "user2@example.com")));
        rating.setScores(new ArrayList<>(List.of(4.0f, 3.0f)));
        rating.setReviews(new ArrayList<>(List.of("Good", "Okay")));
        rating.setAverageRating(3.5f);

        testGroup.setRating(rating);

        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

        // Act
        Group result = groupService.deleteUserRating(1L, userEmail);

        // Assert
        assertNotNull(result);
        assertNotNull(result.getRating());

        // Original data should be unchanged
        assertEquals(2, result.getRating().getUserEmails().size());
        assertEquals(3.5f, result.getRating().getAverageRating());

        verify(groupRepository).findById(1L);
        verifyNoMoreInteractions(groupRepository); // Should not save as no changes made
    }

    @Test
    void recalculateAverageRating_IgnoresZeroScores() {
        // Arrange
        Group group = new Group();
        Rating rating = new Rating();
        rating.setScores(new ArrayList<>(Arrays.asList(0.0f, 4.0f, 0.0f, 5.0f)));
        rating.setUserEmails(new ArrayList<>(Arrays.asList("u1@example.com", "u2@example.com", "u3@example.com", "u4@example.com")));
        rating.setUserNames(new ArrayList<>(Arrays.asList("User 1", "User 2", "User 3", "User 4"))); // Add names
        group.setRating(rating);

        User user = new User();
        user.setName("Test User"); // Add name

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(userService.getUserByEmail(anyString())).thenReturn(user);
        when(groupRepository.save(any(Group.class))).thenReturn(group);

        // Act
        Group result = groupService.addOrUpdateRating(1L, null, null, "test@example.com");

        // Assert
        assertNotNull(result.getRating());
        assertEquals(4.5f, result.getRating().getAverageRating());
    }

    @Test
    void recalculateAverageRating_HandlesNullScores() {
        // Arrange
        Group group = new Group();
        User user = new User();
        user.setName("Test User"); // Add name

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(userService.getUserByEmail(anyString())).thenReturn(user);
        when(groupRepository.save(any(Group.class))).thenReturn(group);

        // Act
        Group result = groupService.addOrUpdateRating(1L, null, "Review with no score", "test@example.com");

        // Assert
        assertNotNull(result.getRating());
        assertEquals(0.0f, result.getRating().getAverageRating());
    }

    @Test
    void checkUserHasGroupAccess_PublicGroup_ReturnsTrue() {
        // Arrange
        testGroup.setPublic(true);
        testGroup.setParticipants(new ArrayList<>(List.of("otheruser@example.com")));
        testGroup.setHosts(new ArrayList<>(List.of("host@example.com")));

        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

        // Act
        boolean result = groupService.checkUserHasGroupAccess(1L, testUser);

        // Assert
        assertTrue(result);
        verify(groupRepository).findById(1L);
    }

    @Test
    void checkUserHasGroupAccess_UserIsParticipant_ReturnsTrue() {
        // Arrange
        testGroup.setPublic(false);
        testGroup.setParticipants(new ArrayList<>(List.of("test@example.com", "otheruser@example.com")));
        testGroup.setHosts(new ArrayList<>(List.of("host@example.com")));

        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

        // Act
        boolean result = groupService.checkUserHasGroupAccess(1L, testUser);

        // Assert
        assertTrue(result);
        verify(groupRepository).findById(1L);
    }

    @Test
    void checkUserHasGroupAccess_UserIsHost_ReturnsTrue() {
        // Arrange
        testGroup.setPublic(false);
        testGroup.setParticipants(new ArrayList<>(List.of("otheruser@example.com")));
        testGroup.setHosts(new ArrayList<>(List.of("test@example.com", "otherhost@example.com")));

        when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

        // Act
        boolean result = groupService.checkUserHasGroupAccess(1L, testUser);

        // Assert
        assertTrue(result);
        verify(groupRepository).findById(1L);
    }

    @Test
        void checkUserHasGroupAccess_PrivateGroupNoAccess_ReturnsFalse() {
            // Arrange
            testGroup.setPublic(false);
            testGroup.setParticipants(new ArrayList<>(List.of("otheruser@example.com")));
            testGroup.setHosts(new ArrayList<>(List.of("otherhost@example.com")));

            when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

            // Act
            boolean result = groupService.checkUserHasGroupAccess(1L, testUser);

            // Assert
            assertFalse(result);
            verify(groupRepository).findById(1L);
        }


        @Test
        void getAllShortGroups_ConvertsFull_ToShortCorrectly() {
            // Arrange
            List<Group> allGroups = new ArrayList<>();

            // Add groups with various properties
            testGroup.setGroupId(1L);
            testGroup.setName("Test Group");
            testGroup.setPublic(true);
            testGroup.setDescription("Test Description");
            testGroup.setHosts(List.of("host@example.com"));
            testGroup.setParticipants(List.of("user1@example.com", "user2@example.com"));
            allGroups.add(testGroup);

            Group privateGroup = new Group();
            privateGroup.setGroupId(2L);
            privateGroup.setName("Private Group");
            privateGroup.setPublic(false);
            privateGroup.setDescription("Private Description");
            privateGroup.setHosts(List.of("host2@example.com"));
            privateGroup.setParticipants(List.of("user3@example.com"));
            allGroups.add(privateGroup);

            when(groupRepository.findAll()).thenReturn(allGroups);

            // Act
            List<ShortGroup> result = groupService.getAllShortGroups();

            // Assert
            assertNotNull(result);
            assertEquals(2, result.size());

            // Verify first group conversion
            assertEquals(1L, result.get(0).getGroupId());
            assertEquals("Test Group", result.get(0).getName());
            assertTrue(result.get(0).isPublic());

            // Verify second group conversion
            assertEquals(2L, result.get(1).getGroupId());
            assertEquals("Private Group", result.get(1).getName());
            assertFalse(result.get(1).isPublic());

            // Verify only necessary fields are included in ShortGroup
            verify(groupRepository).findAll();
        }

        @Test
        void getAllShortGroups_EmptyRepository_ReturnsEmptyList() {
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
        void getAllShortGroups_NullFields_HandlesGracefully() {
            // Arrange
            List<Group> allGroups = new ArrayList<>();

            // Create a minimal group with only necessary fields
            Group minimalGroup = new Group();
            minimalGroup.setGroupId(1L);
            minimalGroup.setName("Minimal Group");
            // No explicit public setting (should default)
            // No participants, hosts, or other fields
            allGroups.add(minimalGroup);

            when(groupRepository.findAll()).thenReturn(allGroups);

            // Act
            List<ShortGroup> result = groupService.getAllShortGroups();

            // Assert
            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(1L, result.get(0).getGroupId());
            assertEquals("Minimal Group", result.get(0).getName());
            // Default value for isPublic should be used (likely false)
            assertFalse(result.get(0).isPublic());
            verify(groupRepository).findAll();
        }

        @Test
        void createGroup_SetsCreatorAsHost() {
            // Arrange
            Group newGroup = new Group();
            newGroup.setName("New Group");
            newGroup.setPublic(true);
            // Don't set hosts or participants - should be initialized

            when(groupRepository.save(any(Group.class))).thenAnswer(invocation -> {
                Group savedGroup = invocation.getArgument(0);
                savedGroup.setGroupId(5L);  // Simulate DB assigning ID
                return savedGroup;
            });

            // Act
            Group result = groupService.createGroup(newGroup, testUser);

            // Assert
            assertNotNull(result);
            assertEquals(5L, result.getGroupId());
            assertEquals("New Group", result.getName());
            assertTrue(result.isPublic());

            // Verify creator is added as host
            assertNotNull(result.getHosts());
            assertEquals(1, result.getHosts().size());
            assertEquals("test@example.com", result.getHosts().get(0));

            // Verify participants list is initialized
            assertNotNull(result.getParticipants());
            assertTrue(result.getParticipants().isEmpty());

            verify(groupRepository).save(any(Group.class));
            verify(userRepository).save(testUser);
        }

        @Test
        void createGroup_UpdatesUserHostedGroups() {
            // Arrange
            Group newGroup = new Group();
            newGroup.setName("New Group");
            newGroup.setPublic(true);

            // Set up user with no hosted groups initially
            testUser.setHostedGroups(null);

            when(groupRepository.save(any(Group.class))).thenAnswer(invocation -> {
                Group savedGroup = invocation.getArgument(0);
                savedGroup.setGroupId(5L);  // Simulate DB assigning ID
                return savedGroup;
            });

            // Act
            Group result = groupService.createGroup(newGroup, testUser);

            // Assert
            assertNotNull(result);

            // Verify user's hostedGroups is updated
            assertNotNull(testUser.getHostedGroups());
            assertEquals(1, testUser.getHostedGroups().size());
            assertEquals(5L, testUser.getHostedGroups().get(0));

            verify(groupRepository).save(any(Group.class));
            verify(userRepository).save(testUser);
        }

        @Test
        void createGroup_UserWithExistingHostedGroups_AppendsNewGroup() {
            // Arrange
            Group newGroup = new Group();
            newGroup.setName("Another Hosted Group");
            newGroup.setPublic(false);

            // Set up user with existing hosted groups
            testUser.setHostedGroups(new ArrayList<>(List.of(1L, 2L)));

            when(groupRepository.save(any(Group.class))).thenAnswer(invocation -> {
                Group savedGroup = invocation.getArgument(0);
                savedGroup.setGroupId(3L);  // Simulate DB assigning ID
                return savedGroup;
            });

            // Act
            Group result = groupService.createGroup(newGroup, testUser);

            // Assert
            assertNotNull(result);

            // Verify new group ID is appended to existing list
            assertEquals(3, testUser.getHostedGroups().size());
            assertEquals(1L, testUser.getHostedGroups().get(0));
            assertEquals(2L, testUser.getHostedGroups().get(1));
            assertEquals(3L, testUser.getHostedGroups().get(2));

            verify(groupRepository).save(any(Group.class));
            verify(userRepository).save(testUser);
        }

        @Test
        void getGroupById_ValidId_ReturnsGroup() {
            // Arrange
            when(groupRepository.findById(1L)).thenReturn(Optional.of(testGroup));

            // Act
            Group result = groupService.getGroupById(1L);

            // Assert
            assertNotNull(result);
            assertEquals(1L, result.getGroupId());
            assertEquals("Test Group", result.getName());
            verify(groupRepository).findById(1L);
        }

        @Test
        void getGroupById_InvalidId_ThrowsException() {
            // Arrange
            when(groupRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            GroupNotFoundException exception = assertThrows(
                GroupNotFoundException.class,
                () -> groupService.getGroupById(999L)
            );

            assertEquals("Group not found with id: 999", exception.getMessage());
            verify(groupRepository).findById(999L);
        }

        @Test
        void sendGroupAccessRequests_Success() {
            // Arrange
            Long groupId = 1L;
            String hostEmail = "host@example.com";

            Group privateGroup = new Group();
            privateGroup.setGroupId(groupId);
            privateGroup.setName("Private Study Group");
            privateGroup.setPublic(false);
            privateGroup.setHosts(List.of(hostEmail));
            privateGroup.setParticipants(new ArrayList<>());

            User host = new User();
            host.setUserEmail(hostEmail);
            host.setName("Host User");

            when(groupRepository.findById(groupId)).thenReturn(Optional.of(privateGroup));
            when(userService.getUserByEmail(hostEmail)).thenReturn(host);
            doNothing().when(emailService).sendHtmlEmail(
                eq(hostEmail),
                anyString(),
                contains("wants to join your group")
            );

            // Act
            groupService.sendGroupAccessRequests(groupId, testUser);

            // Assert
            verify(groupRepository).findById(groupId);
            verify(userService).getUserByEmail(hostEmail);
            verify(emailService).sendHtmlEmail(
                eq(hostEmail),
                anyString(),
                argThat(html ->
                    html.contains(testUser.getName()) &&
                    html.contains(privateGroup.getName()) &&
                    html.contains("accept") &&
                    html.contains("reject")
                )
            );
        }

        @Test
        void processAccessResponse_Accept_Success() {
            // Arrange
            String requestId = "abc-123";
            String action = "accept";
            Long groupId = 1L;
            String userEmail = "requester@example.com";

            Group group = new Group();
            group.setGroupId(groupId);
            group.setName("Test Group");
            group.setParticipants(new ArrayList<>());

            User requestingUser = new User();
            requestingUser.setUserEmail(userEmail);
            requestingUser.setName("Requesting User");
            requestingUser.setJoinedGroups(new ArrayList<>());

            when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
            when(userService.getUserByEmail(userEmail)).thenReturn(requestingUser);
            when(groupRepository.save(any(Group.class))).thenReturn(group);
            when(userRepository.save(any(User.class))).thenReturn(requestingUser);

            // Act
            String result = groupService.processAccessResponse(requestId, action, groupId, userEmail);

            // Assert
            assertTrue(result.contains("Request Accepted"));
            assertTrue(group.getParticipants().contains(userEmail));
            assertTrue(requestingUser.getJoinedGroups().contains(groupId));
            verify(groupRepository).save(group);
            verify(userRepository).save(requestingUser);
        }

        @Test
        void processAccessResponse_AlreadyMember_ReturnsAppropriateMessage() {
            // Arrange
            String requestId = "abc-123";
            String action = "accept";
            Long groupId = 1L;
            String userEmail = "requester@example.com";

            Group group = new Group();
            group.setGroupId(groupId);
            group.setName("Test Group");
            group.setParticipants(new ArrayList<>(List.of(userEmail))); // Already a member

            User requestingUser = new User();
            requestingUser.setUserEmail(userEmail);
            requestingUser.setName("Requesting User");

            when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
            when(userService.getUserByEmail(userEmail)).thenReturn(requestingUser);

            // Act
            String result = groupService.processAccessResponse(requestId, action, groupId, userEmail);

            // Assert
            assertTrue(result.contains("Already a Member"));
            verify(groupRepository).findById(groupId);
            verify(userService).getUserByEmail(userEmail);
            verifyNoMoreInteractions(groupRepository); // Should not save as no changes made
            verifyNoInteractions(userRepository);
        }

        @Test
        void processAccessResponse_Reject_ReturnsAppropriateMessage() {
            // Arrange
            String requestId = "abc-123";
            String action = "reject";
            Long groupId = 1L;
            String userEmail = "requester@example.com";

            Group group = new Group();
            group.setGroupId(groupId);
            group.setName("Test Group");

            User requestingUser = new User();
            requestingUser.setUserEmail(userEmail);
            requestingUser.setName("Requesting User");

            when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
            when(userService.getUserByEmail(userEmail)).thenReturn(requestingUser);

            // Act
            String result = groupService.processAccessResponse(requestId, action, groupId, userEmail);

            // Assert
            assertTrue(result.contains("Request Rejected"));
            verify(groupRepository).findById(groupId);
            verify(userService).getUserByEmail(userEmail);
            verifyNoMoreInteractions(groupRepository); // No saving needed for reject
            verifyNoInteractions(userRepository);
        }

        @Test
        void processAccessResponse_InvalidAction_ThrowsException() {
            // Arrange
            String requestId = "abc-123";
            String action = "invalid";
            Long groupId = 1L;
            String userEmail = "requester@example.com";

            Group group = new Group();
            group.setGroupId(groupId);

            User requestingUser = new User();
            requestingUser.setUserEmail(userEmail);

            when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
            when(userService.getUserByEmail(userEmail)).thenReturn(requestingUser);

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> groupService.processAccessResponse(requestId, action, groupId, userEmail)
            );

            assertEquals("Invalid action: invalid", exception.getMessage());
        }

}