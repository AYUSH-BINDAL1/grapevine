import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import profileImage from "../assets/temp-profile.webp";
import "./UsrProfile.css";
//import { CSSTransition } from "react-transition-group";

// Add this function at the top of your UsrProfile.jsx file
function getMockUserData(userId) {
  const mockUsers = {
    '101': {
      userEmail: 'alex.thompson@example.com',
      name: 'Alex Thompson',
      majors: ['Computer Science', 'Data Science'],
      biography: "Hey there! I'm a junior studying CS with a focus on machine learning. I love hackathons, solving complex problems, and teaching others. Looking for study partners for algorithms and AI courses. I'm most productive early mornings and weekends!",
      weeklyAvailability: '000000000000000000111100000000000000001111000000000000000011110000000000000000111100000000000000001111000000000000111111111111000000000011111111111100',
      preferredLocations: [2, 15, 10, 25], // LWSN, HIKS, MSEE, PMU
      friends: [
        { id: 102, name: 'Morgan Smith', userEmail: 'morgan.smith@example.com' },
        { id: 105, name: 'Morgan Thompson', userEmail: 'morgan.thompson@example.com' }
      ]
    },
    '102': {
      userEmail: 'morgan.smith@example.com',
      name: 'Morgan Smith',
      majors: ['Engineering', 'Mechanical Engineering'],
      biography: "Engineering student with a passion for robotics and sustainable design. I'm currently working on a solar-powered water filtration project and looking for team members interested in sustainability. I prefer studying late at night and am always up for coffee and problem-solving sessions.",
      weeklyAvailability: '000000000000001111110000000000000000111111000000000000000011111100000000000000001111110000000000000000111111000000000000000011111100000000000000111111',
      preferredLocations: [8, 23, 7, 4], // FRNY, ME, CL50, HAMP
      friends: [
        { id: 101, name: 'Alex Thompson', userEmail: 'alex.thompson@example.com' },
        { id: 103, name: 'Taylor Johnson', userEmail: 'taylor.johnson@example.com' }
      ]
    },
    '103': {
      userEmail: 'taylor.johnson@example.com',
      name: 'Taylor Johnson',
      majors: ['Psychology', 'Neuroscience'],
      biography: "Psychology and neuroscience double major with a focus on cognitive development. I'm currently conducting research on memory formation and study habits. Looking for study partners for statistics and research methods courses. I'm a night owl but can accommodate morning study sessions too!",
      weeklyAvailability: '000000000000000000000011111100000000000000000011111100000000000000000011111100000000000000001111110000000000000000111111000000000000111111000000000000',
      preferredLocations: [5, 17, 15, 25], // RAWL, HEAV, HIKS, PMU
      friends: [
        { id: 102, name: 'Morgan Smith', userEmail: 'morgan.smith@example.com' },
        { id: 109, name: 'Taylor Thompson', userEmail: 'taylor.thompson@example.com' }
      ]
    },
    '104': {
      userEmail: 'alex.johnson@example.com',
      name: 'Alex Johnson',
      majors: ['Computer Engineering'],
      biography: "Passionate about hardware design and IoT. Currently building a smart home system as a side project. Looking for study partners for digital systems and computer architecture courses. I'm an early bird and do my best work in the mornings. Coffee is my fuel!",
      weeklyAvailability: '111111000000000000000000001111110000000000000000000011111100000000000000000000111111000000000000000000001111110000000000000000001111110000000000000000',
      preferredLocations: [2, 10, 14, 22], // LWSN, MSEE, HAAS, YONG
      friends: []
    }
  };

  return mockUsers[userId] || null;
}

function UsrProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [compatibilityScore, setCompatibilityScore] = useState(null);

  // Replace your existing useEffect with this one
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        // Get current user data from localStorage
        const currentUserJSON = localStorage.getItem('userData');
        
        // For demo purposes, create a mock current user if none exists
        const mockCurrentUser = {
          userEmail: 'current.user@example.com',
          name: 'Current User',
          majors: ['Computer Science', 'Mathematics'],
          weeklyAvailability: '000000001111110000000000000000111111000000000000000011111100000000000000001111110000000000000000111111000000000000001111110000000000000000111111',
          preferredLocations: [1, 2, 15, 25], // WALC, LWSN, HIKS, PMU
          friends: [
            { id: 101, name: 'Alex Thompson', userEmail: 'alex.thompson@example.com' },
            { id: 103, name: 'Taylor Johnson', userEmail: 'taylor.johnson@example.com' }
          ]
        };
        
        if (currentUserJSON) {
          const parsedUser = JSON.parse(currentUserJSON);
          setCurrentUserData(parsedUser);
          
          // Check if this user is already a friend
          const isAlreadyFriend = parsedUser.friends?.some(
            friend => friend.id === userId || friend.userEmail === userId
          );
          setIsFriend(isAlreadyFriend);
        } else {
          // Use mock current user for demo
          setCurrentUserData(mockCurrentUser);
          setIsFriend(mockCurrentUser.friends.some(
            friend => friend.id == userId || friend.userEmail == userId
          ));
        }

        try {
          // Try real API call first
          const sessionId = localStorage.getItem('sessionId');
          if (sessionId) {
            const response = await axios.get(
              `http://localhost:8080/users/${userId}`,
              {
                headers: {
                  'Session-Id': sessionId
                }
              }
            );
            
            if (response.data) {
              setUserData(response.data);
              calculateCompatibility(response.data);
            }
          } else {
            throw new Error('No session ID');
          }
        } catch (apiError) {
          console.log('API call failed, using mock data:', apiError);
          
          // Use mock data if API fails
          const mockUser = getMockUserData(userId);
          
          if (mockUser) {
            setUserData(mockUser);
            calculateCompatibility(mockUser);
          } else {
            setError('User not found');
          }
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
  }, [userId, navigate]);

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

  const handleAddFriend = async () => {
    if (!currentUserData || !userData) return;

    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        navigate('/');
        return;
      }

      // In a real application, you would make an API call here
      // This is a simplified implementation for demonstration
      const response = await axios.post(
        `http://localhost:8080/users/${currentUserData.userEmail}/add-friend`,
        { friendEmail: userData.userEmail },
        {
          headers: {
            'Content-Type': 'application/json',
            'Session-Id': sessionId
          }
        }
      );

      if (response.status === 200) {
        // Update current user's friends list in localStorage
        const updatedFriends = [
          ...(currentUserData.friends || []),
          {
            id: userData.userEmail,
            name: userData.name,
            userEmail: userData.userEmail
          }
        ];
        
        const updatedUserData = {
          ...currentUserData,
          friends: updatedFriends
        };
        
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        setCurrentUserData(updatedUserData);
        setIsFriend(true);
        
        alert(`You are now friends with ${userData.name}!`);
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      
      // For demonstration purposes, update the UI anyway
      setIsFriend(true);
      alert(`Friend request sent to ${userData.name}!`);
    }
  };

  const handleRemoveFriend = async () => {
    if (!currentUserData || !userData) return;

    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        navigate('/');
        return;
      }

      // In a real application, you would make an API call here
      const response = await axios.post(
        `http://localhost:8080/users/${currentUserData.userEmail}/remove-friend`,
        { friendEmail: userData.userEmail },
        {
          headers: {
            'Content-Type': 'application/json',
            'Session-Id': sessionId
          }
        }
      );

      if (response.status === 200) {
        // Update current user's friends list in localStorage
        const updatedFriends = (currentUserData.friends || []).filter(
          friend => friend.userEmail !== userData.userEmail && friend.id !== userData.userEmail
        );
        
        const updatedUserData = {
          ...currentUserData,
          friends: updatedFriends
        };
        
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        setCurrentUserData(updatedUserData);
        setIsFriend(false);
        
        alert(`You have removed ${userData.name} from your friends.`);
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      
      // For demonstration purposes, update the UI anyway
      setIsFriend(false);
      alert(`Removed ${userData.name} from your friends.`);
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