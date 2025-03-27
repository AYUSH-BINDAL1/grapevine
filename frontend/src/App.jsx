import { BrowserRouter as Router, Routes, Route, useNavigate, Outlet } from 'react-router-dom';
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
import './components/Groups.css';

export const searchEnabled = true;

function Taskbar() {
  const navigate = useNavigate();
  
  return (
      <div className="taskbar">
        <nav className="taskbar-elem">
          <h3 onClick={() => navigate("/home")} className="elem">Groups</h3>
          <h3 onClick={() => navigate("/events")} className="elem">Events</h3>
          <h3 onClick={() => navigate("/forum")} className="elem">Forum</h3>
          <h3 onClick={() => navigate("/messages")} className="elem">Messages</h3>
          <h3 onClick={() => navigate("/friends")} className="elem">Friends</h3>
          {searchEnabled && (
            <h3 onClick={() => navigate("/courseSearch")} className="elem">SearchDemo</h3>
          )}
          <img onClick={() => navigate("/profile")} className="profile" src={profileImage} alt="Profile" />
        </nav>
      </div>
  );
}

// Layout component that includes Taskbar and renders child routes
function Layout() {
  return (
    <>
      <Taskbar />
      <Outlet /> {/* This is where child routes will be rendered */}
    </>
  );
}

function Home() {
  const [groups, setGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [showPrivate, setShowPrivate] = useState(false);
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const allGroupsScrollRef = useRef(null);

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
                <p>You are not part of any groups.</p>
            ) : (
                groups.map((group) => (
                    <div
                        key={group.groupId}
                        className="group-card"
                        onClick={() => handleGroupClick(group.groupId)}
                    >
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
            <label>
              <input
                  type="checkbox"
                  checked={showPrivate}
                  onChange={(e) => setShowPrivate(e.target.checked)}
              /> Private Groups
            </label>
          </div>
          <div className="all-groups-grid">
            {allGroups.length === 0 ? (
                <p>No groups found.</p>
            ) : (
                allGroups.map((group) => (
                    <div
                        key={group.groupId}
                        className="group-card"
                        onClick={() => handleGroupClick(group.groupId)}
                    >
                      <h3>{group.name}</h3>
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
        {/* Public routes without taskbar */}
        <Route path="/" element={<Login />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/user/:userId" element={<UsrProfile />} />
        
        {/* Protected routes with taskbar */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/create-group" element={<CreateGroup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/events" element={<Events />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/forum" element={<Nopath />} /> {/* Placeholder */}
          <Route path="/messages" element={<Nopath />} /> {/* Placeholder */}
          <Route path="/friends" element={<Friends />} /> {/* Placeholder */}
          <Route path="/courseSearch" element={<CourseSearch />} />
          <Route path="/view-students" element={<ViewStudents />} />
          <Route path="/group/:id" element={<Groups />} />
          <Route path="/event/:eventId" element={<EventDetails />} />
          <Route path="*" element={<Nopath />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;