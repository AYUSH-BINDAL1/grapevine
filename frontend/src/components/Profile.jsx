import React, { useState, useEffect } from "react";
import "./Profile.css";
import profileImage from "../assets/temp-profile.webp";
import axios from "axios";

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

  useEffect(() => {
    // Load user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const parsedData = JSON.parse(storedUserData);
      setUserData(parsedData);
      
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

  const handleAddAvailability = () => {
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
    
    setAvailabilityString(newAvailabilityString.join(''));
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

  return (
    <div className="profile-page">
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
              userData.preferredLocations.map((location, index) => (
                <div key={index} className="location">
                  <p className="location-name">{location}</p>
                </div>
              ))
            ) : (
              <div className="location">
                <p className="location-name">No preferred locations</p>
              </div>
            )}
            <select 
              className="location-select"
              onChange={(e) => {
                if (e.target.value && userData) {
                  const updatedUserData = { 
                    ...userData, 
                    preferredLocations: [...(userData.preferredLocations || []), e.target.value] 
                  };
                  localStorage.setItem('userData', JSON.stringify(updatedUserData));
                  setUserData(updatedUserData);
                  
                  const sessionId = localStorage.getItem('sessionId');
                  if (sessionId) {
                    axios.put(
                      `http://localhost:8080/users/${userData.userEmail}`,
                      { preferredLocations: updatedUserData.preferredLocations },
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
              <option value="HICKS">HICKS</option>
              <option value="Student Union">PMU</option>
              <option value="Engineering Building">Engineering Building</option>
              <option value="LWSN">LWSN</option>
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