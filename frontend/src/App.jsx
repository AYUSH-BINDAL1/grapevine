import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Registration from './components/Registration';
import Login from './components/Login';
import Confirmation from './components/Confirmation';
import Profile from './components/Profile';
import profileImage from './assets/temp-profile.webp';
import './App.css';

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
        <Route path="/" element={<Login />} />
        <Route path="/Registration" element={<Registration />} />
        <Route path="/Confirmation" element={<Confirmation />} />
        <Route path="/home" element={<Home />} />
        <Route path="/Profile" element={<Profile />}/>
      </Routes>
    </Router>
  );
}

export default App;