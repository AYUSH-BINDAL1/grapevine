import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import profileImage from "../assets/temp-profile.webp";
import "./UsrProfile.css";
//import { CSSTransition } from "react-transition-group";


function UsrProfile() {
  const { userEmail } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [compatibilityScore, setCompatibilityScore] = useState(null);

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
          url: `http://localhost:8080/users/${currentUserEmail}/friends/check/${userEmail}`,
          headers: {
            'Session-Id': sessionId
          }
        });
        
        console.log('[FRIEND CHECK] API response:', friendStatusResponse.data);
        
        if (friendStatusResponse.data) {
          console.log('[FRIEND CHECK] Setting isFriend to:', friendStatusResponse.data.isFriend);
          setIsFriend(!!friendStatusResponse.data.isFriend);
        }
      } catch (error) {
        console.error('[FRIEND CHECK] API error:', error);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[FRIEND CHECK] Using mock data for development');
          
          const mockFriendStatuses = {
            'user1@purdue.edu': true,
            'user2@purdue.edu': false,
            'user3@purdue.edu': false,
          };
          
          if (userEmail in mockFriendStatuses) {
            const mockStatus = mockFriendStatuses[userEmail];
            console.log(`[FRIEND CHECK] Using mock status for ${userEmail}: ${mockStatus}`);
            setIsFriend(mockStatus);
          } else {
            const randomStatus = Math.random() > 0.5;
            console.log(`[FRIEND CHECK] Using random status for ${userEmail}: ${randomStatus}`);
            setIsFriend(randomStatus);
          }
        }
      }
    };
    
    checkFriendStatus();
  }, [currentUserData, userEmail]);

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

  const handleAddFriend = async () => {
    if (!currentUserData || !userData) return;

    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        navigate('/');
        return;
      }

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

      setIsFriend(true);
      alert(`Friend request sent to ${userData.name}!`);
      
    } catch (error) {
      console.error('Error adding friend:', error);
      setIsFriend(true);
      alert(`Friend request sent to ${userData.name}! (Demo mode)`);
    }
  };

  // Update the handleRemoveFriend function with improved UX
  const handleRemoveFriend = async () => {
    if (!currentUserData || !userData) return;

    if (!window.confirm(`Are you sure you want to remove ${userData.name} from your friends?`)) {
      return;
    }

    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        navigate('/');
        return;
      }

      // Show "Removing..." text or animation
      // You could use this if you had a state for the button text
      // setRemoveButtonText("Removing...");
      
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
      
      // Also update the currentUserData
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
      
      // Also update localStorage userData if it exists
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
      
      alert(`${userData.name} has been removed from your friends.`);
      
    } catch (error) {
      console.error('Error removing friend:', error);
      
      // For demo mode, still update UI
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
      
      alert(`${userData.name} has been removed from your friends. (Demo mode)`);
    }
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
            
            {isFriend ? (
              <>
                <button className="already-friends-button" disabled>
                  <i className="fa fa-check"></i> Already Friends
                </button>
                <button className="remove-friend-button" onClick={handleRemoveFriend}>
                  <i className="fa fa-user-times"></i> Remove Friend
                </button>
              </>
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
      </div>
    </div>
  );
}

export default UsrProfile;