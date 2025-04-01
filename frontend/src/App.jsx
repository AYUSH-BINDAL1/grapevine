import { BrowserRouter as Router, Routes, Route, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import Registration from './components/Registration';
import Login from './components/Login';
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
import './App.css';

export const searchEnabled = true;

function Taskbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (path) => {
    if (path === '/home') return location.pathname === '/home' || location.pathname.startsWith('/group/');
    return location.pathname.startsWith(path);
  };

  const handlelogout = async () => {
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
      await axios.delete('http://localhost:8080/users/logout', {
        headers: { 'Session-Id': sessionId }
      });
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
  };

  return (
      <div className="taskbar">
        <nav className="taskbar-elem">
          <h3 onClick={() => navigate("/home")} className={`elem ${isActive('/home') ? 'active' : ''}`}>Groups</h3>
          <h3 onClick={() => navigate("/events")} className={`elem ${isActive('/events') ? 'active' : ''}`}>Events</h3>
          <h3 onClick={() => navigate("/forum")} className={`elem ${isActive('/forum') ? 'active' : ''}`}>Forum</h3>
          <h3 onClick={() => navigate("/messages")} className={`elem ${isActive('/messages') ? 'active' : ''}`}>Messages</h3>
          <h3 onClick={() => navigate("/friends")} className={`elem ${isActive('/friends') ? 'active' : ''}`}>Friends</h3>
          {searchEnabled && (
              <h3 onClick={() => navigate("/courseSearch")} className={`elem ${isActive('/courseSearch') ? 'active' : ''}`}>SearchDemo</h3>
          )}
          <img onClick={() => navigate("/profile")} className={`profile ${isActive('/profile') ? 'active-profile' : ''}`} src={profileImage} alt="Profile" />
          <h3 onClick={isLoggingOut ? null : handlelogout} className={`elem logout ${isLoggingOut ? 'disabled' : ''}`} style={{ cursor: isLoggingOut ? 'wait' : 'pointer' }}>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </h3>
        </nav>
      </div>
  );
}

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
  const [groupFilter, setGroupFilter] = useState("all"); // "all", "public", "private"
  const [filteredGroups, setFilteredGroups] = useState([]);
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
              `http://localhost:8080/users/${userEmail}/all-groups-short`,
              { headers: { 'Session-Id': sessionId } }
          );
          setGroups(response.data);
        } catch (error) {
          console.error('Error fetching user groups:', error);
          if (error.response?.status === 401) {
            alert('Session expired. Please login again.');
            navigate('/');
          }
        }

        try {
          const allRes = await axios.get("http://localhost:8080/groups/all-short", {
            headers: { 'Session-Id': sessionId }
          });
          setAllGroups(allRes.data);
          setFilteredGroups(allRes.data); // default shows all groups
        } catch (error) {
          console.error('Error fetching all groups:', error);
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
      result = allGroups.filter(group => group.public === true);
    } else if (groupFilter === "private") {
      result = allGroups.filter(group => group.public === false);
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
                    <div key={group.groupId} className="group-card" onClick={() => handleGroupClick(group.groupId)}>
                      <h3>{group.name}</h3>
                    </div>
                ))
            )}
          </div>
          <button className="scroll-arrow2 right" onClick={() => scrollRight(scrollContainerRef)}>&gt;</button>
        </div>

        <h2 className="section-header">All Groups</h2>
        <div className="all-groups-layout">
          <div className="filters-panel">
            <h3>Filters</h3>
            <label htmlFor="groupFilter">Filter by:</label>
            <select
                id="groupFilter"
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="all">All Groups</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <button className="search-button" onClick={applyGroupFilter}>
              Search
            </button>
          </div>
          <div className="all-groups-grid">
            {filteredGroups.length === 0 ? (
                <p>No groups found.</p>
            ) : (
                filteredGroups.map((group) => (
                    <div key={group.groupId} className="group-card" onClick={() => handleGroupClick(group.groupId)}>
                      <h3>{group.name}</h3>
                      <p>{group.description}</p>
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
          <Route path="/" element={<Login />} />
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
            <Route path="/forum" element={<Nopath />} />
            <Route path="/messages" element={<Nopath />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/courseSearch" element={<CourseSearch />} />
            <Route path="/view-students" element={<ViewStudents />} />
            <Route path="/group/:id" element={<Groups />} />
            <Route path="/event/:eventId" element={<EventDetails />} />
          </Route>
        </Routes>
      </Router>
  );
}

export default App;
