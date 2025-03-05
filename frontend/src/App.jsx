import { BrowserRouter as Router, Routes, Route, useNavigate, Outlet } from 'react-router-dom';
import Registration from './components/Registration';
import Login from './components/Login';
import Confirmation from './components/Confirmation';
import Profile from './components/Profile';
import Nopath from './components/Nopath';
import profileImage from './assets/temp-profile.webp';
import Events from './components/Events';
import CreateEvent from "./components/CreateEvent.jsx";
import Groups from "./components/Groups.jsx";
import './App.css';

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
          <Route path="/profile" element={<Profile />} />
          <Route path="/events" element={<Events />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/forum" element={<Nopath />} /> {/* Placeholder */}
          <Route path="/messages" element={<Nopath />} /> {/* Placeholder */}
          <Route path="/friends" element={<Nopath />} /> {/* Placeholder */}
          <Route path="*" element={<Nopath />} />
        </Route>
      </Routes>
    </Router>
  );
}

function Home() {
  return (
    <div className="home-container">
      <h1>Groups</h1>
    </div>
  );
}

export default App;