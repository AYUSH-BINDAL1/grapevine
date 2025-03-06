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
import CreateEvent from "./components/CreateEvent.jsx";
import CreateGroup from "./components/CreateGroup.jsx";
import './App.css';
import './components/Groups.css';

function Taskbar() {
  const navigate = useNavigate();
  
  return (
    <div className='taskbar'>
      <nav className='taskbar-elem'>
        <h3 onClick={()=>{navigate("/home")}} className='elem'>Groups</h3>
        <h3 onClick={()=>{navigate("/events")}} className='elem'>Events</h3>
        <h3 onClick={()=>{navigate("/forum")}} className='elem'>Forum</h3>
        <h3 onClick={()=>{navigate("/messages")}} className='elem'>Messages</h3>
        <h3 onClick={()=>{navigate("/friends")}} className='elem'>Friends</h3>
        <img onClick={()=>{navigate("/profile")}} className='profile' src={profileImage} alt="Profile" />
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
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchGroups = async () => {
      const storedUserInfo = localStorage.getItem('userData');
      const sessionId = localStorage.getItem('sessionId');
      
      if (storedUserInfo && sessionId) {
        const userEmail = JSON.parse(storedUserInfo).userEmail;
        try {
          const response = await axios.get(
            `http://localhost:8080/users/${userEmail}/all-groups-short`,
            {
              headers: {
                'Session-Id': sessionId
              }
            }
          );
          setGroups(response.data);
        } catch (error) {
          console.error('Error fetching groups:', error);
          if (error.response && error.response.status === 401) {
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

  const scrollLeft = () => {
    scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <div className="app">
      <h1>Groups</h1>
      <button onClick={handleCreateGroup} className="create-group-button">
        Create Group
      </button>
      <div className="scroll-wrapper2">
        <button className="scroll-arrow2 left" onClick={scrollLeft}>&lt;</button>
        <div className="scroll-container2" ref={scrollContainerRef}>
          {groups.length === 0 ? (
            <p>You are not part of any groups. Create one or join an existing group!</p>
          ) : (
            groups.map((group) => (
              <div key={group.groupId} className="group-card" onClick={() => handleGroupClick(group.groupId)}>
                <h3>{group.name || group.groupName || 'Unnamed Group'}</h3>
                <p>ID: {group.groupId}</p> {/* Temporarily add this to see if IDs show */}
              </div>
            ))
          )}
        </div>
        <button className="scroll-arrow2 right" onClick={scrollRight}>&gt;</button>
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
        
        {/* Protected routes with taskbar */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/create-group" element={<CreateGroup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/events" element={<Events />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/forum" element={<Nopath />} /> {/* Placeholder */}
          <Route path="/messages" element={<Nopath />} /> {/* Placeholder */}
          <Route path="/friends" element={<Nopath />} /> {/* Placeholder */}
          <Route path="/group/:id" element={<Groups />} />
          <Route path="*" element={<Nopath />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;