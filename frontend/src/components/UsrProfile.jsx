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

  // Replace your current useEffect function with this one
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
        
        // For demo purposes, create a mock current user if none exists
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
        
        // Determine if we're using email or ID for the user parameter
        
        if (currentUserJSON) {
          const parsedUser = JSON.parse(currentUserJSON);
          setCurrentUserData(parsedUser);
          
          // Check if this user is already a friend
          const isAlreadyFriend = parsedUser.friends?.some(
            friend => friend.userEmail === userEmail
          );
          setIsFriend(isAlreadyFriend);
        } else {
          // Use mock current user for demo
          setCurrentUserData(mockCurrentUser);
          setIsFriend(mockCurrentUser.friends.some(
            friend => friend.userEmail === userEmail
          ));
        }

        try {
          // Using the API format provided in the curl example
          const response = await axios({
            method: 'GET',
            url: `http://localhost:8080/users/${userEmail}`,
            headers: {
              'Session-Id': sessionId
            }
          });
          
          if (response.data) {
            console.log('User profile API response:', response.data);
            
            // Format the API response to match your expected data structure
            const formattedUserData = {
              userEmail: response.data.email || response.data.userEmail,
              name: response.data.name || response.data.fullName,
              majors: response.data.majors || [],
              biography: response.data.biography || response.data.bio || response.data.description,
              weeklyAvailability: response.data.weeklyAvailability,
              preferredLocations: response.data.preferredLocations || [],
              // Any other fields you expect
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
        console.error('Error fetching user profile:', error);
        setError('Failed to load user profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, navigate]);

  // Calculate compatibility between current user and profile user
  const calculateCompatibility = (profileData) => {
    if (!currentUserData) return;

    let score = 0;
    const factors = [];

    // Check for shared majors (high weight)
    const currentMajors = currentUserData.majors || [];
    const profileMajors = profileData.majors || [];
    
    const sharedMajors = currentMajors.filter(major => 
      profileMajors.includes(major)
    );
    
    if (sharedMajors.length > 0) {
      score += 40;
      factors.push(`Same major: +40%`);
    }

    // Check for matching availability (medium-high weight)
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

    // Check for shared preferred locations (medium weight)
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

    // Calculate final compatibility percentage
    const compatibilityResult = {
      percentage: Math.min(100, score),
      factors: factors
    };

    setCompatibilityScore(compatibilityResult);
  };

  // Update handleAddFriend function
  const handleAddFriend = async () => {
    if (!currentUserData || !userData) return;

    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        navigate('/');
        return;
      }

      // Using the same format as in Friends.jsx
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

      // Update UI optimistically
      setIsFriend(true);
      
      // Use modern feedback mechanism instead of alert
      // If you have toast already set up:
      // toast.success(`Friend request sent to ${userData.name}!`);
      alert(`Friend request sent to ${userData.name}!`);
      
    } catch (error) {
      console.error('Error adding friend:', error);
      
      // For demonstration purposes, update the UI anyway
      setIsFriend(true);
      alert(`Friend request sent to ${userData.name}! (Demo mode)`);
    }
  };

  // Update handleRemoveFriend function
  const handleRemoveFriend = async () => {
    if (!currentUserData || !userData) return;

    // Confirm before removing
    if (!window.confirm(`Are you sure you want to remove ${userData.name} from your friends?`)) {
      return;
    }

    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        navigate('/');
        return;
      }

      // Using the same format as in Friends.jsx
      await axios({
        method: 'DELETE',
        url: `http://localhost:8080/users/${currentUserData.userEmail}/friends/${userData.userEmail}`,
        headers: {
          'Content-Type': 'application/json',
          'Session-Id': sessionId
        }
      });

      // Update UI
      setIsFriend(false);
      
      // Use modern feedback mechanism instead of alert
      // toast.success(`${userData.name} has been removed from your friends.`);
      alert(`${userData.name} has been removed from your friends.`);
      
    } catch (error) {
      console.error('Error removing friend:', error);
      
      // For demonstration purposes, update the UI anyway
      setIsFriend(false);
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

  /*{compatibilityScore && (
    <div className="compatibility-section">
      <h3>Compatibility</h3>
      <div className="compatibility-score">
        <div className="score-circle" style={{
          background: `conic-gradient(#8ebd89 ${compatibilityScore.percentage}%, #e0e0e0 0)`
        }}>
          <span>{compatibilityScore.percentage}%</span>
        </div>
        <div className="compatibility-factors">
          <p>Why you&apos;re compatible:</p>
          <ul>
            {compatibilityScore.factors.length > 0 ? (
              compatibilityScore.factors.map((factor, index) => (
                <li key={index}>{factor}</li>
              ))
            ) : (
              <li>No compatibility factors found</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )} */

  // Helper function to get location names from IDs
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
            {isFriend ? (
              <button className="remove-friend-button" onClick={handleRemoveFriend}>
                <i className="fa fa-user-times"></i> Remove Friend
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
            {/* This would come from API in real implementation */}
            <p className="no-data-message">This user hasn&apos;t joined any groups yet!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsrProfile;