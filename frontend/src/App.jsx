import { BrowserRouter as Router, Routes, Route, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useRef, useEffect, useState, lazy, Suspense, useCallback, useMemo, memo } from 'react';
import axios from 'axios';
import Registration from './components/Registration';
import Confirmation from './components/Confirmation';
import Profile from './components/Profile';
import Nopath from './components/Nopath';
import profileImage from './assets/temp-profile.webp';
import Events from './components/Events';
import Groups from './components/Groups';
import Friends from './components/Friends';
import CreateEvent from "./components/CreateEvent.jsx";
import CreateGroup from "./components/CreateGroup.jsx";
import CourseSearch from './components/CourseSearch.jsx';
import EventDetails from "./components/EventDetails";
import ViewStudents from './components/ViewStudents.jsx';
import UsrProfile from './components/UsrProfile';
import Messaging from './components/Messaging.jsx';
import Forum from './components/Forum';
import Thread from './components/Thread.jsx';
import NotificationDropdown from './components/NotificationDropdown';
import './App.css';
import './components/Groups.css';
import {base_url, image_url} from './config.js';

export let searchEnabled = true;
/*export const setSearchEnabled = (value) => {
  searchEnabled = value;
};
*/
const Login = lazy(() => import('./components/Login'));

// Optimize the Taskbar with memo to prevent unnecessary re-renders
const Taskbar = memo(function Taskbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfileImage, setUserProfileImage] = useState(profileImage);
  const [userDataVersion, setUserDataVersion] = useState(0);
  
  // Memoize this function to prevent recreation on each render
  const isActive = useCallback((path) => {
    if (path === '/home') return location.pathname === '/home' || location.pathname.startsWith('/group/');
    return location.pathname.startsWith(path);
  }, [location.pathname]);
  
  // Optimize image loading with useCallback
  const tryLoadIdBasedImage = useCallback((profilePictureId) => {
    // Check for cached image first
    const cachedImageUrl = sessionStorage.getItem(`profile-image-${profilePictureId}`);
    if (cachedImageUrl) {
      setUserProfileImage(cachedImageUrl);
      return;
    }
    
    // Try the standard URL format first
    const userImageUrl = `${image_url}/images/${profilePictureId}`;
    const img = new Image();
    
    img.onload = () => {
      setUserProfileImage(userImageUrl);
      // Cache the successful image URL
      sessionStorage.setItem(`profile-image-${profilePictureId}`, userImageUrl);
    };
    img.onerror = () => {
      // If that fails, try the API format
      const apiImageUrl = `${base_url}/api/files/getImage/${profilePictureId}`;
      const imgApi = new Image();
      imgApi.onload = () => {
        setUserProfileImage(apiImageUrl);
        // Cache the successful image URL
        sessionStorage.setItem(`profile-image-${profilePictureId}`, apiImageUrl);
      };
      imgApi.onerror = () => {
        console.error("Failed to load profile image with both URL formats");
      };
      imgApi.src = apiImageUrl;
    };
    img.src = userImageUrl;
  }, []);

  // Use the useEffect hook more efficiently
  useEffect(() => {
    // Debounce storage event handler to prevent excessive updates
    let timeoutId = null;
    const handleStorageChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setUserDataVersion(prev => prev + 1);
      }, 300);
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Initial load - use try/catch for better error handling
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      if (userData.profilePictureUrl) {
        // Check if we've already fetched this image
        const cachedUserImage = sessionStorage.getItem(`profile-url-${userData.profilePictureUrl}`);
        if (cachedUserImage === 'valid') {
          setUserProfileImage(userData.profilePictureUrl);
        } else {
          const img = new Image();
          img.onload = () => {
            setUserProfileImage(userData.profilePictureUrl);
            sessionStorage.setItem(`profile-url-${userData.profilePictureUrl}`, 'valid');
          };
          img.onerror = () => {
            console.error("Failed to load profile image URL");
            if (userData.profilePictureId) {
              tryLoadIdBasedImage(userData.profilePictureId);
            }
          };
          img.src = userData.profilePictureUrl;
        }
      } else if (userData.profilePictureId) {
        tryLoadIdBasedImage(userData.profilePictureId);
      }
    } catch (error) {
      console.error("Error loading user profile data:", error);
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearTimeout(timeoutId);
    };
  }, [userDataVersion, tryLoadIdBasedImage]);

  // Optimize the logout handler with useCallback
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    const conf = window.confirm("Are you sure you want to log out?");
    if (!conf) return;

    try {
      setIsLoggingOut(true);
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        localStorage.clear();
        navigate("/");
        return;
      }
      
      // Set a timeout to ensure we don't wait forever
      const timeout = setTimeout(() => {
        console.warn("Logout request timed out, clearing local data");
        localStorage.clear();
        navigate("/");
      }, 5000);
      
      await axios.delete(`${base_url}/users/logout`, {
        headers: { 'Session-Id': sessionId },
        timeout: 4000 // Add axios timeout
      });
      
      clearTimeout(timeout);
      localStorage.clear();
      navigate("/");
    } catch (error) {
      console.error('Error logging out:', error);
      localStorage.clear();
      alert("There was an issue logging out from the server, but you've been logged out locally.");
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, navigate]);

  // Memoize the navbar items to prevent unnecessary re-renders
  const navItems = useMemo(() => [
    { path: '/home', label: 'Groups' },
    { path: '/events', label: 'Events' },
    { path: '/forum', label: 'Forum' },
    { path: '/messaging', label: 'Messages' },
    { path: '/friends', label: 'Friends' }
  ], []);

  return (
    <div className="taskbar">
      <nav className="taskbar-elem">
        {navItems.map(item => (
          <h3 
            key={item.path}
            onClick={() => navigate(item.path)} 
            className={`elem ${isActive(item.path) ? 'active' : ''}`}
          >
            {item.label}
          </h3>
        ))}
        
        {searchEnabled && (
          <h3 
            onClick={() => navigate("/courseSearch")} 
            className={`elem ${isActive('/courseSearch') ? 'active' : ''}`}
          >
            Courses
          </h3>
        )}

        <div className="navbar">
          <NotificationDropdown />
        </div>
        
        <img 
          onClick={() => navigate("/profile")} 
          className={`profile ${isActive('/profile') ? 'active-profile' : ''}`}
          src={userProfileImage} 
          alt="Profile" 
          loading="lazy" // Add lazy loading
        />
        
        <h3 
          onClick={handleLogout} 
          className={`elem logout ${isLoggingOut ? 'disabled' : ''}`}
          style={{ cursor: isLoggingOut ? 'wait' : 'pointer' }}
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </h3>
      </nav>
    </div>
  );
});

function Layout() {
  return (
      <>
        <Taskbar />
        <Outlet />
      </>
  );
}

function Home() {
  const [groups, setGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [groupFilter, setGroupFilter] = useState("public"); // "all", "public", "private"
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchGroups = async () => {
      const storedUserInfo = localStorage.getItem('userData');
      const sessionId = localStorage.getItem('sessionId');

      if (storedUserInfo && sessionId) {
        const parsedUser = JSON.parse(storedUserInfo);
        const userEmail = parsedUser.userEmail;
        try {
          const response = await axios.get(
              `${base_url}/users/${userEmail}/all-groups-short`,
              { headers: { 'Session-Id': sessionId }
          });
          setGroups(response.data);
        } catch (error) {
          console.error('Error fetching user groups:', error);
          if (error.response?.status === 401) {
            alert('Session expired. Please login again.');
            navigate('/');
          }
        }

        try {
          const allRes = await axios.get(`${base_url}/groups/all`, {
            headers: { 'Session-Id': sessionId }
          });
          setAllGroups(allRes.data);
          const publicGroups = allRes.data.filter(group => group.public === true);
          setFilteredGroups(publicGroups);
        } catch (error) {
          console.error('Error fetching all groups:', error);
          if (error.response?.status === 401) {
            alert('Session expired. Please login again.');
            navigate('/');
          }
        }
      } else {
        alert('No user information or session found. Please login again.');
        navigate('/');
      }
    };
    fetchGroups();
  }, [navigate]);

  const handleCreateGroup = () => {
    navigate('/create-group');
  };

  const handleGroupClick = (groupId) => {
    navigate(`/group/${groupId}`);
  };

  const scrollLeft = (ref) => {
    ref.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = (ref) => {
    ref.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  const applyGroupFilter = () => {
    let result = allGroups;
    if (groupFilter === "public") {
      result = result.filter(group => group.public === true);
    } else if (groupFilter === "private") {
      result = result.filter(group => group.public === false);
    }
    if (searchQuery.trim() !== "") {
      result = result.filter(group =>
          group.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredGroups(result);
  };

  return (
      <div className="app">
        <h1>Groups</h1>

        <button onClick={handleCreateGroup} className="create-group-button">
          Create Group
        </button>

        <div className="scroll-wrapper2">
          <button className="scroll-arrow2 left" onClick={() => scrollLeft(scrollContainerRef)}>&lt;</button>
          <div className="scroll-container2" ref={scrollContainerRef}>
            {groups.length === 0 ? (
                <div className="empty-groups-message">
                  <p>You are not part of any groups.</p>
                </div>
            ) : (
                groups.map((group) => (
                    <div
                        key={group.groupId}
                        className="group-card"
                        onClick={() => handleGroupClick(group.groupId)}
                    >
                      <h3>{group.name}</h3>
                      {group.public === false ? (
                          <div className="private-group-indicator">
                            <span className="lock-icon">🔒</span>
                            <span className="private-text">
                              Private{group.instructorLed ? " / Instructor Led" : ""}
                            </span>
                          </div>
                      ) : (
                          <div className="public-group-indicator">
                            <span className="globe-icon">🌐</span>
                            <span className="public-text">
                              Public{group.instructorLed ? " / Instructor Led" : ""}
                            </span>
                          </div>
                      )}
                    </div>
                ))
            )}
          </div>
          <button className="scroll-arrow2 right" onClick={() => scrollRight(scrollContainerRef)}>&gt;</button>
        </div>

        <h2 className="section-header">All Groups</h2>
        <div className="all-groups-layout">
          <div className="filters-panel events-filter-panel">
            <h2>Filter Groups</h2>

            <div className="filter-group">
              <label htmlFor="groupSearch">Search:</label>
              <input
                  type="text"
                  id="groupSearch"
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyGroupFilter();
                    }
                  }}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="groupFilter">Visibility:</label>
              <select
                  id="groupFilter"
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
              >
                <option value="all">All Groups</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <button className="filter-button" onClick={applyGroupFilter}>
              Search
            </button>
          </div>
          <div className="all-groups-grid">
            {filteredGroups.length === 0 ? (
                <p>No groups found.</p>
            ) : (
                filteredGroups.map((group) => (
                    <div
                        key={group.groupId}
                        className="group-card"
                        onClick={() => handleGroupClick(group.groupId)}
                    >
                      <h3>{group.name}</h3>
                      {group.public === false ? (
                          <div className="private-group-indicator">
                            <span className="lock-icon">🔒</span>
                            <span className="private-text">
                              Private{group.instructorLed ? " / Instructor Led" : ""}
                            </span>
                          </div>
                      ) : (
                          <div className="public-group-indicator">
                            <span className="globe-icon">🌐</span>
                            <span className="public-text">
                              Public{group.instructorLed ? " / Instructor Led" : ""}
                            </span>
                          </div>
                      )}
                    </div>
                ))
            )}
          </div>
        </div>
      </div>
  );
}

function App() {
  return (
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <Login />
              </Suspense>
            } 
          />
          <Route path="/registration" element={<Registration />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/user/:userEmail" element={<UsrProfile />} />
          <Route path="*" element={<Nopath />} />
          <Route element={<Layout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/create-group" element={<CreateGroup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/events" element={<Events />} />
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/courseSearch" element={<CourseSearch />} />
            <Route path="/view-students" element={<ViewStudents />} />
            <Route path="/group/:id" element={<Groups />} />
            <Route path="/event/:eventId" element={<EventDetails />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/thread/:threadId" element={<Thread />} />
            <Route path="/messaging" element={<Messaging />} />
          </Route>
        </Routes>
      </Router>
  );
}

export default App;