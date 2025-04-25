import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import profileImage from "../assets/temp-profile.webp";
import "./UsrProfile.css";
import { debounce } from 'lodash';
import { base_url, image_url } from '../config';

// Create the AvailabilityLegend component
const AvailabilityLegend = memo(({ showComparison, userName }) => {
  if (showComparison) {
    return (
      <div className="availability-legend">
        <div className="legend-item">
          <div className="legend-color both-available"></div>
          <span>Both Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-color they-available"></div>
          <span>{userName} Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-color you-available"></div>
          <span>You Available</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="availability-legend">
      <div className="legend-item">
        <div className="legend-color available"></div>
        <span>{userName}&apos;s Availability</span>
      </div>
    </div>
  );
});

// Add display name and prop types
AvailabilityLegend.displayName = 'AvailabilityLegend';
AvailabilityLegend.propTypes = {
  showComparison: PropTypes.bool,
  userName: PropTypes.string.isRequired
};

// Modified InfoTooltip component with touch support
const InfoTooltip = memo(({ content }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  
  // Close tooltip when clicking outside
  useEffect(() => {
    if (!isVisible) return;
    
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);
  
  return (
    <div 
      className="info-tooltip-container"
      ref={tooltipRef}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsVisible(!isVisible);
      }}
    >
      <span className="info-icon" role="button" aria-label="Show information">ⓘ</span>
      {isVisible && (
        <div className="tooltip-content" role="tooltip">
          {content}
        </div>
      )}
    </div>
  );
});

InfoTooltip.displayName = 'InfoTooltip';
InfoTooltip.propTypes = {
  content: PropTypes.node.isRequired
};

function UsrProfile() {
  console.log('Rendering UsrProfile component');
  
  const { userEmail } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [compatibilityScore, setCompatibilityScore] = useState(null);
  const [friendRequestStatus, setFriendRequestStatus] = useState('none'); // 'none', 'pending', 'accepted'
  const [userCourses, setUserCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [showAvailabilityComparison, setShowAvailabilityComparison] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(profileImage);

  // Create a debounced function 
  const toggleAvailabilityComparison = useCallback(() => {
    setShowAvailabilityComparison(prev => !prev);
  }, []);

  // Apply debounce to the callback
  const debouncedToggleAvailability = useMemo(() => 
    debounce(toggleAvailabilityComparison, 300), 
    [toggleAvailabilityComparison]
  );

  // Add this useEffect to handle the profile picture after userData is loaded
  useEffect(() => {
    if (!userData) return;
    
    // Check for profile picture URL in user data
    if (userData.profilePictureUrl) {
      // Try to load the image
      const img = new Image();
      img.onload = () => {
        setProfileImageUrl(userData.profilePictureUrl);
      };
      img.onerror = () => {
        console.warn("Failed to load profile picture URL:", userData.profilePictureUrl);
        
        // Try alternate URL formats if available
        if (userData.profilePictureId) {
          const alternateUrl = `${image_url}/images/${userData.profilePictureId}`;
          const altImg = new Image();
          altImg.onload = () => {
            setProfileImageUrl(alternateUrl);
          };
          altImg.onerror = () => {
            const apiUrl = `${base_url}/api/files/getImage/${userData.profilePictureId}`;
            const apiImg = new Image();
            apiImg.onload = () => {
              setProfileImageUrl(apiUrl);
            };
            apiImg.src = apiUrl;
          };
          altImg.src = alternateUrl;
        }
      };
      img.src = userData.profilePictureUrl;
    }
  }, [userData]);

  // Update the fetchUserProfile function to properly get the friends list
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        // Get current user data from localStorage
        const currentUserJSON = localStorage.getItem('userData');
        const sessionId = localStorage.getItem('sessionId');
        
        if (!sessionId) {
          setError('You need to be logged in to view user profiles');
          setLoading(false);
          return;
        }
        
        // Parse current user data from localStorage
        let currentUser = null;
        if (currentUserJSON) {
          currentUser = JSON.parse(currentUserJSON);
          setCurrentUserData(currentUser);
        } else {
          // Your existing mock user code...
          const mockCurrentUser = {
            userEmail: 'current.user@purdue.edu',
            name: 'Current User',
            majors: ['Computer Science', 'Mathematics'],
            weeklyAvailability: '000000001111110000000000000000111111000000000000000011111100000000000000001111110000000000000000111111000000000000001111110000000000000000111111',
            preferredLocations: [1, 2, 15, 25], // WALC, LWSN, HIKS, PMU
            friends: [
              { userEmail: 'alex.thompson@purdue.edu', name: 'Alex Thompson' },
              { userEmail: 'taylor.johnson@purdue.edu', name: 'Taylor Johnson' }
            ]
          };
          setCurrentUserData(mockCurrentUser);
        }

        // Now fetch the current user's friends list using the correct API
        if (currentUser) {
          try {
            console.log(`Fetching friends list for ${currentUser.userEmail}...`);
            const friendsResponse = await axios({
              method: 'GET',
              url: `${base_url}/users/${currentUser.userEmail}/friends`,
              headers: {
                'Session-Id': sessionId
              }
            });
            
            console.log('Friends list API response:', friendsResponse.data);
            
            if (friendsResponse.data) {
              // Update the currentUserData with the actual friends list from API
              setCurrentUserData(prevData => ({
                ...prevData,
                friends: friendsResponse.data
              }));
              
              // Check if the profile user is in the friends list
              const friendsList = friendsResponse.data || [];
              const isAlreadyFriend = friendsList.some(
                friend => friend.userEmail === userEmail || friend.email === userEmail
              );
              console.log(`Is ${userEmail} in friends list from API? ${isAlreadyFriend}`);
              setIsFriend(isAlreadyFriend);
            }
          } catch (friendsError) {
            console.error('Error fetching friends list:', friendsError);
            
            // Display an empty friends list until we can get it from the API
            if (!currentUser.friends) {
              setCurrentUserData(prevData => ({
                ...prevData,
                friends: []
              }));
            }
          }
        }

        // Your existing code to fetch the profile user's data...
        try {
          const response = await axios({
            method: 'GET',
            url: `${base_url}/users/${userEmail}`,
            headers: {
              'Session-Id': sessionId
            }
          });
          
          if (response.data) {
            console.log('User profile API response:', response.data);
            
            const formattedUserData = {
              userEmail: response.data.email || response.data.userEmail,
              name: response.data.name || response.data.fullName,
              majors: response.data.majors || [],
              biography: response.data.biography || response.data.bio || response.data.description,
              weeklyAvailability: response.data.weeklyAvailability,
              preferredLocations: response.data.preferredLocations || [],
              profilePictureUrl: response.data.profilePictureUrl,
              profilePictureId: response.data.profilePictureId,
              role: response.data.role
            };
            
            setUserData(formattedUserData);
            const compatibilityResult = calculateCompatibilityScore(formattedUserData);
            setCompatibilityScore(compatibilityResult);
          } else {
            setError('No user data returned from API');
          }
        } catch (apiError) {
          console.log('API call failed, using mock data:', apiError);
        }
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
        setError('Failed to load user profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, navigate]);

  

  useEffect(() => {
    const fetchUserCourses = async () => {
      if (!userEmail) return;
      
      // Check if we already have courses cached
      if (userCourses.length > 0) return;
      
      setCoursesLoading(true);
      
      try {
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          setCoursesLoading(false);
          return;
        }
        
        const response = await axios({
          method: 'GET',
          url: `${base_url}/users/${userEmail}/courses`,
          headers: { 'Session-Id': sessionId }
        });
        
        if (Array.isArray(response.data)) {
          setUserCourses(response.data);
        } else if (response.data && Array.isArray(response.data.courses)) {
          setUserCourses(response.data.courses);
        } else {
          setUserCourses([]);
        }
      } catch (error) {
        console.error('Error fetching user courses:', error);
        setUserCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    };
    
    fetchUserCourses();
  }, [userEmail, userCourses.length]);

  const calculateCompatibilityScore = useCallback((profileData) => {
    if (!currentUserData || !profileData) {
      console.log("Missing data for compatibility calculation");
      return { percentage: 0, factors: [] };
    }
  
    console.log("Calculating compatibility with:", profileData);
    
    let score = 0;
    const factors = [];
    
    // 1. Course matching (up to 40%)
    const userCourseIds = userCourses.map(course => 
      typeof course === 'string' ? course : course.courseId || course.id
    );
    
    const currentUserCourseIds = currentUserData.courses || [];
    const commonCourses = userCourseIds.filter(course => 
      currentUserCourseIds.includes(course)
    );
    
    if (commonCourses.length > 0) {
      const courseScore = Math.min(40, commonCourses.length * 10);
      score += courseScore;
      factors.push(
        `You share ${commonCourses.length} course${commonCourses.length > 1 ? 's' : ''}`
      );
    }
    
    // 2. Location matching (up to 25%)
    const userLocations = profileData.preferredLocations || [];
    const currentUserLocations = currentUserData.preferredLocations || [];
    
    const commonLocations = userLocations.filter(location => 
      currentUserLocations.includes(location)
    );
    
    if (commonLocations.length > 0) {
      const locationScore = Math.min(25, commonLocations.length * 8);
      score += locationScore;
      factors.push(
        `You have ${commonLocations.length} shared preferred study location${commonLocations.length > 1 ? 's' : ''}`
      );
    }
    
    // 3. Availability matching (up to 35%)
    if (profileData.weeklyAvailability && currentUserData.weeklyAvailability) {
      let matchingHours = 0;
      const userAvail = profileData.weeklyAvailability;
      const currentUserAvail = currentUserData.weeklyAvailability;
      
      // Count hours where both are available
      for (let i = 0; i < Math.min(userAvail.length, currentUserAvail.length); i++) {
        if (userAvail[i] === '1' && currentUserAvail[i] === '1') {
          matchingHours++;
        }
      }
      
      // Calculate percentage of matching hours relative to total hours in a week
      const availabilityScore = Math.min(35, Math.floor((matchingHours / 24) * 35));
      
      if (matchingHours > 0) {
        score += availabilityScore;
        const matchingHoursPerDay = Math.floor(matchingHours / 7);
        factors.push(
          `You have approximately ${matchingHours} overlapping available hours${
            matchingHoursPerDay > 0 ? ` (about ${matchingHoursPerDay} hours/day on average)` : ''
          }`
        );
      }
    }
    
    // If there are no factors but we have some data, add a generic factor
    if (factors.length === 0 && score > 0) {
      factors.push("You have some study preferences in common");
    }
    
    return {
      percentage: Math.min(100, Math.round(score)),
      factors: factors.length > 0 ? factors : ["No compatibility factors found"]
    };
  }, [currentUserData, userCourses]); // Include dependencies that the calculation needs

  useEffect(() => {
    if (userData && currentUserData && userCourses.length > 0) {
      const score = calculateCompatibilityScore(userData);
      setCompatibilityScore(score);
    }
  }, [userData, currentUserData, userCourses, calculateCompatibilityScore]);

  // Update the handleAddFriend function with better error handling
  const handleAddFriend = async () => {
    if (!currentUserData || !userData) return;

    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        toast.error("You need to be logged in to add friends");
        navigate('/');
        return;
      }

      // Set request status to pending immediately for better UX
      setFriendRequestStatus('pending');
      
      try {
        await axios({
          method: 'POST',
          url: `${base_url}/users/${currentUserData.userEmail}/friend-requests/send`,
          headers: {
            'Content-Type': 'application/json',
            'Session-Id': sessionId
          },
          data: {
            receiverEmail: userData.userEmail
          }
        });

        // Success case
        toast.success(`Friend request sent to ${userData.name}!`);
        console.log(`Friend request sent to ${userData.name}`);
        
      } catch (error) {
        console.error('Error adding friend:', error);
        
        // Special handling for 500 errors which may indicate an already sent request
        if (error.response && error.response.status === 500) {
          // Keep the pending status since the request might already exist
          toast.info(`A friend request to ${userData.name} may already be pending.`);
        } else if (error.response && error.response.status === 409) {
          // Specific error for duplicate requests
          toast.info(`You already have a pending request to ${userData.name}.`);
        } else {
          // For other errors, reset the status and show error
          setFriendRequestStatus('none');
          toast.error(`Error sending friend request. Please try again later.`);
        }
      }
    } catch (error) {
      console.error('Unexpected error in handleAddFriend:', error);
      toast.error('Something went wrong. Please try again later.');
      setFriendRequestStatus('none');
    }
  };

  const handleMessageUser = async () => {
    const sessionId = localStorage.getItem("sessionId");

    try {
      await axios.post(
          `${base_url}/conversations/create/${userData.userEmail}`,
          {},
          { headers: { "Session-Id": sessionId } }
      );
      navigate(`/messaging?user=${userData.userEmail}`);
    } catch (err) {
      console.error("Failed to start conversation", err);
      alert("Could not start conversation.");
    }
  };

  // Update the handleRemoveFriend function
  const handleRemoveFriend = async () => {
    if (!currentUserData || !userData) return;

    // Use toast confirmation instead of window.confirm
    toast.info(
      <div>
        <p>Are you sure you want to remove <strong>{userData.name}</strong> from your friends?</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <button
            onClick={() => {
              toast.dismiss();
              performFriendRemoval();
            }}
            style={{ padding: '6px 14px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Remove
          </button>
          <button
            onClick={() => toast.dismiss()}
            style={{ padding: '6px 14px', background: '#e0e0e0', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeButton: false,
        closeOnClick: false
      }
    );
    
    // Separate function to perform the actual removal
    const performFriendRemoval = async () => {
      try {
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          navigate('/');
          return;
        }

        // Show loading toast
        const loadingToastId = toast.loading(`Removing ${userData.name} from your friends...`);
        
        try {
          await axios({
            method: 'DELETE',
            url: `${base_url}/users/${currentUserData.userEmail}/friends/${userData.userEmail}`,
            headers: {
              'Content-Type': 'application/json',
              'Session-Id': sessionId
            }
          });

          console.log(`Friend ${userData.name} successfully removed`);
          
          // Set local state
          setIsFriend(false);
          
          // Update currentUserData (keep this code as is)
          setCurrentUserData(prevData => {
            if (!prevData || !prevData.friends) return prevData;
            
            const updatedFriends = prevData.friends.filter(
              friend => friend.userEmail !== userData.userEmail && friend.email !== userData.userEmail
            );
            
            console.log('Updated friends list after removal:', updatedFriends);
            return {
              ...prevData,
              friends: updatedFriends
            };
          });
          
          // Update localStorage (keep this code as is)
          try {
            const storedUserData = JSON.parse(localStorage.getItem('userData'));
            if (storedUserData && Array.isArray(storedUserData.friends)) {
              const updatedFriends = storedUserData.friends.filter(
                friend => friend.userEmail !== userData.userEmail && friend.email !== userData.userEmail
              );
              
              const updatedUserData = {
                ...storedUserData,
                friends: updatedFriends
              };
              
              localStorage.setItem('userData', JSON.stringify(updatedUserData));
              console.log('Updated localStorage userData');
            }
          } catch (localStorageError) {
            console.error('Error updating localStorage:', localStorageError);
          }
          
          // Update toast to success
          toast.update(loadingToastId, {
            render: `${userData.name} has been removed from your friends.`,
            type: toast.TYPE.SUCCESS,
            isLoading: false,
            autoClose: 3000,
            closeButton: true
          });
        } catch (error) {
          console.error('Error removing friend:', error);
          
          // For demo mode, still update UI and show success toast
          setIsFriend(false);
          
          // Update currentUserData in demo mode too
          setCurrentUserData(prevData => {
            if (!prevData || !prevData.friends) return prevData;
            
            const updatedFriends = prevData.friends.filter(
              friend => friend.userEmail !== userData.userEmail && friend.email !== userData.userEmail
            );
            return {
              ...prevData,
              friends: updatedFriends
            };
          });
          
          toast.update(loadingToastId, {
            render: `${userData.name} has been removed from your friends. (Demo mode)`,
            type: toast.TYPE.INFO,
            isLoading: false,
            autoClose: 3000,
            closeButton: true
          });
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('Something went wrong. Please try again later.');
      }
    };
  };

  const handleCancelRequest = async () => {
    if (!currentUserData || !userData) return;

    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        toast.error("You need to be logged in to cancel friend requests");
        navigate('/');
        return;
      }

      // Show loading toast
      const loadingToastId = toast.loading(`Cancelling friend request to ${userData.name}...`);
      
      try {
        await axios({
          method: 'DELETE',
          url: `${base_url}/users/${currentUserData.userEmail}/friend-requests/cancel`,
          headers: {
            'Content-Type': 'application/json',
            'Session-Id': sessionId
          },
          data: {
            receiverEmail: userData.userEmail
          }
        });

        console.log(`Friend request to ${userData.name} successfully cancelled`);
        
        // Update state
        setFriendRequestStatus('none');
        
        // Update toast to success
        toast.update(loadingToastId, {
          render: `Friend request to ${userData.name} has been cancelled.`,
          type: toast.TYPE.SUCCESS,
          isLoading: false,
          autoClose: 3000,
          closeButton: true
        });
      } catch (error) {
        console.error('Error cancelling friend request:', error);
        
        // Update toast to error
        toast.update(loadingToastId, {
          render: `Failed to cancel friend request to ${userData.name}. Please try again later.`,
          type: toast.TYPE.ERROR,
          isLoading: false,
          autoClose: 3000,
          closeButton: true
        });
      }
    } catch (error) {
      console.error('Unexpected error in handleCancelRequest:', error);
      toast.error('Something went wrong. Please try again later.');
    }
  };

  // Update handleBackClick function to use history if available
  const handleBackClick = () => {
    // Check if we came from somewhere in the app
    if (window.history.length > 2) {
      navigate(-1); // Go back one page in history
    } else {
      navigate('/friends'); // Fall back to friends page
    }
  };

  const AvailabilityGrid = useMemo(() => {
    if (!userData?.weeklyAvailability) return null;
    
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, dayIndex) => (
      <div key={day} className="user-day-row">
        <span className="user-day-name">{day}</span>
        <div className="user-hour-blocks">
          {Array.from({ length: 24 }, (_, hourIndex) => {
            const stringIndex = dayIndex * 24 + hourIndex;
            const userAvailable = userData.weeklyAvailability[stringIndex] === '1';
            const currentUserAvailable = currentUserData?.weeklyAvailability?.[stringIndex] === '1';
            
            let blockClass = 'user-hour-block';
            if (showAvailabilityComparison) {
              if (userAvailable && currentUserAvailable) blockClass += ' both-available';
              else if (userAvailable) blockClass += ' they-available';
              else if (currentUserAvailable) blockClass += ' you-available';
            } else if (userAvailable) {
              blockClass += ' available';
            }
            
            return (
              <div 
                key={hourIndex} 
                className={blockClass}
                title={`${day} ${hourIndex}:00-${hourIndex+1}:00`}
              />
            );
          })}
        </div>
      </div>
    ));
  }, [userData?.weeklyAvailability, currentUserData?.weeklyAvailability, showAvailabilityComparison]);

  if (loading) {
    return (
      <div className="user-profile-page">
        <button disabled className="back-button skeleton-back-button">
          &larr; Back to Friends
        </button>
        
        <div className="user-profile-header skeleton-header">
          <div className="user-profile-image-container skeleton-image"></div>
          <div className="user-profile-top-info">
            <div className="user-nametag-container">
              <div className="skeleton-text skeleton-name"></div>
              <div className="user-tags">
                <span className="skeleton-tag"></span>
                <span className="skeleton-tag"></span>
              </div>
            </div>
            <div className="user-actions">
              <div className="skeleton-button"></div>
              <div className="skeleton-button"></div>
            </div>
          </div>
        </div>
        
        <div className="skeleton-compatibility"></div>
        
        <div className="user-content-grid">
          <div className="user-description-card">
            <h3>About</h3>
            <div className="skeleton-text skeleton-paragraph"></div>
            <div className="skeleton-text skeleton-paragraph"></div>
          </div>
          
          <div className="user-availability-card">
            <h3>Availability</h3>
            <div className="skeleton-availability"></div>
          </div>
          
          <div className="user-locations-card">
            <h3>Preferred Study Locations</h3>
            <div className="skeleton-locations">
              <div className="skeleton-location"></div>
              <div className="skeleton-location"></div>
              <div className="skeleton-location"></div>
            </div>
          </div>
          
          <div className="user-common-card">
            <h3>Common Groups</h3>
            <div className="skeleton-common-list"></div>
          </div>

          <div className="user-courses-card">
            <h3>Courses</h3>
            <div className="skeleton-courses">
              <div className="skeleton-course"></div>
              <div className="skeleton-course"></div>
              <div className="skeleton-course"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="user-profile-page error">
        <h2>Error</h2>
        <p>{error || "User not found"}</p>
        <button onClick={handleBackClick} className="back-button">
          Back to Friends
        </button>
      </div>
    );
  }

  const getLocationName = (locationId) => {
    const locationNames = {
      1: "WALC", 2: "LWSN", 3: "PMUC", 4: "HAMP", 5: "RAWL",
      6: "CHAS", 7: "CL50", 8: "FRNY", 9: "KRAN", 10: "MSEE",
      11: "MATH", 12: "PHYS", 13: "POTR", 14: "HAAS", 15: "HIKS",
      16: "BRWN", 17: "HEAV", 18: "BRNG", 19: "SC", 20: "WTHR",
      21: "UNIV", 22: "YONG", 23: "ME", 24: "ELLT", 25: "PMU", 26: "STEW"
    };
    return typeof locationId === 'number' ? locationNames[locationId] : locationId;
  };

  return (
    <div className="user-profile-page">
      <button onClick={handleBackClick} className="back-button">
        &larr; Back to Friends
      </button>
      
      <div className="user-profile-header">
        <div className="user-profile-image-container">
          <img 
            src={profileImageUrl} 
            alt={userData.name} 
            className="user-profile-image" 
            onError={(e) => {
              console.warn('Failed to load profile image, falling back to default');
              e.target.onerror = null; // Prevent infinite error loop
              e.target.src = profileImage; // Fall back to default
            }}
          />
        </div>
        
        <div className="user-profile-top-info">
          <div className="user-nametag-container">
            <h2 className="user-name">{userData.name}</h2>
            <div className="user-tags">
              {userData.majors?.map((major, index) => (
                <span key={index} className="user-tag">{major}</span>
              )) || <span className="user-tag">No major listed</span>}
            </div>

            {/* Add role badge here */}
            {userData.role && (
              <div className="user-role-badge">
                <span className={`role-indicator ${userData.role.toLowerCase()}`}>
                  {userData.role === 'GTA' ? 'Graduate TA' : 
                  userData.role === 'UTA' ? 'Undergraduate TA' : 
                  userData.role}
                </span>
              </div>
            )}

            {/* Friend relationship status indicator */}
            {isFriend && (
              <div className="friend-status-indicator">
                <i className="fa fa-check-circle"></i>
                <span>Friends since {new Date().toLocaleDateString()}</span>
              </div>
            )}
            {friendRequestStatus === 'pending' && (
              <div className="friend-request-indicator">
                <i className="fa fa-clock-o"></i>
                <span>Request pending</span>
              </div>
            )}
          </div>
          
          <div className="user-actions">
            {isFriend ? (
              <div className="friend-actions-container">
                <button className="message-button" onClick={handleMessageUser}>
                  <i className="fa fa-envelope"></i> Message
                </button>
                <button className="remove-friend-button" onClick={handleRemoveFriend}>
                  <i className="fa fa-user-times"></i> Remove Friend
                </button>
              </div>
            ) : friendRequestStatus === 'pending' ? (
              <div className="pending-request-container">
                <button className="cancel-request-button" onClick={handleCancelRequest}>
                  <i className="fa fa-times"></i> Cancel Request
                </button>
                <div className="request-time-indicator">Sent recently</div>
              </div>
            ) : (
              <div className="add-friend-container">
                <button className="add-friend-button" onClick={handleAddFriend}>
                  <i className="fa fa-user-plus"></i> Add Friend
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {compatibilityScore ? (
        <div className="compatibility-section">
          <h3>
            Study Compatibility
            <InfoTooltip 
              content={
                <div>
                  <p><strong>How is compatibility calculated?</strong></p>
                  <ul>
                    <li><strong>Courses (40%):</strong> Matching courses you&apos;re both taking</li>
                    <li><strong>Locations (25%):</strong> Shared preferred study locations</li>
                    <li><strong>Availability (35%):</strong> Overlapping free time slots</li>
                  </ul>
                  <p>Higher scores mean better potential study partners!</p>
                </div>
              }
            />
          </h3>
          <div className="compatibility-score">
            <div 
              className="score-circle"
              title={`${compatibilityScore.percentage}% compatibility score`} 
              style={{ 
                '--final-gradient': `conic-gradient(
                  #8ebd89 ${compatibilityScore.percentage || 0}%, 
                  #e0e0e0 ${compatibilityScore.percentage || 0}%
                )`,
                background: compatibilityScore.percentage > 0 ? 
                  `conic-gradient(#8ebd89 ${compatibilityScore.percentage}%, #e0e0e0 ${compatibilityScore.percentage}%)` : 
                  'conic-gradient(#e0e0e0 100%, #e0e0e0 100%)'
              }}
            >
              <span>{compatibilityScore.percentage || 0}%</span>
            </div>
            <div className="compatibility-factors">
              {compatibilityScore.factors && compatibilityScore.factors.length > 0 ? (
                <>
                  <p>
                    You and {userData.name} are compatible because:
                    <InfoTooltip 
                      content={
                        <p>These factors contribute to your overall compatibility score with this user.</p>
                      }
                    />
                  </p>
                  <ul>
                    {compatibilityScore.factors.map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="no-factors">
                  You don&apos;t have any matching study preferences yet.
                  <InfoTooltip 
                    content={
                      <p>Add similar courses, study locations, or availability times to improve compatibility.</p>
                    }
                  />
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
      
      <div className="user-content-grid">
        <div className="user-description-card">
          <h3>About</h3>
          <p>{userData.biography || "This user hasn't added a description yet."}</p>
        </div>
        
        <div className="user-availability-card">
          <div className="availability-header">
            <h3>Availability</h3>
            {userData.weeklyAvailability && currentUserData?.weeklyAvailability && (
              <button 
                className="comparison-toggle" 
                onClick={debouncedToggleAvailability} // Use the debounced version instead
              >
                {showAvailabilityComparison ? 'Hide Comparison' : 'Compare With Yours'}
              </button>
            )}
          </div>
          
          <div className="user-availability-visual">
            {AvailabilityGrid}
            {userData?.weeklyAvailability && (
              <AvailabilityLegend
                key={`legend-${showAvailabilityComparison}`}
                showComparison={showAvailabilityComparison}
                userName={userData.name}
              />
            )}
          </div>
        </div>
        
        <div className="user-locations-card">
          <h3>Preferred Study Locations</h3>
          <div className="user-locations-list">
            {userData.preferredLocations?.length > 0 ? (
              userData.preferredLocations.map((locationId, index) => (
                <div key={index} className="user-location">
                  <span className="location-icon">📍</span>
                  <span className="user-location-name">{getLocationName(locationId)}</span>
                </div>
              ))
            ) : (
              <p className="no-data-message">No preferred locations shared</p>
            )}
          </div>
        </div>
        
        <div className="user-common-card">
          <h3>User&apos;s Groups</h3>
          <div className="user-common-list">
            <p className="no-data-message">This user hasn&apos;t joined any groups yet!</p>
          </div>
        </div>

        <div className="user-courses-card">
          <h3>Courses</h3>
          {coursesLoading ? (
            <div className="courses-loading">
              <div className="skeleton-courses">
                <div className="skeleton-course"></div>
                <div className="skeleton-course"></div>
                <div className="skeleton-course"></div>
              </div>
            </div>
          ) : (
            <div className="user-courses-list">
              {userCourses.length > 0 ? (
                userCourses.map((course, index) => {
                  const courseId = typeof course === 'string' ? course : course.courseId || course.id;
                  const isCommon = currentUserData?.courses?.includes(courseId);
                  
                  return (
                    <div key={index} className={`user-course-item ${isCommon ? 'common-course' : ''}`}>
                      <span className="course-icon">📚</span>
                      <p className="user-course-name">
                        {courseId}
                        {course.courseName && courseId !== course.courseName && (
                          <span className="user-course-full-name"> - {course.courseName}</span>
                        )}
                      </p>
                      {isCommon && (
                        <span className="common-course-badge" title="You're both taking this course">
                          Shared 👥
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="no-data-message">This user hasn&apos;t added any courses yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add the ToastContainer */}
      <ToastContainer
        position="bottom-left"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default UsrProfile;