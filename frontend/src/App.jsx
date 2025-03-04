import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Registration from './components/Registration';
import Login from './components/Login';
import Confirmation from './components/Confirmation';
import Profile from './components/Profile';
import Nopath from './components/Nopath';
import profileImage from './assets/temp-profile.webp';
import Events from './components/Events';
import CreateEvent from "./components/CreateEvent.jsx";
import './App.css';

function Taskbar() {
  const navigate = useNavigate();
  const handleClick = (e) => {
    console.log('Clicked:', e.target.textContent || 'profile');
    navigate(e.target.textContent);
  };

  return (
    <div className='taskbar'>
      <nav className='taskbar-elem'>
        <h3 onClick={()=>{navigate("/home")}} className='elem'>Groups</h3>
        <h3 onClick={()=>{navigate("/events")}} className='elem'>Events</h3>
        <h3 onClick={()=>{navigate("/forum")}} className='elem'>Forum</h3>
        <h3 onClick={()=>{navigate("/messages")}} className='elem'>Messages</h3>
        <img onClick={()=>{navigate("/profile")}} className='profile' src={profileImage} alt="Profile" />
      </nav>
    </div>
  );
}

function Home() {
  return (
    <>
      <Taskbar />
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />}/>
        <Route path="*" element={<Nopath />} />
          <Route path="/events" element={<Events />} />
          <Route path="/create-event" element={<CreateEvent />} />
      </Routes>
    </Router>
  );
}

export default App;