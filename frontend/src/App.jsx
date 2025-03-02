import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Registration from './components/Registration';
import profileImage from './assets/temp-profile.webp';
import Events from './components/Events';
import './App.css';
import CreateEvent from "./components/CreateEvent.jsx";
import Profile from "./components/Profile.jsx";
import Login from "./components/Login.jsx";
import Confirmation from "./components/Confirmation.jsx";

function Taskbar() {
  const handleClick = (e) => {
    console.log('Clicked:', e.target.textContent || 'profile');
  };

  return (
    <div className='taskbar'>
      <nav className='taskbar-elem'>
        <h3 onClick={handleClick} className='elem'>Groups</h3>
        <h3 onClick={handleClick} className='elem'>Events</h3>
        <h3 onClick={handleClick} className='elem'>Forum</h3>
        <h3 onClick={handleClick} className='elem'>Messages</h3>
        <img onClick={handleClick} className='profile' src={profileImage} alt="Profile" />
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
                <Route path="/" element={<Registration />} />
                <Route path="/home" element={<Home />} />
                <Route path="/events" element={<Events />} />
                <Route path="/create-event" element={<CreateEvent />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/confirmation" element={<Confirmation />} />
            </Routes>
        </Router>
    );
}

export default App;