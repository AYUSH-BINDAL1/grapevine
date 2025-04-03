import { useState, useEffect } from "react";
import "./Profile.css";
import profileImage from "../assets/temp-profile.webp";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from "react-router-dom";
import { searchEnabled } from '../App';

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
  const [isLoading, setIsLoading] = useState(true);
  // Add a state for the delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  // Add a new state variable for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const sessionId = localStorage.getItem('sessionId');
  const navigate = useNavigate();
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userCourses, setUserCourses] = useState([]);
  const [coursesData, setCoursesData] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      toast.error("Session expired. Please login again.");
      setTimeout(() => window.location.href = '/', 2000);
      return;
    }
  
    // Load user data from localStorage
    setIsLoading(true);
    const storedUserData = localStorage.getItem('userData');
    
    if (storedUserData) {
      const parsedData = JSON.parse(storedUserData);
      setUserData(parsedData);
      setEditedDescription(parsedData.biography || "");
      
      // Store the majors array directly
      setEditedProfileData({
        name: parsedData.name || "",
        userEmail: parsedData.userEmail || "",
        majors: parsedData.majors || []
      });
      
      // If the user already has availability data, load it
      if (parsedData.weeklyAvailability) {
        setAvailabilityString(parsedData.weeklyAvailability);
      }
  
      // Fetch current role from backend
      const fetchUserRole = async () => {
        try {
          const response = await axios.get(
            `http://localhost:8080/users/${parsedData.userEmail}`,
            { headers: { 'Session-Id': sessionId } }
          );
          
          const role = response.data.role || 'Student';
          setUserRole(role);
          
          // Update searchEnabled based on role
          const isTeachingRole = ['INSTRUCTOR', 'GTA', 'UTA'].includes(role);
          setSearchEnabled(isTeachingRole);
          
          // Update global searchEnabled variable
          window.searchEnabled = isTeachingRole;
          
        } catch (error) {
          console.error('Error fetching user role:', error);
          toast.error('Failed to fetch user role');
        }
      };
  
      fetchUserRole();
    }
    
    setTimeout(() => setIsLoading(false), 500);
  }, []);
  
  useEffect(() => {
    const fetchUserCourses = async () => {
      if (!userData?.userEmail || !sessionId) return;
      
      try {
        const response = await axios.get(
          `http://localhost:8080/users/${userData.userEmail}/courses`,
          {
            headers: {
              'Session-Id': sessionId
            }
          }
        );
        
        if (response.data) {
          console.log('Courses fetched:', response.data);
          setUserCourses(response.data);
        }
      } catch (error) {
        console.error('Error fetching user courses:', error);
      }
    };
    
    fetchUserCourses();
  }, [userData?.userEmail, sessionId]);

  useEffect(() => {
    const fetchUserCourses = async () => {
      if (!userData?.userEmail) return;
      
      setCoursesLoading(true);
      
      try {
        const sessionId = localStorage.getItem('sessionId');
        
        const response = await axios.get(
          `http://localhost:8080/users/${userData.userEmail}/courses`,
          {
            headers: {
              'Session-Id': sessionId
            }
          }
        );
        
        console.log('Courses data fetched:', response.data);
        setCoursesData(response.data || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
        
      } finally {
        setCoursesLoading(false);
      }
    };
    
    fetchUserCourses();
  }, [userData?.userEmail]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Allow Escape key to cancel edits
      if (e.key === 'Escape') {
        if (isEditingProfile) {
          setIsEditingProfile(false);
        } else if (isEditingDescription) {
          setIsEditingDescription(false);
        }
      }
      
      // Allow Ctrl+S to save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (isEditingProfile) {
          handleSaveProfile();
        } else if (isEditingDescription) {
          handleSaveDescription();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditingProfile, isEditingDescription]);

  const handleRoleChange = async (event) => {
    const newRole = event.target.value;
    
    try {
      const response = await axios.put(
        `http://localhost:8080/users/${userData.userEmail}`,
        { role: newRole },
        {
          headers: {
            'Content-Type': 'application/json',
            'Session-Id': sessionId
          }
        }
      );
  
      if (response.status === 200) {
        setUserRole(newRole);
        
        // Update searchEnabled based on new role
        const isTeachingRole = ['INSTRUCTOR', 'GTA', 'UTA'].includes(newRole);
        setSearchEnabled(isTeachingRole);
        
        // Update global searchEnabled variable
        window.searchEnabled = isTeachingRole;
        
        // Update localStorage
        const updatedUserData = { ...userData, role: newRole };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        setUserData(updatedUserData);
        
        toast.success('Role updated successfully!');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role. Please try again.');
    }
  };
  

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
        
        //alert("Availability saved successfully!");
        toast.success("Availability saved successfully!");
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      alert("Failed to save availability. Please try again.");
    }
  };

  const handleEditDescription = () => {
    setIsEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    if (!userData) return;

    try {
      
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
        
        //alert("Description saved successfully!");
        toast.success("Description saved successfully!");
      }
    } catch (error) {
      console.error('Error saving description:', error);
      alert("Failed to save description. Please try again.");
    }
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleDeleteProfile = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteProfile = async () => {
    if (!deletePassword) {
      toast.error("Please enter your password");
      return;
    }
  
    if (!userData || !userData.userEmail) {
      toast.error("Missing user data. Please refresh and try again.");
      return;
    }
  
    try {
      if (!sessionId) {
        toast.error("Session expired. Please login again.");
        setTimeout(() => window.location.href = '/', 2000);
        return;
      }
      
      const response = await axios({
        method: 'DELETE',
        url: `http://localhost:8080/users/${userData.userEmail}`,
        headers: {
          'Content-Type': 'application/json',
          'Session-Id': sessionId
        },
        data: {
          password: deletePassword
        }
      });
      
      if (response.status >= 200 && response.status < 300) {
        toast.success("Your account has been successfully deleted. You will be redirected to the login page.", {
          onClose: () => { window.location.href = '/'; }
        });

        localStorage.clear();
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location.href = '/'; }, 2000);
      } else {
        toast.error(`Unexpected response: ${response.status}`);
      }
    } catch (error) {
      toast.dismiss("deleting");
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            toast.error("Incorrect password. Please try again.");
            break;
          case 403:
            toast.error("You don't have permission to delete this account.");
            break;
          case 404:
            toast.error("User not found. You may have already deleted this account.");
            break;
          case 500:
            toast.error("Server error. Please try again later.");
            break;
          default:
            toast.error(`Error (${error.response.status}): ${error.response.data.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        toast.error("No response from server. Please check your connection.");
      } else {
        toast.error(`Request failed: ${error.message}`);
      }
    }
  
    setShowDeleteModal(false);
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
        
        //alert("Profile information saved successfully!");
        toast.success("Profile information saved successfully!");
        
      }
    } catch (error) {
      console.error('Error saving profile information:', error);
      alert("Failed to save profile information. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-sidebar">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-image-container">
              <img src={profileImage} alt="Profile" className="profile-image" />
            </div>
            <h2 className="name">{userData?.name || "Loading..."}</h2>
            <div className="tag-container">
              {userData?.majors?.map((major, index) => (
                <span key={index} className="tag">{major}</span>
              )) || <span className="tag">CS</span>}
            </div>
          </div>
        </div>
        
        <div className="description-info">
          <h3 className="description">
            About-Me
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
        <div className="role-selector">
          <h3>Role</h3>
          <select 
            className="role-select"
            value={userRole}
            onChange={handleRoleChange}
          >
            <option value="Student">Student</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="GTA">Graduate Teaching Assistant</option>
            <option value="UTA">Undergraduate Teaching Assistant</option>
          </select>
        </div>
        {searchEnabled && (
          <button 
            className="view-students-button"
            onClick={() => navigate('/view-students')}
          >
            View Students
          </button>
        )}
      </div>
      
      <div className="profile-content">
        <div className="profile-actions">
          <button className="edit-profile-button" onClick={handleEditProfile}>
            Edit Profile
          </button>
          <button className="delete-profile-button" onClick={handleDeleteProfile}>
            Delete Profile
          </button>
        </div>

        <div className="availability-panel">
          <h3 className="panel-header">Set Your Availability</h3>
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

              <div className="time-indicators-container">
                <div className="time-indicators-spacer"></div>
                <div className="time-indicators">
                  {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => (
                    <div key={hour} className="time-indicator">
                      <span>{hour}:00</span>
                    </div>
                  ))}
                </div>
              </div>
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
          <h3 className="panel-header">Preferred Study Locations</h3>
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
          </div>
          
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

        <div className="courses-container">
          <h3 className="panel-header">My Courses</h3>
          
          {coursesLoading ? (
            <div className="loading-courses">
              <div className="skeleton-courses">
                <div className="skeleton-course"></div>
                <div className="skeleton-course"></div>
                <div className="skeleton-course"></div>
              </div>
            </div>
          ) : (
            <div className="courses-list">
              {coursesData.length > 0 ? (
                coursesData.map((course, index) => (
                  <div key={index} className="course-item">
                    <p className="course-name">
                      {course.courseId}
                      {course.courseName && course.courseId !== course.courseName && (
                        <span className="course-full-name"> - {course.courseName}</span>
                      )}
                    </p>
                  </div>
                ))
              ) : (
                <div className="empty-courses-message">
                  <p>No courses added yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
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
      
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <h3>Delete Account</h3>
            <p>This action cannot be undone. Please enter your password to confirm.</p>
            
            <div className="password-field-container">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    confirmDeleteProfile();
                  }
                }}
              />
              <button 
                type="button" 
                className="toggle-password-visibility" 
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            
            <div className="modal-buttons">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  toast.info("Delete profile cancelled.");
                }}
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteProfile}
                className="delete-button"
                disabled={!deletePassword}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
      
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

      <ToastContainer 
        position="bottom-left"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default Profile;