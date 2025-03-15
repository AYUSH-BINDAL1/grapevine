import  { useState, useEffect } from "react";
import "./Profile.css";
import profileImage from "../assets/temp-profile.webp";
import axios from "axios";

// Add this validation function near the top of your Profile component
const validateEmail = (email) => {
  // Regular expression for basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

function Profile() {
  const [userData, setUserData] = useState(null);
  const [availability, setAvailability] = useState({
    day: "",
    startTime: "",
    endTime: ""
  });
  const [availabilityString, setAvailabilityString] = useState("0".repeat(168));
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  // Add new state variables for profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfileData, setEditedProfileData] = useState({
    name: "",
    userEmail: "",
    majors: []
  });
  // Add these state variables to your component
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    // Load user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const parsedData = JSON.parse(storedUserData);
      setUserData(parsedData);
      setEditedDescription(parsedData.biography || "");
      setEditedProfileData({
        name: parsedData.name || "",
        userEmail: parsedData.userEmail || "",
        majors: parsedData.majors || []
      });
      
      // If the user already has availability data, load it
      if (parsedData.weeklyAvailability) {
        setAvailabilityString(parsedData.weeklyAvailability);
      }
    }
  }, []);

  const handleAvailabilityChange = (e) => {
    setAvailability({
      ...availability,
      [e.target.name]: e.target.value
    });
  };


  const saveAvailability = async () => {
    const { day, startTime, endTime } = availability;
    
    if (!day || !startTime || !endTime) {
      alert("Please select a day, start time, and end time");
      return;
    }
  
    // Convert day to starting index (24 hours per day)
    const dayIndices = {
      "monday": 0,
      "tuesday": 24,
      "wednesday": 48,
      "thursday": 72,
      "friday": 96,
      "saturday": 120,
      "sunday": 144
    };
    
    const dayIndex = dayIndices[day];
    
    // Convert time strings to hours
    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = parseInt(endTime.split(":")[0]);
    
    if (startHour >= endHour) {
      alert("End time must be after start time");
      return;
    }
  
    // Create a new availability string
    let newAvailabilityString = availabilityString.split('');
    
    // Mark the hours as available (1)
    for (let hour = startHour; hour < endHour; hour++) {
      newAvailabilityString[dayIndex + hour] = '1';
    }
    
    const updatedAvailabilityString = newAvailabilityString.join('');
  
    if (!userData) return;
  
    try {
      const sessionId = localStorage.getItem('sessionId');
      
      if (!sessionId) {
        alert("You must be logged in to save availability");
        return;
      }
  
      const response = await axios.put(
        `http://localhost:8080/users/${userData.userEmail}`,
        { weeklyAvailability: updatedAvailabilityString },
        {
          headers: {
            'Content-Type': 'application/json',
            'Session-Id': sessionId
          }
        }
      );
  
      if (response.status === 200) {
        setAvailabilityString(updatedAvailabilityString);
        
        // Update the stored user data
        const updatedUserData = { ...userData, weeklyAvailability: updatedAvailabilityString };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        setUserData(updatedUserData);
        
        alert("Availability saved successfully!");
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      alert("Failed to save availability. Please try again.");
    }
  };

  useEffect(() => {
    // Load user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const parsedData = JSON.parse(storedUserData);
      setUserData(parsedData);
      setEditedDescription(parsedData.biography || "");
      
      // If the user already has availability data, load it
      if (parsedData.weeklyAvailability) {
        setAvailabilityString(parsedData.weeklyAvailability);
      }
    }
  }, []);

  const handleEditDescription = () => {
    setIsEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    if (!userData) return;

    try {
      const sessionId = localStorage.getItem('sessionId');
      
      if (!sessionId) {
        alert("You must be logged in to save description");
        return;
      }

      const response = await axios.put(
        `http://localhost:8080/users/${userData.userEmail}`,
        { biography: editedDescription },
        {
          headers: {
            'Content-Type': 'application/json',
            'Session-Id': sessionId
          }
        }
      );

      if (response.status === 200) {
        // Update the stored user data
        const updatedUserData = { ...userData, biography: editedDescription };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        setUserData(updatedUserData);
        setIsEditingDescription(false);
        
        alert("Description saved successfully!");
      }
    } catch (error) {
      console.error('Error saving description:', error);
      alert("Failed to save description. Please try again.");
    }
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  // Update the handleProfileInputChange function to validate email as the user types
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "majors") {
      // Convert comma-separated string to array
      setEditedProfileData({
        ...editedProfileData,
        [name]: value.split(',').map(item => item.trim()).filter(item => item !== "")
      });
    } else if (name === "userEmail") {
      // Update the email in the state
      setEditedProfileData({
        ...editedProfileData,
        [name]: value
      });
      
      // Validate email format and provide feedback
      if (value && !validateEmail(value)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    } else {
      setEditedProfileData({
        ...editedProfileData,
        [name]: value
      });
    }
  };

  // Update the handleSaveProfile function to include email validation
  const handleSaveProfile = async () => {
    if (!userData) return;

    // Validate email
    if (!validateEmail(editedProfileData.userEmail)) {
      alert("Please enter a valid email address");
      return;
    }
    
    // Add confirmation dialog
    const confirmSave = window.confirm("Are you sure you want to save these changes to your profile?");
    
    if (!confirmSave) {
      return; // User canceled the action
    }
  
    try {
      const sessionId = localStorage.getItem('sessionId');
      
      if (!sessionId) {
        alert("You must be logged in to save profile information");
        return;
      }
  
      const response = await axios.put(
        `http://localhost:8080/users/${userData.userEmail}`,
        editedProfileData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Session-Id': sessionId
          }
        }
      );
  
      if (response.status === 200) {
        // Update the stored user data
        const updatedUserData = { ...userData, ...editedProfileData };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        setUserData(updatedUserData);
        setIsEditingProfile(false);
        
        alert("Profile information saved successfully!");
      }
    } catch (error) {
      console.error('Error saving profile information:', error);
      alert("Failed to save profile information. Please try again.");
    }
  };

  return (
    <div className="profile-page">
      <button className="edit-profile-button" onClick={handleEditProfile}>
        Edit Profile
      </button>
      
      {isEditingProfile && (
        <div className="edit-profile-modal">
          <div className="edit-profile-form">
            <h3>Edit Profile Information</h3>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={editedProfileData.name}
                onChange={handleProfileInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="userEmail">Email</label>
              <input
                type="email"
                id="userEmail"
                name="userEmail"
                value={editedProfileData.userEmail}
                onChange={handleProfileInputChange}
                className={emailError ? "input-error" : ""}
              />
              {emailError && <span className="error-message">{emailError}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="majors">Majors (comma separated)</label>
              <input
                type="text"
                id="majors"
                name="majors"
                value={editedProfileData.majors.join(', ')}
                onChange={handleProfileInputChange}
                placeholder="e.g. CS, Math, Statistics"
              />
            </div>
            <div className="form-buttons">
              <button 
                className="save-profile-button"
                onClick={handleSaveProfile}
              >
                Save Changes
              </button>
              <button 
                className="cancel-profile-button"
                onClick={() => {
                  setIsEditingProfile(false);
                  setEditedProfileData({
                    name: userData?.name || "",
                    userEmail: userData?.userEmail || "",
                    majors: userData?.majors || []
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="profile-image-container">
        <img src={profileImage} alt="Profile" className="profile-image" />
      </div>
      <div className="profile-info">
        <div className="nametag-container">
          <h2 className="name">{userData?.name || "Loading..."}</h2>
          <div className="tags">
            {userData?.majors?.map((major, index) => (
              <span key={index} className="tag">{major}</span>
            )) || <span className="tag">CS</span>}
          </div>
        </div>
        <div className="description-info">
          <h3 className="description">
            Description
            {!isEditingDescription && (
              <button 
                className="edit-button" 
                onClick={handleEditDescription}
                style={{ marginLeft: '10px', fontSize: '0.8rem' }}
              >
                Edit
              </button>
            )}
          </h3>
          {isEditingDescription ? (
            <div className="description-edit">
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="description-textarea"
                rows={4}
                placeholder="Enter your description..."
              />
              <div className="description-actions">
                <button 
                  className="save-button"
                  onClick={handleSaveDescription}
                >
                  Save
                </button>
                <button 
                  className="cancel-button"
                  onClick={() => {
                    setIsEditingDescription(false);
                    setEditedDescription(userData?.biography || "");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="description-details">{userData?.biography || "No description available"}</p>
          )}
        </div>
      </div>
      <div className="availability-panel">
        <h3>Set Your Availability</h3>
        <div className="time-input">
          <label>
            Start Time:
            <input 
              type="time" 
              name="startTime"
              value={availability.startTime}
              onChange={handleAvailabilityChange}
              list="valid-times" 
              step={3600}
            />
          </label>
          <label>
            End Time:
            <input 
              type="time" 
              name="endTime"
              value={availability.endTime}
              onChange={handleAvailabilityChange}
              list="valid-times" 
              step={3600}
            />
          </label>
          <select 
            name="day"
            value={availability.day}
            onChange={handleAvailabilityChange}
          >
            <option value="">Select Day</option>
            <option value="monday">Monday</option>
            <option value="tuesday">Tuesday</option>
            <option value="wednesday">Wednesday</option>
            <option value="thursday">Thursday</option>
            <option value="friday">Friday</option>
            <option value="saturday">Saturday</option>
            <option value="sunday">Sunday</option>
          </select>
          <button className="add-time" onClick={saveAvailability}>Add Availability</button>
          <button 
            className="remove-time" 
            onClick={() => {
              const { day, startTime, endTime } = availability;
              
              if (!day || !startTime || !endTime) {
                alert("Please select a day, start time, and end time");
                return;
              }
            
              // Convert day to starting index (24 hours per day)
              const dayIndices = {
                "monday": 0,
                "tuesday": 24,
                "wednesday": 48,
                "thursday": 72,
                "friday": 96,
                "saturday": 120,
                "sunday": 144
              };
              
              const dayIndex = dayIndices[day];
              
              // Convert time strings to hours
              const startHour = parseInt(startTime.split(":")[0]);
              const endHour = parseInt(endTime.split(":")[0]);
              
              if (startHour >= endHour) {
                alert("End time must be after start time");
                return;
              }
            
              // Create a new availability string
              let newAvailabilityString = availabilityString.split('');
              
              // Mark the hours as unavailable (0)
              for (let hour = startHour; hour < endHour; hour++) {
                newAvailabilityString[dayIndex + hour] = '0';
              }
              
              const updatedAvailabilityString = newAvailabilityString.join('');
            
              if (!userData) return;
            
              try {
                const sessionId = localStorage.getItem('sessionId');
                
                if (!sessionId) {
                  alert("You must be logged in to update availability");
                  return;
                }
            
                axios.put(
                  `http://localhost:8080/users/${userData.userEmail}`,
                  { weeklyAvailability: updatedAvailabilityString },
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      'Session-Id': sessionId
                    }
                  }
                ).then(response => {
                  if (response.status === 200) {
                    setAvailabilityString(updatedAvailabilityString);
                    
                    // Update the stored user data
                    const updatedUserData = { ...userData, weeklyAvailability: updatedAvailabilityString };
                    localStorage.setItem('userData', JSON.stringify(updatedUserData));
                    setUserData(updatedUserData);
                    
                    alert("Availability removed successfully!");
                  }
                }).catch(error => {
                  console.error('Error removing availability:', error);
                  alert("Failed to remove availability. Please try again.");
                });
              } catch (error) {
                console.error('Error removing availability:', error);
                alert("Failed to remove availability. Please try again.");
              }
            }}
          >
            Remove Availability
          </button>
          
          <div className="availability-preview">
            <h4>Current Availability:</h4>
            <div className="availability-visual">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, dayIndex) => (
                <div key={day} className="day-row">
                  <span className="day-name">{day}</span>
                  <div className="hour-blocks">
                    {Array.from({ length: 24 }, (_, hourIndex) => {
                      const stringIndex = dayIndex * 24 + hourIndex;
                      return (
                        <div 
                          key={hourIndex} 
                          className={`hour-block ${availabilityString[stringIndex] === '1' ? 'available' : ''}`}
                          title={`${day} ${hourIndex}:00-${hourIndex+1}:00`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="locations-container">
  <h3 className="locations">Preferred Study Locations</h3>
  <div className="locations-list">
    {userData?.preferredLocations?.length > 0 ? (
      userData.preferredLocations.map((locationId, index) => {
        // Create a mapping of location IDs to short names
        const locationNames = {
          1: "WALC",
          2: "LWSN",
          3: "PMUC",
          4: "HAMP",
          5: "RAWL",
          6: "CHAS",
          7: "CL50",
          8: "FRNY",
          9: "KRAN",
          10: "MSEE",
          11: "MATH",
          12: "PHYS",
          13: "POTR",
          14: "HAAS",
          15: "HIKS",
          16: "BRWN",
          17: "HEAV",
          18: "BRNG",
          19: "SC",
          20: "WTHR",
          21: "UNIV",
          22: "YONG",
          23: "ME",
          24: "ELLT",
          25: "PMU",
          26: "STEW"
        };

        // Handle both numeric IDs and legacy string location names
        const locationName = typeof locationId === 'number' 
          ? locationNames[locationId]
          : locationId; // For backwards compatibility
        
        return (
          <div key={index} className="location">
            <p className="location-name">{locationName}</p>
          </div>
        );
      })
    ) : (
      <div className="location">
        <p className="location-name">No preferred locations</p>
      </div>
    )}

    <select 
      className="location-select"
      onChange={(e) => {
        if (e.target.value && userData) {
          // Convert selected value to numeric ID
          const locationId = parseInt(e.target.value, 10);
          
          // Create array of preferred location IDs`
          const currentLocationIds = userData.preferredLocations?.map(loc => {
            // If it's already a number, use it directly
            if (typeof loc === 'number') return loc;
            
            // If locations were previously stored as strings, try to find their IDs
            // This is for backward compatibility
            const locationMap = {
              "WALC": 1,
              "LWSN": 2,
              "PMUC": 3,
              "HAMP": 4,
              "RAWL": 5,
              "CHAS": 6,
              "CL50": 7,
              "FRNY": 8,
              "KRAN": 9,
              "MSEE": 10,
              "MATH": 11,
              "PHYS": 12,
              "POTR": 13,
              "HAAS": 14,
              "HIKS": 15,
              "BRWN": 16,
              "HEAV": 17,
              "BRNG": 18,
              "SC": 19,
              "WTHR": 20,
              "UNIV": 21,
              "YONG": 22,
              "ME": 23,
              "ELLT": 24,
              "PMU": 25,
              "STEW": 26,
              // Additional mappings for legacy data
              "HICKS": 15,
              "Student Union": 25,
              "Engineering Building": 23
            };
            return locationMap[loc] || null;
          }).filter(id => id !== null) || [];
          
          // Add new location ID if not already in the list
          if (!currentLocationIds.includes(locationId)) {
            currentLocationIds.push(locationId);
          }
          
          // Create updated user data with location IDs
          const updatedUserData = { 
            ...userData, 
            preferredLocations: currentLocationIds
          };
          
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
          setUserData(updatedUserData);
          
          const sessionId = localStorage.getItem('sessionId');
          if (sessionId) {
            axios.put(
              `http://localhost:8080/users/${userData.userEmail}`,
              { preferredLocations: currentLocationIds },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Session-Id': sessionId
                }
              }
            ).catch(error => {
              console.error('Error saving locations:', error);
            });
          }
        }
        e.target.value = "";
      }}
    >
      <option value="">Select a location</option>
      <option value="1">WALC</option>
      <option value="2">LWSN</option>
      <option value="3">PMUC</option>
      <option value="4">HAMP</option>
      <option value="5">RAWL</option>
      <option value="6">CHAS</option>
      <option value="7">CL50</option>
      <option value="8">FRNY</option>
      <option value="9">KRAN</option>
      <option value="10">MSEE</option>
      <option value="11">MATH</option>
      <option value="12">PHYS</option>
      <option value="13">POTR</option>
      <option value="14">HAAS</option>
      <option value="15">HIKS</option>
      <option value="16">BRWN</option>
      <option value="17">HEAV</option>
      <option value="18">BRNG</option>
      <option value="19">SC</option>
      <option value="20">WTHR</option>
      <option value="21">UNIV</option>
      <option value="22">YONG</option>
      <option value="23">ME</option>
      <option value="24">ELLT</option>
      <option value="25">PMU</option>
      <option value="26">STEW</option>
    </select>
  </div>
</div>
      <div className="friends-container">
        <h3 className="friends">Friends</h3>
        <div className="friends-list">
          {userData?.friends?.length > 0 ? (
            userData.friends.map((friend, index) => (
              <div key={index} className="friend">
                <img src={profileImage} alt="Profile" className="friend-image" />
                <p className="friend-name">{friend.name}</p>
              </div>
            ))
          ) : (
            <div className="friend">
              <img src={profileImage} alt="Profile" className="friend-image" />
              <p className="friend-name">No friends yet</p>
            </div>
          )}
          <button className="add-friend">Add Friend</button>
        </div>
      </div>
      
      {/* Hidden datalist for time selection */}
      <datalist id="valid-times">
        <option value="00:00"></option>
        <option value="01:00"></option>
        <option value="02:00"></option>
        <option value="03:00"></option>
        <option value="04:00"></option>
        <option value="05:00"></option>
        <option value="06:00"></option>
        <option value="07:00"></option>
        <option value="08:00"></option>
        <option value="09:00"></option>
        <option value="10:00"></option>
        <option value="11:00"></option>
        <option value="12:00"></option>
        <option value="13:00"></option>
        <option value="14:00"></option>
        <option value="15:00"></option>
        <option value="16:00"></option>
        <option value="17:00"></option>
        <option value="18:00"></option>
        <option value="19:00"></option>
        <option value="20:00"></option>
        <option value="21:00"></option>
        <option value="22:00"></option>
        <option value="23:00"></option>
      </datalist>
    </div>
  );
}

export default Profile;