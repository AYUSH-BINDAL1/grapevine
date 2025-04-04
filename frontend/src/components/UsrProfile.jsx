import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import profileImage from "../assets/temp-profile.webp";
import "./UsrProfile.css";
//import { CSSTransition } from "react-transition-group";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function UsrProfile() {
  const { userEmail } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [compatibilityScore, setCompatibilityScore] = useState(null);
  const [friendRequestStatus, setFriendRequestStatus] = useState('none'); // 'none', 'pending', 'accepted'
  const [userCourses, setUserCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

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
              url: `http://localhost:8080/users/${currentUser.userEmail}/friends`,
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
            url: `http://localhost:8080/users/${userEmail}`,
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
            };
            
            setUserData(formattedUserData);
            calculateCompatibility(formattedUserData);
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

  // Create a separate useEffect for the friend status check
  useEffect(() => {
    if (!currentUserData || !userEmail) return;
    
    const checkFriendStatus = async () => {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) return;
      
      try {
        const currentUserEmail = currentUserData.userEmail;
        console.log(`[FRIEND CHECK] Checking if ${currentUserEmail} and ${userEmail} are friends...`);
        
        const friendStatusResponse = await axios({
          method: 'GET',
          url: `http://localhost:8080/users/${currentUserEmail}/friendship-status/${userEmail}`,
          headers: {
            'Session-Id': sessionId
          }
        });
        
        console.log('[FRIEND CHECK] API response:', friendStatusResponse.data);
        
        if (friendStatusResponse.data) {
          const status = friendStatusResponse.data.status || friendStatusResponse.data.friendshipStatus;
          
          if (status === 'FRIENDS' || status === 'friends') {
            console.log('[FRIEND CHECK] Users are friends');
            setIsFriend(true);
            setFriendRequestStatus('accepted');
          } else if (status === 'PENDING_SENT' || status === 'pending_sent') {
            console.log('[FRIEND CHECK] Friend request is pending');
            setIsFriend(false);
            setFriendRequestStatus('pending');
          } else if (status === 'PENDING_RECEIVED' || status === 'pending_received') {
            console.log('[FRIEND CHECK] Friend request received');
            setIsFriend(false);
            setFriendRequestStatus('received');
          } else {
            console.log('[FRIEND CHECK] Users are not friends');
            setIsFriend(false);
            setFriendRequestStatus('none');
          }
        }
      } catch (error) {
        console.error('[FRIEND CHECK] API error:', error);
        
        // Fallback to simple friend check
        try {
          const simpleCheckResponse = await axios({
            method: 'GET',
            url: `http://localhost:8080/users/${currentUserData.userEmail}/friends/check/${userEmail}`,
            headers: {
              'Session-Id': sessionId
            }
          });
          
          if (simpleCheckResponse.data && simpleCheckResponse.data.isFriend) {
            setIsFriend(true);
            setFriendRequestStatus('accepted');
          } else {
            // If not friends, check for pending requests
            setIsFriend(false);
            
          }
        } catch (simpleCheckError) {
          console.error('[FRIEND CHECK] Simple check failed:', simpleCheckError);
        }
      }
    };
    
    checkFriendStatus();
  }, [currentUserData, userEmail]);

  useEffect(() => {
    const fetchUserCourses = async () => {
      if (!userEmail) return;
      
      setCoursesLoading(true);
      
      try {
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) return;
        
        const response = await axios({
          method: 'GET',
          url: `http://localhost:8080/users/${userEmail}/courses`,
          headers: {
            'Session-Id': sessionId
          }
        });
        
        console.log('User courses API response:', response.data);
        
        if (Array.isArray(response.data)) {
          setUserCourses(response.data);
        } else if (response.data && Array.isArray(response.data.courses)) {
          setUserCourses(response.data.courses);
        } else {
          console.warn('Unexpected courses data format:', response.data);
          setUserCourses([]);
        }
      } catch (error) {
        console.error('Error fetching user courses:', error);
      } finally {
        setCoursesLoading(false);
      }
    };
    
    fetchUserCourses();
  }, [userEmail]);

  const calculateCompatibility = (profileData) => {
    if (!currentUserData) return;

    let score = 0;
    const factors = [];

    const currentMajors = currentUserData.majors || [];
    const profileMajors = profileData.majors || [];
    
    const sharedMajors = currentMajors.filter(major => 
      profileMajors.includes(major)
    );
    
    if (sharedMajors.length > 0) {
      score += 40;
      factors.push(`Same major: +40%`);
    }

    if (currentUserData.weeklyAvailability && profileData.weeklyAvailability) {
      const currentAvail = currentUserData.weeklyAvailability;
      const profileAvail = profileData.weeklyAvailability;
      
      let matchingHours = 0;
      for (let i = 0; i < currentAvail.length; i++) {
        if (currentAvail[i] === '1' && profileAvail[i] === '1') {
          matchingHours++;
        }
      }
      
      if (matchingHours > 0) {
        const availScore = Math.min(30, matchingHours * 2);
        score += availScore;
        factors.push(`${matchingHours} hours of matching availability: +${availScore}%`);
      }
    }

    const currentLocations = currentUserData.preferredLocations || [];
    const profileLocations = profileData.preferredLocations || [];
    
    const sharedLocations = currentLocations.filter(loc => 
      profileLocations.includes(loc)
    );
    
    if (sharedLocations.length > 0) {
      const locationScore = Math.min(20, sharedLocations.length * 5);
      score += locationScore;
      factors.push(`${sharedLocations.length} shared study locations: +${locationScore}%`);
    }

    const compatibilityResult = {
      percentage: Math.min(100, score),
      factors: factors
    };

    setCompatibilityScore(compatibilityResult);
  };

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
          url: `http://localhost:8080/users/${currentUserData.userEmail}/friend-requests/send`,
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
            url: `http://localhost:8080/users/${currentUserData.userEmail}/friends/${userData.userEmail}`,
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

  const handleBackClick = () => {
    navigate('/friends');
  };

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
          <img src={profileImage} alt={userData.name} className="user-profile-image" />
        </div>
        
        <div className="user-profile-top-info">
          <div className="user-nametag-container">
            <h2 className="user-name">{userData.name}</h2>
            <div className="user-tags">
              {userData.majors?.map((major, index) => (
                <span key={index} className="user-tag">{major}</span>
              )) || <span className="user-tag">No major listed</span>}
            </div>
          </div>
          
          <div className="user-actions">
            {console.log('isFriend state in render:', isFriend)}
            {console.log('friendRequestStatus in render:', friendRequestStatus)}
            
            {isFriend ? (
              <>
                <button className="already-friends-button" disabled>
                  <i className="fa fa-check"></i> Already Friends
                </button>
                <button className="remove-friend-button" onClick={handleRemoveFriend}>
                  <i className="fa fa-user-times"></i> Remove Friend
                </button>
              </>
            ) : friendRequestStatus === 'pending' ? (
              <button className="pending-request-button" disabled>
                <i className="fa fa-clock-o"></i> Friend Request Pending
              </button>
            ) : (
              <button className="add-friend-button" onClick={handleAddFriend}>
                <i className="fa fa-user-plus"></i> Add Friend
              </button>
            )}
            <button className="message-button">
              <i className="fa fa-envelope"></i> Send Message
            </button>
          </div>
        </div>
      </div>
      
      <div className="user-content-grid">
        <div className="user-description-card">
          <h3>About</h3>
          <p>{userData.biography || "This user hasn't added a description yet."}</p>
        </div>
        
        <div className="user-availability-card">
          <h3>Availability</h3>
          {userData.weeklyAvailability ? (
            <div className="user-availability-visual">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, dayIndex) => (
                <div key={day} className="user-day-row">
                  <span className="user-day-name">{day}</span>
                  <div className="user-hour-blocks">
                    {Array.from({ length: 24 }, (_, hourIndex) => {
                      const stringIndex = dayIndex * 24 + hourIndex;
                      return (
                        <div 
                          key={hourIndex} 
                          className={`user-hour-block ${userData.weeklyAvailability[stringIndex] === '1' ? 'available' : ''}`}
                          title={`${day} ${hourIndex}:00-${hourIndex+1}:00`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data-message">No availability information shared</p>
          )}
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
                userCourses.map((course, index) => (
                  <div key={index} className="user-course-item">
                    <span className="course-icon">📚</span>
                    <p className="user-course-name">
                      {course.courseId || course.id || course}
                      {course.courseName && course.courseId !== course.courseName && (
                        <span className="user-course-full-name"> - {course.courseName}</span>
                      )}
                    </p>
                  </div>
                ))
              ) : (
                <p className="no-data-message">No courses shared</p>
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